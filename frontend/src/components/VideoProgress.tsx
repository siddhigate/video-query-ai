import React, { useEffect } from 'react';
import { STATIC_BASE } from '../api';
import { useVideoContext } from '../context/VideoContext';
import VideoProgressFrames from './VideoProgressFrames';

type VideoProgressProps = {
  videoId: string;
};

const VideoProgress: React.FC<VideoProgressProps> = ({ videoId }) => {
  const { state, dispatch } = useVideoContext();
  const progressState = state.progressState || { frameCount: 0, frameStatus: {} };

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/api/ws/progress/${videoId}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'get_progress' }));
    };
    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (!msg.type) return;
      if (msg.type === 'frames_extracted') {
        dispatch({ type: 'UPDATE_VIDEO_PROGRESS', progress: { frameCount: msg.data.frame_count, frameStatus: progressState.frameStatus || {} } });
      } else if (msg.type === 'frame_processing') {
        dispatch({
          type: 'UPDATE_VIDEO_PROGRESS',
          progress: {
            frameCount: progressState.frameCount,
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
            frameCount: progressState.frameCount,
            frameStatus: {
              ...progressState.frameStatus,
              [msg.data.frame_idx]: { status: 'done', url: msg.data.frame_url },
            },
          },
        });
      } else if (msg.type === 'all_frames_processed') {
        dispatch({
          type: 'UPDATE_VIDEO_PROGRESS',
          progress: { frameCount: progressState.frameCount, frameStatus: progressState.frameStatus, showPlayer: true },
        });
        dispatch({
          type: 'UPDATE_VIDEO_STATE',
          video_id: videoId,
          processing_state: 'success',
        });
      } else if (msg.type === 'progress_state') {
        const { in_process, done } = msg.data;
        let merged: any = {};
        in_process.forEach((item: { frame_idx: number, frame_url: string }) => {
          merged[item.frame_idx] = { status: 'processing', url: item.frame_url };
        });
        done.forEach((item: { frame_idx: number, frame_url: string }) => {
          merged[item.frame_idx] = { status: 'done', url: item.frame_url };
        });
        dispatch({
          type: 'UPDATE_VIDEO_PROGRESS',
          progress: { frameCount: progressState.frameCount, frameStatus: { ...merged, ...progressState.frameStatus } },
        });
      }
    };
    return () => ws.close();
    // eslint-disable-next-line
  }, [videoId]);

  return (
    <VideoProgressFrames
      frameCount={progressState.frameCount}
      frameStatus={progressState.frameStatus}
      showPlayer={progressState.showPlayer}
      videoId={videoId}
    />
  );
};

export default VideoProgress; 