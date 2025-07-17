from pydantic import BaseModel
from typing import List, Optional

class FrameInfo(BaseModel):
    frame_idx: int
    frame_url: str
    description: Optional[str] = None
    timestamp: Optional[float] = None

class ProgressStateData(BaseModel):
    in_process: List[FrameInfo]
    done: List[FrameInfo]
    total_frames: Optional[int] = None
    first_frame_url: Optional[str] = None

class FrameProcessingEvent(BaseModel):
    type: str = "frame_processing"
    data: FrameInfo

class FrameProcessedEvent(BaseModel):
    type: str = "frame_processed"
    data: FrameInfo

class FrameErrorEvent(BaseModel):
    type: str = "frame_error"
    data: dict

class ProgressStateEvent(BaseModel):
    type: str = "progress_state"
    data: ProgressStateData 