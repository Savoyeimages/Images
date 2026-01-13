import { useState, useEffect } from 'react'
import { UrlInput } from './components/UrlInput'
import { VideoInfo } from './components/VideoInfo'
import { QualitySelector } from './components/QualitySelector'
import { ProgressBar } from './components/ProgressBar'
import { VideoInfo as VideoInfoType, DownloadProgress } from './types'
import './styles/App.css'

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfoType | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [selectedQuality, setSelectedQuality] = useState('')
  const [downloadPath, setDownloadPath] = useState('')
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    // Set up download progress listener
    const unsubscribe = window.electronAPI.onDownloadProgress((progress) => {
      setProgress(progress)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true)
    setError(null)
    setSuccessMessage(null)
    setVideoInfo(null)
    setProgress(null)

    try {
      const result = await window.electronAPI.analyzeVideo(url)

      if (result.success && result.data) {
        setVideoInfo(result.data)
        setVideoUrl(url)
        if (result.data.formats.length > 0) {
          setSelectedQuality(result.data.formats[0].format_id)
        }
      } else {
        setError(result.error || 'Failed to analyze video')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSelectFolder = async () => {
    const result = await window.electronAPI.selectDownloadFolder()
    if (result.success && result.path) {
      setDownloadPath(result.path)
    }
  }

  const handleDownload = async () => {
    if (!videoInfo || !selectedQuality) return

    if (!downloadPath) {
      setError('Please select a download folder')
      return
    }

    setIsDownloading(true)
    setError(null)
    setSuccessMessage(null)
    setProgress(null)

    try {
      const result = await window.electronAPI.downloadVideo(
        videoUrl,
        selectedQuality,
        downloadPath
      )

      if (result.success) {
        setSuccessMessage(`Download completed: ${result.data?.filename || 'Video downloaded successfully'}`)
        setProgress(null)
      } else {
        setError(result.error || 'Download failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📹 Video Downloader</h1>
        <p>Download videos from YouTube, Vimeo, and more</p>
      </header>

      <main className="app-main">
        <UrlInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} />

        {videoInfo && (
          <>
            <VideoInfo video={videoInfo} />

            <div className="download-section">
              <QualitySelector
                formats={videoInfo.formats}
                selectedQuality={selectedQuality}
                onQualityChange={setSelectedQuality}
                disabled={isDownloading}
              />

              <div className="download-path-section">
                <label>Download Location:</label>
                <div className="path-selector">
                  <input
                    type="text"
                    value={downloadPath}
                    readOnly
                    placeholder="Select a folder..."
                    className="path-input"
                  />
                  <button
                    onClick={handleSelectFolder}
                    disabled={isDownloading}
                    className="select-folder-button"
                  >
                    Browse
                  </button>
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={isDownloading || !selectedQuality || !downloadPath}
                className="download-button"
              >
                {isDownloading ? 'Downloading...' : 'Download'}
              </button>
            </div>

            <ProgressBar
              progress={progress}
              isDownloading={isDownloading}
              error={error}
              successMessage={successMessage}
            />
          </>
        )}

        {!videoInfo && !isAnalyzing && error && (
          <ProgressBar
            progress={null}
            isDownloading={false}
            error={error}
            successMessage={null}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by yt-dlp and ffmpeg</p>
      </footer>
    </div>
  )
}

export default App
