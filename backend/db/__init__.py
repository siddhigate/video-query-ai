import os
import chromadb

def sanitize_video_id(video_id: str) -> str:
    return video_id.replace(":", "_").replace(" ", "_")

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".data"))
CHROMA_DIR = os.path.join(DATA_DIR, "chromadb")

class VideoDB:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_DIR)
        self.collection = self.client.get_or_create_collection("videos")

    def add_video(self, video_id, save_path, file_name, created_at, updated_at, processing_state='processing', frame_count=0):
        video_id = sanitize_video_id(video_id)
        self.collection.add(
            documents=[save_path],
            metadatas=[{
                "video_id": video_id,
                "video_name": file_name,
                "created_at": created_at,
                "updated_at": updated_at,
                "processing_state": processing_state,
                "frame_count": frame_count
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
                'processing_state': meta.get('processing_state', 'processing'),
                'frame_count': meta.get('frame_count', 0),
            }
            videos.append(video)
        return videos

    def delete_video(self, video_id):
        self.collection.delete(ids=[video_id])

    def update_video(self, video_id, **kwargs):
        results = self.collection.get(ids=[video_id])
        if not results['metadatas']:
            raise ValueError('Video not found')
        meta = results['metadatas'][0]
        meta.update(kwargs)
        self.collection.delete(ids=[video_id])
        self.collection.add(
            documents=results['documents'],
            metadatas=[meta],
            ids=[video_id]
        )

    def update_processing_state(self, video_id, processing_state=None, frame_count=None):
        results = self.collection.get(ids=[video_id])
        if not results['metadatas']:
            raise ValueError('Video not found')
        meta = results['metadatas'][0]
        if processing_state is not None:
            meta['processing_state'] = processing_state
        if frame_count is not None:
            meta['frame_count'] = frame_count
        self.collection.delete(ids=[video_id])
        self.collection.add(
            documents=results['documents'],
            metadatas=[meta],
            ids=[video_id]
        )

    def get_processing_state(self, video_id):
        results = self.collection.get(ids=[video_id])
        if not results['metadatas']:
            return None
        meta = results['metadatas'][0]
        return meta.get('processing_state', 'processing'), meta.get('frame_count', 0) 