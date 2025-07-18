import React, { useRef } from 'react';
import { useVideoContext } from '../context/VideoContext';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.sass';
import {
  HiHome as HomeIcon,
  HiUpload as UploadIcon,
  HiVideoCamera as VideoIcon,
  HiPencil as EditIcon,
  HiTrash as DeleteIcon
} from 'react-icons/hi';
import Button from './Button';
import Logo from './Logo';



const Sidebar: React.FC = () => {
  const { state, dispatch } = useVideoContext();
  const { videos } = state;
  const navigate = useNavigate();
  const location = useLocation();
  const selected = location.pathname === '/' ? 'home' : location.pathname.slice(1);

  // State for popover and editing
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch videos helper for reuse
  const fetchVideos = React.useCallback(async () => {
    const res = await fetch('/api/videos');
    const data = await res.json();
    dispatch({ type: 'SET_VIDEOS', videos: data });
  }, [dispatch]);

  React.useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Close popover on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuOpenId && menuRefs.current[menuOpenId]) {
        if (!menuRefs.current[menuOpenId]?.contains(e.target as Node)) {
          setMenuOpenId(null);
        }
      }
    }
    if (menuOpenId) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [menuOpenId]);

  const handleSelect = (id: string) => {
    setMenuOpenId(null);
    setEditId(null);
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

  const handleEdit = (video_id: string, video_name: string) => {
    setEditId(video_id);
    setEditValue(video_name);
    setMenuOpenId(null);
  };

  const handleEditSubmit = async (video_id: string) => {
    if (editValue.trim() && editValue !== videos.find(v => v.video_id === video_id)?.video_name) {
      await fetch(`/api/videos/${video_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_name: editValue.trim() })
      });
      await fetchVideos();
    }
    setEditId(null);
  };

  const handleDelete = async (video_id: string) => {
    await fetch(`/api/videos/${video_id}`, { method: 'DELETE' });
    await fetchVideos();
    setMenuOpenId(null);
    if (selected === video_id) navigate('/');
  };

  return (
    <div className={styles.sidebar}>
      
      <div className={styles.logoContainers}>
      <Logo height="24" />
      </div>


      <div className={styles.headerSection}>
      <Button onClick={() => navigate("/")}>
          <HomeIcon size="1rem" />
          Home
        </Button>
        <Button onClick={() => navigate("/upload")} variant='secondary'>
          <UploadIcon size="1rem" />
          Upload Video
        </Button>

      </div>



      <div className={styles.subheading}>Videos</div>
      <div className={styles.scrollable}>
        {videos
          .slice()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map(video => (
            <div
              key={video.video_id}
              className={styles.relative}
              ref={el => {
                menuRefs.current[video.video_id] = el;
              }}
            >
              <div
                onClick={() => handleSelect(video.video_id)}
                className={styles.videoItem + (selected === video.video_id ? ' ' + styles.selected : '')}
                title={video.video_name}
              >
                {editId === video.video_id ? (
                  <input
                    value={editValue}
                    autoFocus
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => handleEditSubmit(video.video_id)}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEditSubmit(video.video_id);
                      if (e.key === 'Escape') setEditId(null);
                    }}
                    className={styles.input}
                  />
                ) : (
                  <span className={styles.videoName}>{video.video_name}</span>
                )}
                {video.processing_state === 'processing' && (
                  <span className={styles.loader} />
                )}
                {/* Menu icon */}
                <span
                  className={styles.menuButton + (menuOpenId === video.video_id ? ' ' + styles.menuOpen : '')}
                  onClick={e => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === video.video_id ? null : video.video_id);
                    setEditId(null);
                  }}
                  title="Options"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="4" cy="10" r="2" fill="#888" />
                    <circle cx="10" cy="10" r="2" fill="#888" />
                    <circle cx="16" cy="10" r="2" fill="#888" />
                  </svg>
                </span>
              </div>
              {/* Popover */}
              {menuOpenId === video.video_id && (
                <div
                  className={styles.menu}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className={styles.menuItem}
                    onClick={() => handleEdit(video.video_id, video.video_name)}
                  >
                    <EditIcon color='#BBD8A3' />
                    Edit</button>
                  <button
                    className={styles.menuItemDelete}
                    onClick={() => handleDelete(video.video_id)}
                  >
                    <DeleteIcon color="#CD5656" />
                    Delete</button>
                </div>
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