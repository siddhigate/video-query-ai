from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .api import router as api_router

app = FastAPI()

# Serve static files for frames and uploaded videos under /static
frames_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '.data/frames'))
uploaded_videos_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '.data/uploaded_videos'))
app.mount("/static/frames", StaticFiles(directory=frames_dir), name="frames")
app.mount("/static/videos", StaticFiles(directory=uploaded_videos_dir), name="uploaded_videos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prefix all API routes with /api
app.include_router(api_router, prefix="/api") 