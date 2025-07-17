import React, { useState, useEffect, useRef } from 'react';
import { searchFrames } from '../api';
import { useVideoContext } from '../context/VideoContext';
import VideoProgress from './VideoProgress';
import VideoUpload from './VideoUpload';
import { STATIC_BASE } from '../api';
import VideoSearch from './VideoSearch';

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
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Name</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Created</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Updated</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>State</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos.map(video => (
            <tr key={video.video_id}>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.video_id}</td>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.video_name}</td>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.created_at}</td>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.updated_at}</td>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.processing_state || 'processing'}</td>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>
                {video.processing_state === 'processing' && (
                  <button onClick={() => handleViewProgress(video)}>View Progress</button>
                )}
                <button
                  style={{ color: 'red', marginLeft: 8 }}
                  disabled={video.processing_state === 'processing'}
                  onClick={() => handleDelete(video.video_id)}
                >
                  Delete
                </button>
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