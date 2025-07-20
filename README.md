# Video Query AI: Search your videos like you search text 🧠🎥

## Overview
A fully local, privacy-first app that helps you semantically search through videos using natural language. Simply upload a video, and we’ll do the heavy lifting to process frames, generate descriptions using AI, embed them, and allow fast search.

## ✨ Features
- 🔍 Semantic search: Find scenes by describing them in plain English
- 📤 Drag-and-drop video upload
- 🖼️ Instant timestamps & thumbnails for search results
- ⚡ Real-time resumable processing updates
- 🔒 100% local, privacy-first architecture


## App Walkthrough ✨

### 1️⃣ 🏠 Home & Video Library

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1752862225260/b5994750-d236-4ac6-a28c-e84afeea6d0b.gif)

- Land on a clean dashboard with a sidebar listing all uploaded videos.
- Browse or search through your video collection easily.

### 2️⃣ 📤 Video Upload & Processing

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1752862242679/4adcc684-5210-454a-a633-b8f2e79408d8.gif)

- Drag and drop a video file for processing.
- The backend kicks off a background job to:
    - Extract frames using `ffmpeg`
    - Generate descriptions via **LLaVA**
    - Generate vector embeddings of those descriptions for semantic search
- Real-time progress updates
    - Updates are streamed live via WebSockets.
    - Progress persists across reloads using Redis Pub/Sub for state sync

### 3️⃣ 🔍 Natural Language Search

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1752862256793/877b3735-0fa8-4f64-8764-7eddb6003a5e.gif)

- Enter a query like *"Where is the elephant?"* or *"Chef chopping onions"*
- The app performs a vector similarity search against frame captions.
- You’ll get timestamps + thumbnails of the best matching moments in the video.


## 🛠 Under the Hood 

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1752862278277/faa90937-b973-4ebd-9da4-1961d47714c4.png)

Video Query AI follows a modular architecture built by:

- **Frontend:** React + TypeScript with Vite and React Router
- **Backend:** FastAPI serving REST and WebSocket endpoints
- **Job Queue:** Redis + RQ for background processing
- **Embedding Store:** ChromaDB for vector search
- **Realtime Updates:** WebSockets with Redis Pub/Sub for progress tracking and resumable streams

### 📼 Video Processing Flow

Here’s what happens behind the scenes when you upload a video:

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1752862439792/7a198ef5-81a6-44ca-9307-a09c63521697.png)

1. **Upload**
    - File is saved to disk and its metadata is stored in ChromaDB.
2. **Job Queuing**
    - A video processing job is pushed to a **Redis Queue** and handled asynchronously by a worker.
3. **Frame Extraction**
    - Frames are extracted from the video using `ffmpeg`.
4. **Frame Analysis**
    - Each frame is sent through **LLaVA (via Ollama)** to describe it.
    - Description is embedded into a vector using a sentence transformer.
5. **Storage**
    - Vector embeddings + metadata is stored in ChromaDB.
6. **Progress Updates**
    - Real-time progress is sent to the frontend via WebSockets + Redis PubSub.

### 🔍 Search Flow

Users can search across:

- **All uploaded videos**
- **A single selected video**

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1752862430476/7144c89f-148b-4b72-8a15-99b255f4163a.png)

When a query is made:

1. The backend embeds the query using the same embedding model.
2. A **vector similarity search** is performed in ChromaDB.
3. Top 10 closest matches (timestamps + thumbnails) are returned.

### 🔁 Real-Time Progress & Resumability

Even if the user refreshes the page mid-processing:

- The frontend reconnects via WebSocket.
- The backend reads the current job state from Redis and resumes updates seamlessly.

## 🛠 Useful Links
- [Blog](https://blog.siddhigate.com/video-query-ai-search-your-videos-like-you-search-text)
- [Demo](https://www.loom.com/share/10c1299c709545598d2f533761b57972?sid=e3dd6104-85a3-433b-81e7-1807d689eead)
