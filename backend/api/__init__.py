from fastapi import APIRouter, UploadFile, File, HTTPException, Body, BackgroundTasks, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse
from db import VideoDB
from video import VideoStorage
from video.frame_processing import process_video_frames
import asyncio
import redis.asyncio as aioredis
import shutil
import os
from video.frame_processing import FRAMES_DIR, collection as frame_collection
from chromadb.utils import embedding_functions
import json
from video.valkey_pubsub import get_progress_state

class WebSocketManager:
    def __init__(self):
        self.active_connections = {}
    async def connect(self, video_id, websocket):
        await websocket.accept()
        self.active_connections[video_id] = websocket
    def disconnect(self, video_id):
        if video_id in self.active_connections:
            del self.active_connections[video_id]
    async def send_json(self, video_id, data):
        ws = self.active_connections.get(video_id)
        if ws:
            await ws.send_text(json.dumps(data))

ws_manager = WebSocketManager()

router = APIRouter()
video_db = VideoDB()
video_storage = VideoStorage()

VALKEY_URL = "redis://localhost:6379"  # Adjust as needed

@router.post("/upload")
async def upload_video(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
  
    video_info = await video_storage.save_video(file)
    
    video_db.add_video(
        video_id=video_info['video_id'],
        save_path=video_info['save_path'],
        file_name=video_info['file_name'],
        created_at=video_info['created_at'],
        updated_at=video_info['updated_at']
    )
    # Start frame processing in the background
    if background_tasks is not None:
        background_tasks.add_task(process_video_frames, video_info['video_id'], video_info['save_path'])
    return JSONResponse({"status": "done", "video_id": video_info['video_id'], "processing": "started"})

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
    frames_dir = os.path.join(FRAMES_DIR, video_id)
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir, ignore_errors=True)
    # Delete uploaded_videos directory
    uploaded_dir = os.path.dirname(save_path)
    if os.path.exists(uploaded_dir):
        shutil.rmtree(uploaded_dir, ignore_errors=True)
    # Delete all frame vectors from ChromaDB for this video
    frame_collection.delete(where={"video_id": video_id})
    return JSONResponse({"status": "deleted", "video_id": video_id})

@router.put("/videos/{video_id}")
def update_video(video_id: str, video_name: str = Body(..., embed=True)):
    try:
        video_db.update_video(video_id, video_name=video_name)
    except ValueError:
        raise HTTPException(status_code=404, detail="Video not found")
    return JSONResponse({"status": "updated", "video_id": video_id, "video_name": video_name}) 

@router.websocket("/ws/progress/{video_id}")
async def websocket_progress(websocket: WebSocket, video_id: str):
    await ws_manager.connect(video_id, websocket)
    redis = aioredis.from_url(VALKEY_URL)
    pubsub = redis.pubsub()
    channel = f"progress:{video_id}"
    await pubsub.subscribe(channel)
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=10.0)
            if message and message["type"] == "message":
                await websocket.send_text(message["data"].decode())
            # Check for frontend request for progress
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                if data:
                    try:
                        msg = json.loads(data)
                        if msg.get("type") == "get_progress":
                            progress = get_progress_state(video_id)
                            await ws_manager.send_json(video_id, {"type": "progress_state", "data": progress})
                    except Exception:
                        pass
            except asyncio.TimeoutError:
                pass
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        ws_manager.disconnect(video_id)
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await redis.close() 

@router.post("/search")
def search_frames(query: str = Query(...)):
    # Vectorize the query
    ef = embedding_functions.DefaultEmbeddingFunction()
    query_vec = ef([query])[0]
    # Search ChromaDB for similar frames
    results = frame_collection.query(
        query_embeddings=[query_vec],
        n_results=10,
        include=["metadatas"]
    )
    matches = []
    for meta in results.get("metadatas", [[]])[0]:
        matches.append({
            "video_id": meta["video_id"],
            "frame_idx": meta["frame_idx"],
            "description": meta["description"]
        })
    return {"results": matches} 