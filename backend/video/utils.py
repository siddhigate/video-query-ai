def get_frame_url(video_id: str, frame_idx: int) -> str:
    # Frame files are named frame_00001.jpg, etc.
    frame_name = f"frame_{frame_idx+1:05d}.jpg"
    return f"/frames/{video_id}/{frame_name}" 