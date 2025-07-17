
import './App.css';
import VideoList from './components/VideoList';
import { VideoProvider } from './context/VideoContext';

function AppContent() {

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <h1>Video Query AI</h1>
      <VideoList />
    </div>
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
