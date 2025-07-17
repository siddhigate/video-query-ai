from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
from db import VideoDB
from video import VideoStorage

router = APIRouter()
video_db = VideoDB()
video_storage = VideoStorage()

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
  
    video_info = await video_storage.save_video(file)
    
    video_db.add_video(
        video_id=video_info['video_id'],
        save_path=video_info['save_path'],
        file_name=video_info['file_name'],
        created_at=video_info['created_at'],
        updated_at=video_info['updated_at']
    )
    return JSONResponse({"status": "done", "video_id": video_info['video_id']})

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
    return JSONResponse({"status": "deleted", "video_id": video_id})

@router.put("/videos/{video_id}")
def update_video(video_id: str, video_name: str = Body(..., embed=True)):
    try:
        video_db.update_video(video_id, video_name=video_name)
    except ValueError:
        raise HTTPException(status_code=404, detail="Video not found")
    return JSONResponse({"status": "updated", "video_id": video_id, "video_name": video_name}) 