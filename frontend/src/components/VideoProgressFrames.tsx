import React from 'react';
import { STATIC_BASE } from '../api';

export type FrameStatus = { [idx: number]: { status: 'pending' | 'processing' | 'done', url?: string } };

interface VideoProgressFramesProps {
  frameCount: number;
  frameStatus: FrameStatus;
  showPlayer?: boolean;
  videoId?: string;
  firstFrameUrl?: string;
}

const VideoProgressFrames: React.FC<VideoProgressFramesProps> = ({ frameCount, frameStatus, showPlayer, videoId, firstFrameUrl }) => {
  if (showPlayer && videoId) {
    return (
      <div style={{ marginTop: 16 }}>
        <video controls width={480} src={`${STATIC_BASE}/videos/${videoId}/video.mp4`} />
      </div>
    );
  }

  // Use the provided firstFrameUrl if available, otherwise find the first frame that is done or processing and has a URL
  let displayFirstFrameUrl: string | undefined = firstFrameUrl ? `${STATIC_BASE}${firstFrameUrl}` : undefined;
  if (!displayFirstFrameUrl) {
    for (let i = 0; i < frameCount; i++) {
      const status = frameStatus?.[i]?.status;
      const url = frameStatus?.[i]?.url;
      if ((status === 'done' || status === 'processing') && url) {
        displayFirstFrameUrl = `${STATIC_BASE}${url}`;
        break;
      }
    }
  }

  // Count frames by status
  let doneCount = 0, processingCount = 0, pendingCount = 0;
  for (let i = 0; i < frameCount; i++) {
    const status = frameStatus?.[i]?.status;
    if (status === 'done') doneCount++;
    else if (status === 'processing') processingCount++;
    else pendingCount++;
  }

  // Progress bar segments
  const total = frameCount || 1;
  const donePercent = (doneCount / total) * 100;
  const processingPercent = (processingCount / total) * 100;
  const pendingPercent = (pendingCount / total) * 100;

  // Determine progress state for scroll
  let allDone = doneCount === frameCount && frameCount > 0;
  let inProgress = processingCount > 0 || (!allDone && doneCount > 0);

  // Horizontal scroll of frames
  const frameThumbs = [];
  for (let i = 0; i < frameCount; i++) {
    const status = frameStatus?.[i]?.status;
    const url = frameStatus?.[i]?.url;
    if (status === 'done' && url) {
      frameThumbs.push(
        <img
          key={i}
          src={`${STATIC_BASE}${url}`}
          alt={`Frame ${i + 1}`}
          style={{ width: 60, height: 36, objectFit: 'cover', borderRadius: 4, marginRight: 6, boxShadow: '0 1px 3px #0001', opacity: 1, filter: 'none', transition: 'filter 0.3s, opacity 0.3s' }}
        />
      );
    } else if ((status === 'processing' || status === 'pending') && url) {
      frameThumbs.push(
        <img
          key={i}
          src={`${STATIC_BASE}${url}`}
          alt={`Frame ${i + 1}`}
          style={{ width: 60, height: 36, objectFit: 'cover', borderRadius: 4, marginRight: 6, boxShadow: '0 2px 8px #e0e0e0', opacity: 0.6, filter: 'blur(1.5px) grayscale(0.2) brightness(1.08)', background: '#f8f8fa', transition: 'filter 0.3s, opacity 0.3s, background 0.3s' }}
        />
      );
    } else {
      // Skeleton/placeholder
      frameThumbs.push(
        <div
          key={i}
          style={{ width: 60, height: 36, borderRadius: 4, marginRight: 6, background: 'linear-gradient(90deg, #f5f5fa 25%, #f0f0f0 50%, #f5f5fa 75%)', opacity: 0.4, animation: 'shimmer 1.5s infinite', filter: 'blur(1.5px)', boxShadow: '0 2px 8px #e0e0e0' }}
        />
      );
    }
  }

  return (
    <div style={{ marginTop: 16, width: 480, maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* First frame preview */}
      <div style={{ width: 480, maxWidth: '100%', height: 270, background: '#f5b0c4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 16 }}>
        {displayFirstFrameUrl ? (
          <img src={displayFirstFrameUrl} alt="First frame" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f5b0c4', borderRadius: 8, animation: 'shimmer 1.5s infinite', filter: 'blur(2px)' }} />
        )}
      </div>
      {/* Progress bar */}
      <div style={{ width: '100%', height: 18, borderRadius: 9, background: '#fdf6ec', boxShadow: '0 1px 3px rgba(183,153,255,0.06)', display: 'flex', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${donePercent}%`, background: '#b4c5f5', transition: 'width 0.3s' }} />
        <div style={{ width: `${processingPercent}%`, background: '#f5b0c4', transition: 'width 0.3s' }} />
        <div style={{ width: `${pendingPercent}%`, background: '#eee', transition: 'width 0.3s' }} />
      </div>
      {/* Progress text */}
      <div style={{ fontSize: 15, color: '#888', marginBottom: 4 }}>
        <span style={{ color: '#b4c5f5', fontWeight: 600 }}>{doneCount}</span> done,{' '}
        <span style={{ color: '#f5b0c4', fontWeight: 600 }}>{processingCount}</span> in process,{' '}
        <span style={{ color: '#aaa', fontWeight: 600 }}>{pendingCount}</span> pending /{' '}
        <span style={{ color: '#333', fontWeight: 600 }}>{frameCount}</span> total
      </div>
      {/* Horizontal scroll of frames */}
      <div style={{ width: '100%', overflowX: 'auto', display: 'flex', alignItems: 'center', marginTop: 10, paddingBottom: 6 }}>
        {frameThumbs}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>
    </div>
  );
};

export default VideoProgressFrames; 