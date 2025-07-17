from fastapi import APIRouter, UploadFile, File
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