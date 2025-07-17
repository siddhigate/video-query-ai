
import './App.css';
import Sidebar from './components/Sidebar';
import MainWindow from './components/MainWindow';
import UploadPage from './components/UploadPage';
import { VideoProvider } from './context/VideoContext';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';

function MainWindowWithParams() {
  const { videoId } = useParams();
  const location = useLocation();
  return <MainWindow key={location.key} videoId={videoId} />;
}

function AppContent() {
  return (
    <div style={{ margin: '2rem', height: 'calc(100vh - 4rem)', width: 'calc(100vw - 4rem)', background: '#181818', display: 'flex', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Routes>
          <Route path="/" element={<MainWindow />} />
          <Route path=":videoId" element={<MainWindowWithParams />} />
          <Route path="upload" element={<UploadPage />} />
        </Routes>
      </div>
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
