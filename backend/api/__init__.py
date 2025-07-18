from fastapi import APIRouter, UploadFile, File, HTTPException, Body, BackgroundTasks, WebSocket, WebSocketDisconnect, Query, Request
from fastapi.responses import JSONResponse
from ..db import VideoDB
from ..video import VideoStorage, sanitize_video_id
from ..video.frame_processing import process_video_frames, FRAMES_DIR
import asyncio
import redis.asyncio as aioredis
import shutil
import os
from chromadb.utils import embedding_functions
import json
from ..streaming.video_progress_ws_manager import VideoProgressWebSocketManager
from ..streaming.types import ProgressStateData, ProgressStateEvent
from .video_jobs import q  # Import the RQ queue
from ..video.video_worker import process_video_job  # Import the job function
import chromadb

VALKEY_URL = "redis://localhost:6379"  # Adjust as needed
video_progress_ws_manager = VideoProgressWebSocketManager()
CHROMA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".data", "chromadb"))

def get_frame_collection():
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    return client.get_or_create_collection("video_frames")

router = APIRouter()
video_db = VideoDB()
video_storage = VideoStorage()


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    # Generate raw video_id and sanitize it immediately
    from datetime import datetime
    raw_video_id = f"{file.filename}-{datetime.utcnow().isoformat()}"
    video_id = sanitize_video_id(raw_video_id)
    video_info = await video_storage.save_video(file, video_id=video_id)
    video_db.add_video(
        video_id=video_info['video_id'],
        save_path=video_info['save_path'],
        file_name=video_info['file_name'],
        created_at=video_info['created_at'],
        updated_at=video_info['updated_at']
    )
    # Enqueue video processing job in Redis queue
    q.enqueue(process_video_job, video_info['save_path'], video_info['video_id'])
    return JSONResponse({"status": "done", "video_id": video_info['video_id'], "processing": "queued"})

@router.get("/videos")
def list_videos():
    videos = video_db.list_videos()
    return JSONResponse(videos)

@router.delete("/videos/{video_id}")
def delete_video(video_id: str):
    results = video_db.collection.get(ids=[video_id])
    if not results['metadatas']:
        raise HTTPException(status_code=404, detail="Video not found")
    save_path = results['documents'][0]
    video_db.delete_video(video_id)
    video_storage.delete_video_file(save_path)
    # Delete frames directory
    frames_dir = os.path.join(FRAMES_DIR, video_id.replace(":", "_").replace(" ", "_"))
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir, ignore_errors=True)
    # Delete uploaded_videos directory
    uploaded_dir = os.path.dirname(save_path)
    if os.path.exists(uploaded_dir):
        shutil.rmtree(uploaded_dir, ignore_errors=True)
    # Delete all frame vectors from ChromaDB for this video
    frame_collection = get_frame_collection()
    frame_collection.delete(where={"video_id": video_id})
    return JSONResponse({"status": "deleted", "video_id": video_id})

@router.patch("/videos/{video_id}")
def update_video(video_id: str, video_name: str = Body(..., embed=True)):
    try:
        video_db.update_video(video_id, video_name=video_name)
    except ValueError:
        raise HTTPException(status_code=404, detail="Video not found")
    return JSONResponse({"status": "updated", "video_id": video_id, "video_name": video_name})

@router.websocket("/ws/progress/{video_id}")
async def websocket_progress(websocket: WebSocket, video_id: str):
    print(f"[WebSocket] New connection for video_id={video_id}")
    async def on_receive(data):
        try:
            print(f"[WebSocket] Received data for video_id={video_id}: {data}")
            msg = json.loads(data)
            if msg.get("type") == "get_progress":
                print(f"[WebSocket] Handling get_progress for video_id={video_id}")
                progress = video_progress_ws_manager.get_progress_state(video_id)
                print(f"[WebSocket] Progress state for video_id={video_id}: {progress}")
                extraction_in_progress = (progress.get('total_frames', 0) == 0)
                progress_data = ProgressStateData(**progress)
                event = ProgressStateEvent(type="progress_state", data=progress_data)
                event_dict = event.dict()
                event_dict['extraction_in_progress'] = extraction_in_progress
                print(f"[WebSocket] Sending ProgressStateEvent for video_id={video_id}: {event_dict}")
                await video_progress_ws_manager.send_json(video_id, event_dict)
                print(f"[WebSocket] Sent progress_state for video_id={video_id}")
        except Exception as e:
            print(f"[WebSocket] Error in on_receive for video_id={video_id}: {e}")
    await video_progress_ws_manager.handle_websocket_with_pubsub(
        key=video_id,
        websocket=websocket,
        channel=f"progress:{video_id}",
        on_receive=on_receive
    )

@router.post("/search")
async def search_frames(request: Request):
    data = await request.json() if request.method == 'POST' else {}
    query = data.get('query')
    video_ids = data.get('video_ids')
    ef = embedding_functions.DefaultEmbeddingFunction()
    query_vec = ef([query])[0]
    chroma_query = {
        'query_embeddings': [query_vec],
        'n_results': 10,
        'include': ["metadatas"]
    }
    if video_ids:
        chroma_query['where'] = {'video_id': {'$in': video_ids}}
    frame_collection = get_frame_collection()
    results = frame_collection.query(**chroma_query)
    matches = []
    for meta in results.get("metadatas", [[]])[0]:
        video_info = video_db.collection.get(ids=[meta["video_id"]])
        video_name = None
        if video_info and video_info.get('metadatas') and len(video_info['metadatas']) > 0:
            video_name = video_info['metadatas'][0].get('video_name')
        matches.append({
            "video_id": meta["video_id"],
            "frame_idx": meta["frame_idx"],
            "description": meta["description"],
            "timestamp": meta.get("timestamp"),
            "video_name": video_name
        })
    return {"results": matches} 