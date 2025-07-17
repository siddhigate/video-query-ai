from .redis_manager_base import RedisManagerBase
from ..video.utils import get_frame_url
from typing import Dict, Any
from ..db import VideoDB

class RedisProgressManager(RedisManagerBase):
    def get_progress_state(self, video_id: str) -> Dict[str, Any]:
        # Fetch total_frames from VideoDB
        video_db = VideoDB()
        _, total_frames = video_db.get_processing_state(video_id)
        if total_frames is None or total_frames == 0:
            # Extraction not done yet
            in_process_with_urls = []
            done_with_urls = []
            first_frame_url = None
            total_frames = 0
        else:
            in_process = [int(x) for x in self.smembers(f"progress:{video_id}:in_process")]
            done = [int(x) for x in self.smembers(f"progress:{video_id}:done")]
            in_process_with_urls = [
                {"frame_idx": idx, "frame_url": get_frame_url(video_id, idx)} for idx in in_process
            ]
            done_with_urls = [
                {"frame_idx": idx, "frame_url": get_frame_url(video_id, idx)} for idx in done
            ]
            first_frame_url = get_frame_url(video_id, 0)
        return {"in_process": in_process_with_urls, "done": done_with_urls, "total_frames": total_frames, "first_frame_url": first_frame_url}

    def add_frame_in_process(self, video_id: str, frame_idx: int):
        self.sadd(f"progress:{video_id}:in_process", frame_idx)

    def add_frame_done(self, video_id: str, frame_idx: int):
        self.srem(f"progress:{video_id}:in_process", frame_idx)
        self.sadd(f"progress:{video_id}:done", frame_idx)

    def set_progress_value(self, key: str, value: Any):
        self.set(key, value)

    def get_progress_value(self, key: str) -> Any:
        return self.get(key) 