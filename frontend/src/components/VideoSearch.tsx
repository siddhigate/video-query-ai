import React, { useState, useRef, useEffect } from 'react';
import { searchFrames, STATIC_BASE } from '../api';

interface VideoSearchProps {
  onResult?: (results: any[]) => void;
}

const VideoSearch: React.FC<VideoSearchProps> = ({ onResult }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Seek video to timestamp of selected result
    if (results.length > 0 && videoRef.current) {
      const ts = results[selectedIdx]?.timestamp || 0;
      videoRef.current.currentTime = ts;
      videoRef.current.pause();
    }
  }, [selectedIdx, results]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await searchFrames(search);
      setResults(res.results);
      setSelectedIdx(0);
      if (onResult) onResult(res.results);
    } catch (e) {
      setResults([]);
      if (onResult) onResult([]);
    } finally {
      setSearching(false);
    }
  };

  const selectedResult = results[selectedIdx];
  const selectedVideoId = selectedResult?.video_id;
  const selectedTimestamp = selectedResult?.timestamp || 0;

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
          <div style={{ margin: '16px 0' }}>
            {/* Main video player for selected result */}
            {selectedVideoId && (
              <div style={{ marginBottom: 12 }}>
                <video
                  ref={videoRef}
                  width={480}
                  src={`${STATIC_BASE}/videos/${selectedVideoId}/video.mp4`}
                  controls
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = selectedTimestamp;
                      videoRef.current.pause();
                    }
                  }}
                  style={{ display: 'block', marginBottom: 8 }}
                />
                <div style={{ fontSize: 14, color: '#888' }}>
                  <b>Timestamp:</b> {selectedTimestamp?.toFixed(2)}s
                </div>
                <div style={{ margin: '8px 0', fontStyle: 'italic' }}>{selectedResult.description}</div>
              </div>
            )}
            {/* Horizontal scroll of other results */}
            <div style={{ display: 'flex', overflowX: 'auto', gap: 12, paddingBottom: 8 }}>
              {results.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    border: idx === selectedIdx ? '2px solid #646cff' : '2px solid transparent',
                    borderRadius: 6,
                    padding: 2,
                    cursor: 'pointer',
                    background: idx === selectedIdx ? '#f0f0ff' : 'transparent',
                    minWidth: 90,
                    textAlign: 'center',
                  }}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <div style={{ fontSize: 12, color: '#888' }}>{r.timestamp?.toFixed(2)}s</div>
                  <img
                    src={`${STATIC_BASE}/frames/${r.video_id}/frame_${(r.frame_idx+1).toString().padStart(5, '0')}.jpg`}
                    alt={r.description}
                    style={{ width: 80, height: 60, borderRadius: 4, objectFit: 'cover', marginBottom: 4 }}
                  />
                  <div style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{r.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSearch; 