import os
import time
from redis import Redis
from rq import Worker, Queue, Connection
from ..video.frame_processing import process_video_frames
from ..config.config import config

def process_video_job(video_path, job_id):
    # Actually process the video using the real function
    # The process_video_frames function should handle progress publishing
    process_video_frames(job_id, video_path)

if __name__ == "__main__":
    redis_conn = Redis.from_url(config.redis.url)
    with Connection(redis_conn):
        worker = Worker(['video-jobs'])
        worker.work() 