import { useState } from 'react'

interface UrlInputProps {
  onAnalyze: (url: string) => void
  isLoading: boolean
}

export function UrlInput({ onAnalyze, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onAnalyze(url.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="url-input-container">
      <div className="input-group">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter video URL (YouTube, Vimeo, etc.)"
          disabled={isLoading}
          className="url-input"
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="analyze-button"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </form>
  )
}
