import React from 'react';
import VideoUpload from './VideoUpload';
import VideoProgress from './VideoProgress';

const UploadPage: React.FC = () => {
  const [uploadedVideoId, setUploadedVideoId] = React.useState<string | null>(null);

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', marginTop: 40 }}>
      <h2 style={{ color: '#fff', marginBottom: 24 }}>Upload Video</h2>
      <VideoUpload onUpload={(id: string) => setUploadedVideoId(id)} />
      {uploadedVideoId && (
        <div style={{ marginTop: 32 }}>
          <VideoProgress videoId={uploadedVideoId} />
        </div>
      )}
    </div>
  );
};

export default UploadPage; 