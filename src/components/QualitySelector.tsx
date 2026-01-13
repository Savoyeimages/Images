import { VideoFormat } from '../types'

interface QualitySelectorProps {
  formats: VideoFormat[]
  selectedQuality: string
  onQualityChange: (formatId: string) => void
  disabled: boolean
}

export function QualitySelector({
  formats,
  selectedQuality,
  onQualityChange,
  disabled
}: QualitySelectorProps) {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size'
    if (bytes >= 1073741824) {
      return `${(bytes / 1073741824).toFixed(2)} GB`
    } else if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(2)} MB`
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    }
    return `${bytes} bytes`
  }

  return (
    <div className="quality-selector">
      <label htmlFor="quality">Select Quality:</label>
      <select
        id="quality"
        value={selectedQuality}
        onChange={(e) => onQualityChange(e.target.value)}
        disabled={disabled}
        className="quality-dropdown"
      >
        {formats.map((format) => (
          <option key={format.format_id} value={format.format_id}>
            {format.quality} - {format.ext}
            {format.filesize ? ` (${formatFileSize(format.filesize)})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
