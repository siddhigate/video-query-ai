#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
exec uvicorn main:app --reload --port 8000 