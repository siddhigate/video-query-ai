import React, { useState } from 'react';
import { deleteVideo, updateVideo } from '../api';

type Video = {
  video_id: string;
  video_name: string;
  created_at: string;
  updated_at: string;
};

type VideoRowProps = {
  video: Video;
  onDelete: () => void;
  onUpdate: () => void;
};

const VideoRow: React.FC<VideoRowProps> = ({ video, onDelete, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(video.video_name);

  const handleDelete = async () => {
    await deleteVideo(video.video_id);
    onDelete();
  };

  const handleUpdate = async () => {
    await updateVideo(video.video_id, editName);
    setEditMode(false);
    onUpdate();
  };

  return (
    <tr>
      <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.video_id}</td>
      <td style={{ border: '1px solid #ccc', padding: 4 }}>
        {editMode ? (
          <>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              style={{ width: 120 }}
            />
            <button onClick={handleUpdate}>Save</button>
            <button onClick={() => setEditMode(false)}>Cancel</button>
          </>
        ) : (
          <>
            {video.video_name}
            <button style={{ marginLeft: 8 }} onClick={() => setEditMode(true)}>Edit</button>
          </>
        )}
      </td>
      <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.created_at}</td>
      <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.updated_at}</td>
      <td style={{ border: '1px solid #ccc', padding: 4 }}>
        <button style={{ color: 'red' }} onClick={handleDelete}>Delete</button>
      </td>
    </tr>
  );
};

export default VideoRow; 