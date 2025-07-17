#!/bin/bash
cd "$(dirname "$0")/.."
source backend/venv/bin/activate
exec uvicorn backend.main:app --reload --port 8000 