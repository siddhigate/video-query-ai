import os
import subprocess
import tempfile
import logging
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict
import requests
import chromadb
from chromadb.utils import embedding_functions
import asyncio
from ..streaming.video_progress_ws_manager import VideoProgressWebSocketManager
from ..streaming.types import FrameProcessingEvent, FrameProcessedEvent, FrameErrorEvent
import base64
import json
from ..db import VideoDB
from .utils import get_frame_url
import json as pyjson
import re

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".data"))
UPLOAD_DIR = os.path.join(DATA_DIR, "uploaded_videos")
CHROMA_DIR = os.path.join(DATA_DIR, "chromadb")
FRAMES_DIR = os.path.join(DATA_DIR, "frames")
LAVA_API_URL = "http://localhost:11434/api/generate"

os.makedirs(FRAMES_DIR, exist_ok=True)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ChromaDB setup
# client = chromadb.PersistentClient(path=CHROMA_DIR)
# collection = client.get_or_create_collection("video_frames")

VALKEY_URL = "redis://localhost:6379"
video_progress_ws_manager = VideoProgressWebSocketManager()

def get_embedding(text: str) -> List[float]:
    try:
        logger.info(f"Generating embedding for text: {text[:60]}...")
        ef = embedding_functions.DefaultEmbeddingFunction()
        return ef([text])[0]
    except Exception as e:
        logger.error(f"Error in get_embedding: {e}\n{traceback.format_exc()}")
        raise

# LLaVA (Ollama) description generation
def generate_description(frame_path: str) -> str:
    try:
        logger.info(f"Generating description for frame: {frame_path}")
        with open(frame_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()
        payload = {
            "model": "llava",
            "prompt": "Describe this image in detail.",
            "images": [img_b64]
        }
        logger.info(f"Sending request to LAVA_API_URL: {LAVA_API_URL}")
        response = requests.post(LAVA_API_URL, json=payload, stream=True)
        response.raise_for_status()
        description = ""
        for line in response.iter_lines():
            if line:
                try:
                    obj = json.loads(line)
                    if "response" in obj:
                        description += obj["response"]
                except Exception as e:
                    logger.warning(f"Error parsing line from LLaVA: {e}")
                    continue
        return description.strip()
    except Exception as e:
        logger.error(f"Error in generate_description: {e}\n{traceback.format_exc()}")
        raise

def get_video_fps_and_duration(video_path: str):
    """Return (fps, duration) for the video using ffprobe."""
    cmd = [
        'ffprobe', '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=avg_frame_rate,duration',
        '-of', 'json', video_path
    ]
    try:
        logger.info(f"Running ffprobe: {' '.join(cmd)}")
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        info = pyjson.loads(result.stdout)
        stream = info['streams'][0]
        num, denom = map(int, stream['avg_frame_rate'].split('/'))
        fps = num / denom if denom != 0 else 1
        duration = float(stream['duration'])
        return fps, duration
    except Exception as e:
        logger.error(f"ffprobe failed: {e}\nStderr: {getattr(e, 'stderr', None)}\n{traceback.format_exc()}")
        raise

def extract_frames(video_path: str, output_dir: str, fps: int = 1) -> List[str]:
    os.makedirs(output_dir, exist_ok=True)
    frame_pattern = os.path.join(output_dir, "frame_%05d.jpg")
    cmd = [
        "ffmpeg", "-i", video_path, "-vf", f"fps={fps}", frame_pattern, "-hide_banner", "-loglevel", "error"
    ]
    try:
        logger.info(f"Running ffmpeg: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)
    except Exception as e:
        logger.error(f"ffmpeg failed: {e}\nStderr: {getattr(e, 'stderr', None)}\n{traceback.format_exc()}")
        raise
    frames = sorted([
        os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.startswith("frame_")
    ])
    return frames

def sanitize_video_id(video_id):
    return re.sub(r'[: ]', '_', video_id)

def process_frame(frame_path: str, video_id: str, frame_idx: int, timestamp: float, collection=None) -> Dict:
    try:
        if collection is None:
            client = chromadb.PersistentClient(path=CHROMA_DIR)
            collection = client.get_or_create_collection("video_frames")
        frame_url = get_frame_url(video_id, frame_idx)
        video_progress_ws_manager.add_frame_in_process(video_id, frame_idx)
        video_db = VideoDB()
        _, total_frames = video_db.get_processing_state(video_id)
        event = FrameProcessingEvent(data={
            "frame_idx": frame_idx,
            "frame_url": frame_url,
            "timestamp": timestamp,
            "total_frames": total_frames
        })
        video_progress_ws_manager.publish_progress_sync(video_id, event.json())
        description = generate_description(frame_path)
        vector = get_embedding(description)
        metadata = {
            "video_id": video_id,
            "frame_idx": frame_idx,
            "frame_path": frame_path,
            "description": description,
            "timestamp": timestamp
        }
        collection.add(
            embeddings=[vector],
            metadatas=[metadata],
            ids=[f"{video_id}_frame_{frame_idx}"]
        )
        video_progress_ws_manager.add_frame_done(video_id, frame_idx)
        event = FrameProcessedEvent(data={
            "frame_idx": frame_idx,
            "frame_url": frame_url,
            "description": description,
            "timestamp": timestamp,
            "total_frames": total_frames
        })
        video_progress_ws_manager.publish_progress_sync(video_id, event.json())
        return metadata
    except Exception as e:
        logger.error(f"Error in process_frame (frame_idx={frame_idx}): {e}\n{traceback.format_exc()}")
        raise

def process_video_frames(video_id: str, video_path: str, fps: int = 1, max_workers: int = 4):
    try:
        video_db = VideoDB()
        sanitized_video_id = sanitize_video_id(video_id)
        frame_output_dir = os.path.join(FRAMES_DIR, sanitized_video_id)
        actual_fps, duration = get_video_fps_and_duration(video_path)
        frames = extract_frames(video_path, frame_output_dir, fps=fps)
        video_db.update_processing_state(video_id, processing_state='processing', frame_count=len(frames))
        video_progress_ws_manager.publish_progress_sync(video_id, json.dumps({
            "type": "frames_extracted",
            "data": {"frame_count": len(frames), "video_id": video_id}
        }))
        results = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            timestamps = [(i / fps) for i in range(len(frames))]
            future_to_idx = {
                executor.submit(process_frame, frame, video_id, idx, timestamps[idx]): idx
                for idx, frame in enumerate(frames)
            }
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"Error processing frame {idx}: {e}\n{traceback.format_exc()}")
                    event = FrameErrorEvent(data={"frame_idx": idx, "error": str(e)})
                    video_progress_ws_manager.publish_progress_sync(video_id, event.json())
        video_db.update_processing_state(video_id, processing_state='success')
        video_progress_ws_manager.publish_progress_sync(video_id, json.dumps({
            "type": "all_frames_processed",
            "data": {"video_id": video_id}
        }))
        return results
    except Exception as e:
        logger.error(f"Error in process_video_frames: {e}\n{traceback.format_exc()}")
        raise 