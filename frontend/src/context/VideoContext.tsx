import  { createContext, useReducer, useContext } from 'react';
import type { ReactNode, Dispatch } from 'react';

export type Video = {
  video_id: string;
  video_name: string;
  created_at: string;
  updated_at: string;
  processing_state?: string;
  frame_count?: number;
};

export type VideoProgress = {
  frameCount: number;
  frameStatus: { [idx: number]: { status: 'pending' | 'processing' | 'done', url?: string } };
  showPlayer?: boolean;
  firstFrameUrl?: string;
};

export type VideoState = {
  videos: Video[];
  progressVideoId: string | null;
  progressState: VideoProgress | null;
};

export type VideoAction =
  | { type: 'SET_VIDEOS'; videos: Video[] }
  | { type: 'UPDATE_VIDEO_STATE'; video_id: string; processing_state: string }
  | { type: 'UPDATE_VIDEO_PROGRESS'; progress: VideoProgress }
  | { type: 'SET_PROGRESS_VIDEO'; video_id: string; progress: VideoProgress }
  | { type: 'CLEAR_PROGRESS_VIDEO' };

const initialState: VideoState = {
  videos: [],
  progressVideoId: null,
  progressState: null,
};

function videoReducer(state: VideoState, action: VideoAction): VideoState {
  switch (action.type) {
    case 'SET_VIDEOS':
      return { ...state, videos: action.videos };
    case 'UPDATE_VIDEO_STATE':
      return {
        ...state,
        videos: state.videos.map(v =>
          v.video_id === action.video_id ? { ...v, processing_state: action.processing_state } : v
        ),
      };
    case 'UPDATE_VIDEO_PROGRESS': {
      // Deep merge frameStatus for robust websocket event handling
      const prev = state.progressState || { frameCount: 0, frameStatus: {} };
      const next = action.progress || {};
      return {
        ...state,
        progressState: {
          frameCount: next.frameCount !== undefined ? next.frameCount : prev.frameCount,
          frameStatus: { ...prev.frameStatus, ...(next.frameStatus || {}) },
          showPlayer: next.showPlayer !== undefined ? next.showPlayer : prev.showPlayer,
          firstFrameUrl: next.firstFrameUrl !== undefined ? next.firstFrameUrl : prev.firstFrameUrl,
        },
      };
    }
    case 'SET_PROGRESS_VIDEO':
      return { ...state, progressVideoId: action.video_id, progressState: action.progress };
    case 'CLEAR_PROGRESS_VIDEO':
      return { ...state, progressVideoId: null, progressState: null };
    default:
      return state;
  }
}

const VideoContext = createContext<{ state: VideoState; dispatch: Dispatch<VideoAction> } | undefined>(undefined);

export const VideoProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(videoReducer, initialState);
  return <VideoContext.Provider value={{ state, dispatch }}>{children}</VideoContext.Provider>;
};

export function useVideoContext() {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error('useVideoContext must be used within VideoProvider');
  return ctx;
} 