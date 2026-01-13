export interface VideoInfo {
  title: string
  thumbnail: string
  duration: number
  formats: VideoFormat[]
  uploader: string
  view_count: number
}

export interface VideoFormat {
  format_id: string
  ext: string
  quality: string
  filesize?: number
  resolution?: string
  height?: number
}

export interface DownloadProgress {
  percent: number
  downloaded: number
  total: number
  speed: number
  eta: number
}

export interface ElectronAPI {
  analyzeVideo: (url: string) => Promise<{ success: boolean; data?: VideoInfo; error?: string }>
  downloadVideo: (url: string, quality: string, outputPath: string) => Promise<{ success: boolean; data?: any; error?: string }>
  selectDownloadFolder: () => Promise<{ success: boolean; path: string | null }>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
