#!/bin/bash
cd "$(dirname "$0")/.."
source backend/venv/bin/activate
exec python -m backend.video.video_worker 