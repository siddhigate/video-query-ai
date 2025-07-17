import { useState, useRef, useEffect } from 'react'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [videos, setVideos] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const fetchVideos = async () => {
    const res = await fetch('http://localhost:8000/videos')
    if (res.ok) {
      const data = await res.json()
      setVideos(data)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setDone(false)

    const formData = new FormData()
    formData.append('file', file)

    await fetch('http://localhost:8000/upload', {
      method: 'POST',
      body: formData,
    })

    setUploading(false)
    setDone(true)
    fetchVideos()
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Video Query</h1>
      <div style={{ marginTop: 24 }}>
        <input type="file" accept="video/*" ref={fileInputRef} disabled={uploading} />
        <button onClick={handleUpload} disabled={uploading} style={{ marginLeft: 8 }}>
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
        {done && (
          <div style={{ marginTop: 12, color: 'green' }}>
            Done!
          </div>
        )}
      </div>
      <div style={{ marginTop: 32, textAlign: 'left' }}>
        <h2>Uploaded Videos</h2>
        {videos.length === 0 ? (
          <div>No videos uploaded yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: 4 }}>Video ID</th>
                <th style={{ border: '1px solid #ccc', padding: 4 }}>Name</th>
                <th style={{ border: '1px solid #ccc', padding: 4 }}>Created At</th>
                <th style={{ border: '1px solid #ccc', padding: 4 }}>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.video_id}>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.video_id}</td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.video_name}</td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.created_at}</td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>{video.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default App
