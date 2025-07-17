import React, { useRef, useState } from 'react';
import { uploadVideo } from '../api';

type VideoUploadProps = {
  onUpload: () => void;
};

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setDone(false);
    setProgress([]);
    try {
      const res = await uploadVideo(file);
      setDone(true);
      onUpload();

      if (res.video_id) {
        const ws = new WebSocket(`ws://localhost:8000/ws/progress/${res.video_id}`);
        ws.onmessage = (event) => {
          setProgress((prev) => [...prev, event.data]);
        };
        ws.onclose = () => {
          setProgress((prev) => [...prev, 'WebSocket closed']);
        };
      }
    } catch (e) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <input type="file" accept="video/*" ref={fileInputRef} disabled={uploading} />
      <button onClick={handleUpload} disabled={uploading} style={{ marginLeft: 8 }}>
        {uploading ? 'Uploading...' : 'Upload Video'}
      </button>
      {done && (
        <div style={{ marginTop: 12, color: 'green' }}>
          Done!
        </div>
      )}
      {progress.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <b>Processing Progress:</b>
          <ul>
            {progress.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoUpload; 