import React, { useState, useEffect } from 'react';
import { searchFrames } from '../api';
import { useVideoContext } from '../context/VideoContext';
import VideoProgress from './VideoProgress';
import VideoUpload from './VideoUpload';

const VideoList: React.FC = () => {
  const { state, dispatch } = useVideoContext();
  const { videos, progressVideoId } = state;
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function fetchVideos() {
      const res = await fetch('/api/videos');
      const data = await res.json();
      dispatch({ type: 'SET_VIDEOS', videos: data });
    }
    fetchVideos();
  }, [dispatch]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await searchFrames(search);
      setResults(res.results);
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

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
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search video frames (natural language)"
          style={{ width: 320, marginRight: 8 }}
        />
        <button onClick={handleSearch} disabled={searching || !search}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>
      {results.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <b>Search Results:</b>
          <ul>
            {results.map((r, idx) => (
              <li key={idx}>
                <b>Video:</b> {r.video_id} <b>Frame:</b> {r.frame_idx} <br />
                <i>{r.description}</i>
              </li>
            ))}
          </ul>
        </div>
      )}
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