import os
import subprocess
import tempfile
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict
import requests
import chromadb
from chromadb.utils import embedding_functions
import asyncio
from .valkey_pubsub import publish_progress, add_frame_in_process, add_frame_done
import base64
import json
from db import VideoDB
from .utils import get_frame_url


DATA_DIR = ".data"
UPLOAD_DIR = os.path.join(DATA_DIR, "uploaded_videos")
CHROMA_DIR = os.path.join(DATA_DIR, "chromadb")
FRAMES_DIR = os.path.join(DATA_DIR, "frames")
LAVA_API_URL = "http://localhost:11434/api/generate"

os.makedirs(FRAMES_DIR, exist_ok=True)
logging.basicConfig(level=logging.INFO)

# ChromaDB setup
client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = client.get_or_create_collection("video_frames")

def get_embedding(text: str) -> List[float]:
    
    ef = embedding_functions.DefaultEmbeddingFunction()
    return ef([text])[0]

# LLaVA (Ollama) description generation
def generate_description(frame_path: str) -> str:
    with open(frame_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()
    payload = {
        "model": "llava",
        "prompt": "Describe this image in detail.",
        "images": [img_b64]
    }
    response = requests.post(LAVA_API_URL, json=payload, stream=True)
    response.raise_for_status()
    description = ""
    for line in response.iter_lines():
        if line:
            try:
                obj = json.loads(line)
                if "response" in obj:
                    description += obj["response"]
            except Exception:
                continue
    return description.strip()

def extract_frames(video_path: str, output_dir: str, fps: int = 1) -> List[str]:
    os.makedirs(output_dir, exist_ok=True)
    frame_pattern = os.path.join(output_dir, "frame_%05d.jpg")
    cmd = [
        "ffmpeg", "-i", video_path, "-vf", f"fps={fps}", frame_pattern, "-hide_banner", "-loglevel", "error"
    ]
    subprocess.run(cmd, check=True)
    frames = sorted([
        os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.startswith("frame_")
    ])
    return frames

def process_frame(frame_path: str, video_id: str, frame_idx: int) -> Dict:
    logging.info(f"Processing frame {frame_idx}: {frame_path}")
    from .valkey_pubsub import publish_progress_sync
    frame_url = get_frame_url(video_id, frame_idx)
    add_frame_in_process(video_id, frame_idx)
    publish_progress_sync(video_id, json.dumps({
        "type": "frame_processing",
        "data": {"frame_idx": frame_idx, "frame_url": frame_url}
    }))
    description = generate_description(frame_path)
    vector = get_embedding(description)
    metadata = {
        "video_id": video_id,
        "frame_idx": frame_idx,
        "frame_path": frame_path,
        "description": description
    }
    collection.add(
        embeddings=[vector],
        metadatas=[metadata],
        ids=[f"{video_id}_frame_{frame_idx}"]
    )
    logging.info(f"Stored vector for frame {frame_idx}")
    add_frame_done(video_id, frame_idx)
    publish_progress_sync(video_id, json.dumps({
        "type": "frame_processed",
        "data": {"frame_idx": frame_idx, "frame_url": frame_url, "description": description}
    }))
    return metadata

def process_video_frames(video_id: str, video_path: str, fps: int = 1, max_workers: int = 4):
    import json
    from .valkey_pubsub import publish_progress_sync
    video_db = VideoDB()
    frame_output_dir = os.path.join(FRAMES_DIR, video_id)
    frames = extract_frames(video_path, frame_output_dir, fps=fps)
    logging.info(f"Extracted {len(frames)} frames from {video_path}")
    # Update ChromaDB with frame count and processing state
    video_db.update_processing_state(video_id, processing_state='processing', frame_count=len(frames))
    publish_progress_sync(video_id, json.dumps({
        "type": "frames_extracted",
        "data": {"frame_count": len(frames), "video_id": video_id}
    }))
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_idx = {
            executor.submit(process_frame, frame, video_id, idx): idx
            for idx, frame in enumerate(frames)
        }
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                logging.error(f"Error processing frame {idx}: {e}")
                publish_progress_sync(video_id, json.dumps({
                    "type": "frame_error",
                    "data": {"frame_idx": idx, "error": str(e)}
                }))
    video_db.update_processing_state(video_id, processing_state='success')
    publish_progress_sync(video_id, json.dumps({
        "type": "all_frames_processed",
        "data": {"video_id": video_id}
    }))
    return results 