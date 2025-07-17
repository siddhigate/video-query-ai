import React from 'react';
import VideoRow from './VideoRow';

type Video = {
  video_id: string;
  video_name: string;
  created_at: string;
  updated_at: string;
};

type VideoListProps = {
  videos: Video[];
  onDelete: () => void;
  onUpdate: () => void;
};

const VideoList: React.FC<VideoListProps> = ({ videos, onDelete, onUpdate }) => {
  if (videos.length === 0) {
    return <div>No videos uploaded yet.</div>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ccc', padding: 4 }}>Video ID</th>
          <th style={{ border: '1px solid #ccc', padding: 4 }}>Name</th>
          <th style={{ border: '1px solid #ccc', padding: 4 }}>Created At</th>
          <th style={{ border: '1px solid #ccc', padding: 4 }}>Updated At</th>
          <th style={{ border: '1px solid #ccc', padding: 4 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {videos.map(video => (
          <VideoRow key={video.video_id} video={video} onDelete={onDelete} onUpdate={onUpdate} />
        ))}
      </tbody>
    </table>
  );
};

export default VideoList; 