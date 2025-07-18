import os
import time
import logging
import multiprocessing
multiprocessing.set_start_method("spawn", force=True)
from redis import Redis
from rq import Worker, Queue
from ..video.frame_processing import process_video_frames
from ..config.config import config

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

def process_video_job(video_path, job_id):
    try:
        logger.info("=== Starting process_video_frames ===")
        process_video_frames(job_id, video_path)
        logger.info("=== Finished process_video_frames ===")
    except Exception as e:
        logger.exception("Error during job")
        raise

if __name__ == "__main__":
    try:
        redis_conn = Redis.from_url(config.redis.url)
        from rq import SimpleWorker, Queue
        queue = Queue('video-jobs', connection=redis_conn)
        worker = SimpleWorker([queue], connection=redis_conn)
        logger.info("Starting RQ SimpleWorker for 'video-jobs' queue (no fork, for debugging)...")
        worker.work()
    except Exception as e:
        logger.exception("Worker failed to start or crashed.")
        raise 