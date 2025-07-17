import { useEffect } from 'react';
import viteLogo from '/vite.svg';
import './App.css';
import VideoUpload from './components/VideoUpload';
import VideoList from './components/VideoList';
import { getVideos } from './api';
import { VideoProvider, useVideoState, useVideoDispatch } from './context/VideoContext';

function AppContent() {
  const { videos, loading, error } = useVideoState();
  const dispatch = useVideoDispatch();

  const fetchVideos = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await getVideos();
      dispatch({ type: 'SET_VIDEOS', payload: data });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch videos' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Video Query</h1>
      <VideoUpload onUpload={fetchVideos} />
      <div style={{ marginTop: 32, textAlign: 'left' }}>
        <h2>Uploaded Videos</h2>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <VideoList videos={videos} onDelete={fetchVideos} onUpdate={fetchVideos} />
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <VideoProvider>
      <AppContent />
    </VideoProvider>
  );
}

export default App;
