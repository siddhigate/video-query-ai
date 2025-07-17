from pydantic_settings import BaseSettings
from pydantic import Field
import os

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".data"))
UPLOAD_DIR = os.path.join(DATA_DIR, "uploaded_videos")
CHROMA_DIR = os.path.join(DATA_DIR, "chromadb")
FRAMES_DIR = os.path.join(DATA_DIR, "frames")

class OllamaSettings(BaseSettings):
    api_url: str = Field("http://localhost:11434/api/generate", env="OLLAMA_API_URL")

class RedisSettings(BaseSettings):
    url: str = Field("redis://localhost:6379", env="REDIS_URL")
    pubsub_channel_prefix: str = Field("progress", env="REDIS_PUBSUB_CHANNEL_PREFIX")

class AppConfig(BaseSettings):
    ollama: OllamaSettings = OllamaSettings()
    redis: RedisSettings = RedisSettings()
    data_dir: str = DATA_DIR
    upload_dir: str = UPLOAD_DIR
    chroma_dir: str = CHROMA_DIR
    frames_dir: str = FRAMES_DIR

config = AppConfig() 