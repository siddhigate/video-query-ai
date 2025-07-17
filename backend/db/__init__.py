import os
import chromadb

DATA_DIR = ".data"
CHROMA_DIR = os.path.join(DATA_DIR, "chromadb")

class VideoDB:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_DIR)
        self.collection = self.client.get_or_create_collection("videos")

    def add_video(self, video_id, save_path, file_name, created_at, updated_at):
        self.collection.add(
            documents=[save_path],
            metadatas=[{
                "video_id": video_id,
                "video_name": file_name,
                "created_at": created_at,
                "updated_at": updated_at
            }],
            ids=[video_id]
        )

    def list_videos(self):
        results = self.collection.get()
        videos = []
        for meta in results.get('metadatas', []):
            video = {
                'video_id': meta.get('video_id'),
                'video_name': meta.get('video_name'),
                'created_at': meta.get('created_at'),
                'updated_at': meta.get('updated_at'),
            }
            videos.append(video)
        return videos 