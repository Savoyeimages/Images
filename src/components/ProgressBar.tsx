import { DownloadProgress } from '../types'

interface ProgressBarProps {
  progress: DownloadProgress | null
  isDownloading: boolean
  error: string | null
  successMessage: string | null
}

export function ProgressBar({
  progress,
  isDownloading,
  error,
  successMessage
}: ProgressBarProps) {
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond >= 1048576) {
      return `${(bytesPerSecond / 1048576).toFixed(2)} MB/s`
    } else if (bytesPerSecond >= 1024) {
      return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`
    }
    return `${bytesPerSecond.toFixed(0)} B/s`
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) {
      return `${(bytes / 1073741824).toFixed(2)} GB`
    } else if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(2)} MB`
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    }
    return `${bytes} B`
  }

  if (error) {
    return (
      <div className="progress-container error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      </div>
    )
  }

  if (successMessage) {
    return (
      <div className="progress-container success">
        <div className="success-message">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      </div>
    )
  }

  if (!isDownloading && !progress) {
    return null
  }

  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress?.percent || 0}%` }}
        />
      </div>
      {progress && (
        <div className="progress-stats">
          <span className="progress-percent">{progress.percent.toFixed(1)}%</span>
          <span className="progress-details">
            {formatBytes(progress.downloaded)} / {formatBytes(progress.total)}
          </span>
          {progress.speed > 0 && (
            <span className="progress-speed">{formatSpeed(progress.speed)}</span>
          )}
          {progress.eta > 0 && (
            <span className="progress-eta">ETA: {formatTime(progress.eta)}</span>
          )}
        </div>
      )}
    </div>
  )
}
