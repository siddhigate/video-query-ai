import { createContext, useReducer, useContext } from 'react';
import type { ReactNode, Dispatch } from 'react';

type Video = {
  video_id: string;
  video_name: string;
  created_at: string;
  updated_at: string;
};

type State = {
  videos: Video[];
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: 'SET_VIDEOS'; payload: Video[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: State = {
  videos: [],
  loading: false,
  error: null,
};

function videoReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VIDEOS':
      return { ...state, videos: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const VideoStateContext = createContext<State | undefined>(undefined);
const VideoDispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(videoReducer, initialState);
  return (
    <VideoStateContext.Provider value={state}>
      <VideoDispatchContext.Provider value={dispatch}>
        {children}
      </VideoDispatchContext.Provider>
    </VideoStateContext.Provider>
  );
}

export function useVideoState() {
  const context = useContext(VideoStateContext);
  if (context === undefined) {
    throw new Error('useVideoState must be used within a VideoProvider');
  }
  return context;
}

export function useVideoDispatch() {
  const context = useContext(VideoDispatchContext);
  if (context === undefined) {
    throw new Error('useVideoDispatch must be used within a VideoProvider');
  }
  return context;
} 