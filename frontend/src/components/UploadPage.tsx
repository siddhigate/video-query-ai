import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoUpload from './VideoUpload';
import VideoProgress from './VideoProgress';
import styles from './UploadPage.module.sass';
import TitleWithLogo from './TitleWithLogo';

const UploadPage: React.FC = () => {
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpload = (id: string) => {
    setUploadedVideoId(id);
    navigate(`/${id}`);
  };

  return (
    <div className={styles.outer}>
      <div className={styles.card}>
      <TitleWithLogo />
        <div className={styles.fullWidth}>
          <div
            className={styles.dropZone}
          >
            <VideoUpload onUpload={handleUpload} />
            <div className={styles.dropText}>Drag & drop your video here, or click the button</div>
          </div>
        </div>
        {uploadedVideoId && (
          <div className={styles.bottomSpacing}>
            <VideoProgress videoId={uploadedVideoId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage; 