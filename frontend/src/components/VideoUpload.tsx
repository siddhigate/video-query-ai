import React, { useRef, useState } from 'react';
import { uploadVideo } from '../api';

type VideoUploadProps = {
  onUpload: () => void;
};

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setDone(false);
    try {
      await uploadVideo(file);
      setDone(true);
      onUpload();
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
    </div>
  );
};

export default VideoUpload; 