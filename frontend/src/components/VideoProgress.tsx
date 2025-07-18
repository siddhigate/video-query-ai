import React, { useEffect, useRef, useState } from 'react';
import { useVideoContext } from '../context/VideoContext';
import VideoProgressFrames from './VideoProgressFrames';

// Module-level cache for WebSocket instances and ref counts
const wsCache: Map<string, { ws: WebSocket, refCount: number, isOpen: boolean }> = new Map();

type VideoProgressProps = {
  videoId: string;
};

const VideoProgress: React.FC<VideoProgressProps> = ({ videoId }) => {
  const { state, dispatch } = useVideoContext();
  const progressState = state.progressState || { frameCount: 0, frameStatus: {} };
  const wsRef = useRef<WebSocket | null>(null);
  const [loading, setLoading] = useState(true);
  const [extractionInProgress, setExtractionInProgress] = useState(true);
  const [frameCount, setFrameCount] = useState(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    let wsEntry = wsCache.get(videoId);
    if (!wsEntry) {
      const ws = new WebSocket(`ws://localhost:8000/api/ws/progress/${videoId}`);
      wsEntry = { ws, refCount: 0, isOpen: false };
      wsCache.set(videoId, wsEntry);
      ws.onopen = () => {
        wsEntry!.isOpen = true;
        ws.send(JSON.stringify({ type: 'get_progress' }));
      };
      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (!msg.type) return;
        if (msg.type === 'frames_extracted') {
          const count = msg.data?.frame_count || 0;
          setFrameCount(count);
          setExtractionInProgress(false);
          setLoading(false);
          dispatch({
            type: 'UPDATE_VIDEO_PROGRESS',
            progress: { frameCount: count, frameStatus: progressState.frameStatus || {} },
          });
        } else if (msg.type === 'progress_state') {
          const { in_process, done, total_frames, first_frame_url, extraction_in_progress } = msg.data ? msg.data : msg;
          let merged: any = {};
          if (in_process && done) {
            in_process.forEach((item: { frame_idx: number, frame_url: string }) => {
              merged[item.frame_idx] = { status: 'processing', url: item.frame_url };
            });
            done.forEach((item: { frame_idx: number, frame_url: string }) => {
              merged[item.frame_idx] = { status: 'done', url: item.frame_url };
            });
          }
          if (total_frames && total_frames > 0) {
            setFrameCount(total_frames);
            setExtractionInProgress(false);
            setLoading(false);
          } else {
            setExtractionInProgress(true);
            setLoading(true);
          }
          dispatch({
            type: 'UPDATE_VIDEO_PROGRESS',
            progress: { frameCount: total_frames || frameCount, frameStatus: { ...merged, ...progressState.frameStatus }, firstFrameUrl: first_frame_url },
          });
        } else if (msg.type === 'frame_processing') {
          dispatch({
            type: 'UPDATE_VIDEO_PROGRESS',
            progress: {
              frameCount: frameCount,
              frameStatus: {
                ...progressState.frameStatus,
                [msg.data.frame_idx]: { status: 'processing', url: msg.data.frame_url },
              },
            },
          });
        } else if (msg.type === 'frame_processed') {
          dispatch({
            type: 'UPDATE_VIDEO_PROGRESS',
            progress: {
              frameCount: frameCount,
              frameStatus: {
                ...progressState.frameStatus,
                [msg.data.frame_idx]: { status: 'done', url: msg.data.frame_url },
              },
            },
          });
        } else if (msg.type === 'all_frames_processed') {
          dispatch({
            type: 'UPDATE_VIDEO_PROGRESS',
            progress: { frameCount: frameCount, frameStatus: progressState.frameStatus, showPlayer: true },
          });
          dispatch({
            type: 'UPDATE_VIDEO_STATE',
            video_id: videoId,
            processing_state: 'success',
          });
        }
      };
      ws.onerror = () => {
        if (mountedRef.current) setLoading(false);
      };
    }
    wsEntry.refCount++;
    wsRef.current = wsEntry.ws;

    return () => {
      mountedRef.current = false;
      // Decrement refCount and close if this was the last user
      const entry = wsCache.get(videoId);
      if (entry) {
        entry.refCount--;
        if (entry.refCount <= 0) {
          // Only close if open or connecting
          if (entry.ws.readyState === WebSocket.OPEN || entry.ws.readyState === WebSocket.CONNECTING) {
            try { entry.ws.close(); } catch {}
          }
          wsCache.delete(videoId);
        }
      }
    };
    // eslint-disable-next-line
  }, [videoId]);

  if (loading || extractionInProgress || frameCount === 0) {
    return <div style={{ textAlign: 'center', marginTop: 40 }}>Extracting frames, please wait...</div>;
  }

  return (
    <VideoProgressFrames
      frameCount={frameCount}
      frameStatus={progressState.frameStatus}
      showPlayer={progressState.showPlayer}
      videoId={videoId}
      firstFrameUrl={progressState.firstFrameUrl}
    />
  );
};

export default VideoProgress; 