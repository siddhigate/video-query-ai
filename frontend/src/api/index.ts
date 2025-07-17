// api/index.ts

const API_BASE = 'http://localhost:8000/api';
export const STATIC_BASE = 'http://localhost:8000/static';

export async function getVideos() {
  const res = await fetch(`${API_BASE}/videos`);
  if (!res.ok) throw new Error('Failed to fetch videos');
  return res.json();
}

export async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload video');
  return res.json();
}

export async function deleteVideo(video_id: string) {
  const res = await fetch(`${API_BASE}/videos/${video_id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete video');
  return res.json();
}

export async function updateVideo(video_id: string, video_name: string) {
  const res = await fetch(`${API_BASE}/videos/${video_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_name }),
  });
  if (!res.ok) throw new Error('Failed to update video');
  return res.json();
}

export async function searchFrames(query: string, videoId?: string) {
  const body: any = { query };
  if (videoId) body.video_ids = [videoId];
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}

export async function getProgress(ws: WebSocket): Promise<any> {
  return new Promise((resolve) => {
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'progress_state') {
          resolve(msg.data);
        }
      } catch {}
    };
    ws.send(JSON.stringify({ type: 'get_progress' }));
  });
} 