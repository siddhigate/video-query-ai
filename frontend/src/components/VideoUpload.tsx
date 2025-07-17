import React, { useRef, useState } from 'react';
import { uploadVideo } from '../api';
import VideoProgressFrames from './VideoProgressFrames';
import { useVideoContext } from '../context/VideoContext';

type VideoUploadProps = {
  onUpload: (videoId: string) => void;
};

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [frameStatus, setFrameStatus] = useState<{ [idx: number]: { status: 'pending' | 'processing' | 'done', url?: string, description?: string } }>({});
  const [showPlayer, setShowPlayer] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { state, dispatch } = useVideoContext();

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setDone(false);
    setFrameCount(0);
    setFrameStatus({});
    setShowPlayer(false);
    setVideoId(null);
    setToast('');
    try {
      const res = await uploadVideo(file);
      setDone(true);
      // Optimistically add to sidebar
      dispatch({
        type: 'SET_VIDEOS',
        videos: [
          ...state.videos,
          {
            video_id: res.video_id,
            video_name: file.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            processing_state: 'processing',
            frame_count: 0
          }
        ]
      });
      onUpload(res.video_id); // pass videoId to parent
      if (res.video_id) {
        setVideoId(res.video_id);
        const ws = new WebSocket(`ws://localhost:8000/api/ws/progress/${res.video_id}`);
        ws.onmessage = (event) => {
          let msg;
          try { msg = JSON.parse(event.data); } catch { return; }
          if (!msg.type) return;
          if (msg.type === 'frames_extracted') {
            setFrameCount(msg.data.frame_count);
            setFrameStatus({});
          } else if (msg.type === 'frame_processing') {
            setFrameStatus(prev => ({
              ...prev,
              [msg.data.frame_idx]: { status: 'processing', url: msg.data.frame_url }
            }));
          } else if (msg.type === 'frame_processed') {
            setFrameStatus(prev => ({
              ...prev,
              [msg.data.frame_idx]: { status: 'done', url: msg.data.frame_url, description: msg.data.description }
            }));
          } else if (msg.type === 'all_frames_processed') {
            setShowPlayer(true);
            setToast('Video processing successful!');
            setTimeout(() => setToast(''), 3000);
          }
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
      {frameCount > 0 && (
        <VideoProgressFrames
          frameCount={frameCount}
          frameStatus={frameStatus}
          showPlayer={showPlayer}
          videoId={videoId || undefined}
        />
      )}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#222', color: '#fff', padding: 12, borderRadius: 8, zIndex: 1000 }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default VideoUpload; 