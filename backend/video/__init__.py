import os
from datetime import datetime
import re

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".data"))
UPLOAD_DIR = os.path.join(DATA_DIR, "uploaded_videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def sanitize_video_id(video_id):
    return re.sub(r'[: ]', '_', video_id)

class VideoStorage:
    def save_video(self, file, video_id=None):
        chunk_size = 1024 * 1024  # 1MB
        now = datetime.utcnow().isoformat()
        if video_id is None:
            raw_video_id = f"{file.filename}-{now}"
            video_id = sanitize_video_id(raw_video_id)
        _, ext = os.path.splitext(file.filename)
        ext = ext if ext else ""
        video_folder = os.path.join(UPLOAD_DIR, video_id)
        os.makedirs(video_folder, exist_ok=True)
        video_filename = f"video{ext}"
        save_path = os.path.join(video_folder, video_filename)
        return self._write_file(file, save_path, chunk_size, video_id, now)

    async def _write_file(self, file, save_path, chunk_size, video_id, now):
        with open(save_path, "wb") as f:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
        return {
            'video_id': video_id,
            'save_path': save_path,
            'file_name': file.filename,
            'created_at': now,
            'updated_at': now
        }

    def delete_video_file(self, save_path):
        if os.path.exists(save_path):
            os.remove(save_path)
            # Remove the folder if empty
            folder = os.path.dirname(save_path)
            if os.path.isdir(folder) and not os.listdir(folder):
                os.rmdir(folder)

