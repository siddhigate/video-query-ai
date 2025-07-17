import redis.asyncio as aioredis
import redis
from .utils import get_frame_url

VALKEY_URL = "redis://localhost:6379"  # Adjust as needed

async def publish_progress(video_id: str, message: str):
    redis = aioredis.from_url(VALKEY_URL)
    channel = f"progress:{video_id}"
    await redis.publish(channel, message)
    await redis.close()

def publish_progress_sync(video_id: str, message: str):
    r = redis.Redis.from_url(VALKEY_URL)
    channel = f"progress:{video_id}"
    r.publish(channel, message)
    r.close()

def add_frame_in_process(video_id: str, frame_idx: int):
    r = redis.Redis.from_url(VALKEY_URL)
    r.sadd(f"progress:{video_id}:in_process", frame_idx)
    r.close()

def add_frame_done(video_id: str, frame_idx: int):
    r = redis.Redis.from_url(VALKEY_URL)
    r.srem(f"progress:{video_id}:in_process", frame_idx)
    r.sadd(f"progress:{video_id}:done", frame_idx)
    r.close()

def get_progress_state(video_id: str):
    r = redis.Redis.from_url(VALKEY_URL)
    in_process = list(r.smembers(f"progress:{video_id}:in_process"))
    done = list(r.smembers(f"progress:{video_id}:done"))
    r.close()
    # Convert bytes to int
    in_process = [int(x) for x in in_process]
    done = [int(x) for x in done]
    in_process_with_urls = [
        {"frame_idx": idx, "frame_url": get_frame_url(video_id, idx)} for idx in in_process
    ]
    done_with_urls = [
        {"frame_idx": idx, "frame_url": get_frame_url(video_id, idx)} for idx in done
    ]
    return {"in_process": in_process_with_urls, "done": done_with_urls} 