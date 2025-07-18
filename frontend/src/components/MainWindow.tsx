import React, { useEffect, useRef, useState } from 'react';
import { useVideoContext } from '../context/VideoContext';
import VideoProgress from './VideoProgress';
import VideoSearch from './VideoSearch';
import { useNavigate } from 'react-router-dom';
import styles from './MainWindow.module.sass';
import TitleWithLogo from './TitleWithLogo';

interface MainWindowProps {
  videoId?: string;
}

const MainWindow: React.FC<MainWindowProps> = ({ videoId }) => {
  const { state, dispatch } = useVideoContext();
  const { videos } = state;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!videoId) return;
    const video = videos.find(v => v.video_id === videoId);
    if (video) {
      if (video.processing_state === 'processing') {
        dispatch({ type: 'SET_PROGRESS_VIDEO', video_id: videoId, progress: { frameCount: video.frame_count || 0, frameStatus: {} } });
      }
      fetchedRef.current = false; // reset for next videoId
    } else if (!loading && !fetchedRef.current) {
      // Video not found, fetch videos
      setLoading(true);
      fetchedRef.current = true;
      fetch('/api/videos')
        .then(res => res.json())
        .then(data => {
          dispatch({ type: 'SET_VIDEOS', videos: data });
          const found = data.find((v: any) => v.video_id === videoId);
          if (found && found.processing_state === 'processing') {
            dispatch({ type: 'SET_PROGRESS_VIDEO', video_id: videoId, progress: { frameCount: found.frame_count || 0, frameStatus: {} } });
          }
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line
  }, [videoId, videos, dispatch, loading]);

  if (!videoId) {
    return (
      <div className={styles.container}>


        <TitleWithLogo />
        <div className={styles.section}>
          <VideoSearch />
        </div>
        <div className={styles.orText}>or</div>
        <div className={styles.centered}>
          <button
            className={styles.ctaButton}
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
      <div className={styles.processingContainer}>
        <h2 className={styles.processingTitle}>Processing: {video.video_name}</h2>
        <VideoProgress videoId={video.video_id} />
      </div>
    );
  }

  if (video) {
    return (
      <div className={styles.searchContainer}>
        <div className={styles.searchSection}>
          
          <h2 className={styles.searchTitle}>Search in {video.video_name}</h2>
          <VideoSearch videoId={video.video_id} />
        </div>

      </div>
    );
  }

  // Optionally, show a loading spinner if loading
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return null;
};

export default MainWindow; 