import React, { useState } from 'react';
import VideoRow from './VideoRow';
import { searchFrames } from '../api';

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
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

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

  if (videos.length === 0) {
    return <div>No videos uploaded yet.</div>;
  }
  return (
    <div>
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
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos.map(video => (
            <VideoRow key={video.video_id} video={video} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VideoList; 