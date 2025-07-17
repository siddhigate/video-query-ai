import redis.asyncio as aioredis
import redis

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