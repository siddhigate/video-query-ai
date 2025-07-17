import React from 'react';
import { useVideoContext } from '../context/VideoContext';
import VideoProgress from './VideoProgress';
import VideoSearch from './VideoSearch';
import { useNavigate } from 'react-router-dom';
import { STATIC_BASE } from '../api';

interface MainWindowProps {
  videoId?: string;
}

const MainWindow: React.FC<MainWindowProps> = ({ videoId }) => {
  const { state } = useVideoContext();
  const { videos } = state;
  const navigate = useNavigate();

  if (!videoId) {
    return (
      <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', marginTop: 40 }}>
        <div style={{ marginBottom: 24 }}>
          <VideoSearch />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24, color: '#aaa' }}>or</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            style={{ padding: '12px 32px', background: '#646cff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 18, cursor: 'pointer' }}
            onClick={() => navigate('/upload')}
          >
            Upload Video
          </button>
        </div>
      </div>
    );
  }

  const video = videos.find(v => v.video_id === videoId);
  if (video?.processing_state === 'processing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <h2 style={{ color: '#fff', marginBottom: 24 }}>Processing: {video.video_name}</h2>
        <VideoProgress videoId={video.video_id} />
      </div>
    );
  }

  if (video) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%', width: '100%', maxWidth: 600, margin: '0 auto', marginTop: 40 }}>
        <div style={{ marginBottom: 24, width: '100%' }}>
          <h2 style={{ color: '#fff', marginBottom: 24 }}>Search in {video.video_name}</h2>
          <VideoSearch videoId={video.video_id} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <video
            width={480}
            src={`${STATIC_BASE}/videos/${video.video_id}/video.mp4`}
            controls
            style={{ marginTop: 24, borderRadius: 8, background: '#000' }}
            autoPlay={false}
            onLoadedMetadata={e => { (e.target as HTMLVideoElement).pause(); }}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default MainWindow; 