
import './App.css';
import Sidebar from './components/Sidebar';
import MainWindow from './components/MainWindow';
import UploadPage from './components/UploadPage';
import { VideoProvider } from './context/VideoContext';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';
import styles from './App.module.sass';

function MainWindowWithParams() {
  const { videoId } = useParams();
  const location = useLocation();
  return <MainWindow key={location.key} videoId={videoId} />;
}

function AppContent() {
  return (
    <div className={styles.outerContainer}>
      <Sidebar />
      <div id="main-content" className={styles.mainContent}>
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
