import asyncio
from .websocket_manager import WebSocketManagerBase
from fastapi import WebSocket
from typing import Any, Dict
from ..config.config import config
from ..redis.redis_progress_manager import RedisProgressManager

class VideoProgressWebSocketManager(WebSocketManagerBase):
    def __init__(self):
        super().__init__(config.redis.url)
        self.progress = RedisProgressManager(config.redis.url)

    def get_progress_state(self, video_id: str) -> Dict[str, Any]:
        return self.progress.get_progress_state(video_id)

    def add_frame_in_process(self, video_id: str, frame_idx: int):
        self.progress.add_frame_in_process(video_id, frame_idx)

    def add_frame_done(self, video_id: str, frame_idx: int):
        self.progress.add_frame_done(video_id, frame_idx)

    def publish_progress_sync(self, video_id: str, message: str):
        print(f"[VideoProgressWSManager] publish_progress_sync: {video_id} {message}")
        asyncio.run(self.publish(f"progress:{video_id}", message))

    async def publish_progress(self, video_id: str, message: str):
        print(f"[VideoProgressWSManager] publish_progress (async): {video_id} {message}")
        await self.publish(f"progress:{video_id}", message) 