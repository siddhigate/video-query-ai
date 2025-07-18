import React, { useEffect } from 'react';
import { useVideoContext } from '../context/VideoContext';
import VideoProgress from './VideoProgress';
import VideoUpload from './VideoUpload';
import VideoSearch from './VideoSearch';
import styles from './VideoList.module.sass';

const VideoList: React.FC = () => {
  const { state, dispatch } = useVideoContext();
  const { videos, progressVideoId } = state;

  useEffect(() => {
    async function fetchVideos() {
      const res = await fetch('/api/videos');
      const data = await res.json();
      dispatch({ type: 'SET_VIDEOS', videos: data });
    }
    fetchVideos();
  }, [dispatch]);

  const handleViewProgress = (video: any) => {
    dispatch({
      type: 'SET_PROGRESS_VIDEO',
      video_id: video.video_id,
      progress: {
        frameCount: video.frame_count,
        frameStatus: {},
      },
    });
  };

  const handleDelete = async (video_id: string) => {
    await fetch(`/api/videos/${video_id}`, { method: 'DELETE' });
    dispatch({ type: 'SET_VIDEOS', videos: videos.filter(v => v.video_id !== video_id) });
  };

  return (
    <div>
      <VideoUpload onUpload={() => {}} />
      <VideoSearch />
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>ID</th>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Created</th>
            <th className={styles.th}>Updated</th>
            <th className={styles.th}>State</th>
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos
            .slice()
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(video => (
              <tr key={video.video_id}>
                <td className={styles.td}>{video.video_id}</td>
                <td className={styles.td}>{video.video_name}</td>
                <td className={styles.td}>{video.created_at}</td>
                <td className={styles.td}>{video.updated_at}</td>
                <td className={styles.td}>{video.processing_state || 'processing'}</td>
                <td className={styles.td}>
                  {video.processing_state === 'processing' && (
                    <button className={styles.viewButton} onClick={() => handleViewProgress(video)}>View Progress</button>
                  )}
                  <button className={styles.deleteButton} onClick={() => handleDelete(video.video_id)}>Delete</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {progressVideoId && <VideoProgress videoId={progressVideoId} />}
    </div>
  );
};

export default VideoList; 