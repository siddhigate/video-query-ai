import React, { useState, useRef, useEffect } from 'react';
import { searchFrames, STATIC_BASE } from '../api';
import Logo from './Logo';

interface VideoSearchProps {
  onResult?: (results: any[]) => void;
  videoId?: string;
}

const VideoSearch: React.FC<VideoSearchProps> = ({ onResult, videoId }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // State to control which video and timestamp to show
  const [currentVideoId, setCurrentVideoId] = useState<string | undefined>(videoId);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);

  // Update video and timestamp when search results or selection changes
  useEffect(() => {
    if (results.length > 0) {
      const selected = results[selectedIdx];
      setCurrentVideoId(selected?.video_id);
      setCurrentTimestamp(selected?.timestamp || 0);
    } else {
      setCurrentVideoId(videoId);
      setCurrentTimestamp(0);
    }
  }, [results, selectedIdx, videoId]);

  // Seek video to timestamp when currentTimestamp changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTimestamp;
      videoRef.current.pause();
    }
  }, [currentTimestamp, currentVideoId]);

  const handleSearch = async () => {
    if (!search) return;
    setSearching(true);
    try {
      const res = await searchFrames(search, videoId);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div>
        
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', position: 'relative' }}>
      <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={videoId ? `Search in this video` : "Search across all videos"}
          style={{
            width: '100%',
            borderRadius: 24,
            border: '1px solid #e0e0e0',
            padding: '0.75rem 2.5rem 0.75rem 1.25rem',
            fontSize: 16,
            outline: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        />
        <span
          onClick={handleSearch}
          style={{
            position: 'absolute',
            right: 18,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: searching || !search ? 'not-allowed' : 'pointer',
            opacity: searching || !search ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            pointerEvents: searching || !search ? 'none' : 'auto',
            background: 'transparent',
            border: 'none',
            padding: 0,
            height: 24,
            width: 24,
            zIndex: 2
          }}
          tabIndex={0}
          role="button"
          aria-label="Search"
        >
          {/* Magnifying glass SVG */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
      </div>
      {/* Always render the video element */}
      {currentVideoId && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <video
            ref={videoRef}
            width={480}
            src={`${STATIC_BASE}/videos/${currentVideoId}/video.mp4`}
            controls
            style={{ marginTop: 24, borderRadius: 8, background: '#fffaf5' }}
            onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = currentTimestamp; (e.target as HTMLVideoElement).pause(); }}
          />
        </div>
      )}
      {/* Results UI */}
      {results.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ margin: '16px 0' }}>
            {/* Timestamp info for selected result */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: '#888' }}>
                <b>Timestamp:</b> {currentTimestamp?.toFixed(2)}s
              </div>
            </div>
            {/* Horizontal scroll of other results */}
            <div style={{ display: 'flex', overflowX: 'auto', gap: 12, paddingBottom: 8 }}>
              {results.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    border: idx === selectedIdx ? '2px solid var(--clr-primary)' : '2px solid transparent',
                    borderRadius: 6,
                    padding: 2,
                    cursor: 'pointer',
                    background: idx === selectedIdx ? 'rgba(245, 176, 196, 0.1)' : 'transparent',
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
                  {r.video_name && (
                    <div style={{ fontSize: 11, color: '#666', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto' }} title={r.video_name}>
                      {r.video_name.length > 18 ? r.video_name.slice(0, 15) + '...' : r.video_name}
                    </div>
                  )}
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