import { VideoInfo as VideoInfoType } from '../types'

interface VideoInfoProps {
  video: VideoInfoType
}

export function VideoInfo({ video }: VideoInfoProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`
    }
    return `${views} views`
  }

  return (
    <div className="video-info">
      <div className="video-thumbnail">
        {video.thumbnail && (
          <img src={video.thumbnail} alt={video.title} />
        )}
      </div>
      <div className="video-details">
        <h2>{video.title}</h2>
        <div className="video-meta">
          <span className="uploader">{video.uploader}</span>
          <span className="separator">•</span>
          <span className="duration">{formatDuration(video.duration)}</span>
          {video.view_count > 0 && (
            <>
              <span className="separator">•</span>
              <span className="views">{formatViews(video.view_count)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
