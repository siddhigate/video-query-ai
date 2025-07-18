from fastapi import APIRouter, UploadFile, File
from redis import Redis
from rq import Queue
import os
import uuid

router = APIRouter()

redis_conn = Redis(host=os.getenv('REDIS_HOST', 'localhost'), port=int(os.getenv('REDIS_PORT', 6379)))
q = Queue('video-jobs', connection=redis_conn)

def process_video_job(video_path, job_id):
    # Placeholder for actual processing logic
    pass

@router.post('/enqueue_video_job')
def enqueue_video_job(file: UploadFile = File(...)):
    # Save uploaded file to disk
    video_path = f"/tmp/{file.filename}"
    with open(video_path, 'wb') as f:
        f.write(file.file.read())
    # Generate a unique job_id
    job_id = str(uuid.uuid4())
    # Enqueue job with job_id
    job = q.enqueue(process_video_job, video_path, job_id)
    return {"job_id": job_id} 