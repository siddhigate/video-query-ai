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
  const [toast, setToast] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { state, dispatch } = useVideoContext();

  const handleButtonClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleFileChange = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file.');
      return;
    }
    setUploading(true);
    setDone(false);
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
      // Set progress video in context with empty progress state
      dispatch({
        type: 'SET_PROGRESS_VIDEO',
        video_id: res.video_id,
        progress: { frameCount: 0, frameStatus: {} }
      });
      onUpload(res.video_id); // pass videoId to parent
    } catch (e) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploading) return;
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: '100%',
        minHeight: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        outline: dragActive ? '2px dashed var(--clr-primary)' : 'none',
        borderRadius: 12,
        background: dragActive ? '#ffe6f0' : 'transparent',
        transition: 'outline 0.2s, background 0.2s',
      }}
    >
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        disabled={uploading}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        onClick={handleButtonClick}
        disabled={uploading}
        style={{
          background: 'var(--clr-primary)',
          color: 'var(--clr-light)',
          border: 'none',
          borderRadius: 24,
          fontWeight: 600,
          fontSize: 16,
          cursor: uploading ? 'not-allowed' : 'pointer',
          padding: '0.75rem 1.5rem',
          marginLeft: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          transition: 'background 0.2s',
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Video'}
      </button>
      {done && (
        <div style={{ marginTop: 12, color: 'green' }}>
          Done!
        </div>
      )}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#fffaf5', color: 'var(--clr-dark)', padding: 12, borderRadius: 8, zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default VideoUpload; 