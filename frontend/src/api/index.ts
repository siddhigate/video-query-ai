// api/index.ts

const API_BASE = 'http://localhost:8000';

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

export async function searchFrames(query: string) {
  const res = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(query)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
} 