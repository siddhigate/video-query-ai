import React from 'react';
import { STATIC_BASE } from '../api';

export type FrameStatus = { [idx: number]: { status: 'pending' | 'processing' | 'done', url?: string } };

interface VideoProgressFramesProps {
  frameCount: number;
  frameStatus: FrameStatus;
  showPlayer?: boolean;
  videoId?: string;
}

const VideoProgressFrames: React.FC<VideoProgressFramesProps> = ({ frameCount, frameStatus, showPlayer, videoId }) => {
  if (showPlayer && videoId) {
    return (
      <div style={{ marginTop: 16 }}>
        <video controls width={480} src={`${STATIC_BASE}/videos/${videoId}/video.mp4`} />
      </div>
    );
  }
  return (
    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
      {[...Array(frameCount || 0)].map((_, idx) => {
        const status = frameStatus?.[idx]?.status;
        const url = frameStatus?.[idx]?.url;
        if (!status) {
          return <div key={idx} style={{ width: 80, height: 60, background: '#eee', borderRadius: 4, animation: 'shimmer 1.5s infinite', filter: 'blur(2px)' }} />;
        }
        if (status === 'processing') {
          return <img key={idx} src={url ? `${STATIC_BASE}${url}` : undefined} alt='' style={{ width: 80, height: 60, borderRadius: 4, filter: 'blur(6px) grayscale(0.7)' }} />;
        }
        if (status === 'done') {
          return <img key={idx} src={url ? `${STATIC_BASE}${url}` : undefined} alt='' style={{ width: 80, height: 60, borderRadius: 4 }} />;
        }
        return null;
      })}
    </div>
  );
};

export default VideoProgressFrames; 