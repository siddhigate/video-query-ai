import React from 'react';
import { useVideoContext } from '../context/VideoContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const { state, dispatch } = useVideoContext();
  const { videos } = state;
  const navigate = useNavigate();
  const location = useLocation();
  const selected = location.pathname === '/' ? 'home' : location.pathname.slice(1);

  React.useEffect(() => {
    async function fetchVideos() {
      const res = await fetch('/api/videos');
      const data = await res.json();
      dispatch({ type: 'SET_VIDEOS', videos: data });
    }
    fetchVideos();
  }, [dispatch]);

  const handleSelect = (id: string) => {
    if (id === 'home') {
      dispatch({ type: 'CLEAR_PROGRESS_VIDEO' });
      navigate('/');
    } else {
      const video = videos.find(v => v.video_id === id);
      if (video?.processing_state === 'processing') {
        dispatch({ type: 'SET_PROGRESS_VIDEO', video_id: id, progress: { frameCount: video.frame_count || 0, frameStatus: {} } });
      } else {
        dispatch({ type: 'CLEAR_PROGRESS_VIDEO' });
      }
      navigate(`/${id}`);
    }
  };

  return (
    <div style={{ width: 260, background: '#232323', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', borderRight: '1px solid #222' }}>
      <div style={{ padding: '24px 0 12px 0', textAlign: 'center', fontWeight: 700, fontSize: 22, letterSpacing: 1, borderBottom: '1px solid #333', cursor: 'pointer', background: selected === 'home' ? '#181818' : 'none' }} onClick={() => handleSelect('home')}>
        Home
      </div>
      <div style={{ padding: '0 16px 16px 16px', borderBottom: '1px solid #222', background: '#232323' }}>
        <button
          style={{ width: '100%', padding: '10px 0', background: '#646cff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 12 }}
          onClick={() => navigate('/upload')}
        >
          Upload Video
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', marginTop: 8 }}>
        {videos.map(video => (
          <div
            key={video.video_id}
            onClick={() => handleSelect(video.video_id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 20px',
              background: selected === video.video_id ? '#181818' : 'none',
              cursor: 'pointer',
              borderBottom: '1px solid #222',
              fontWeight: 500,
              fontSize: 16,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={video.video_name}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.video_name}</span>
            {video.processing_state === 'processing' && (
              <span style={{ marginLeft: 8 }}>
                <span className="loader" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #888', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </span>
            )}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Sidebar; 