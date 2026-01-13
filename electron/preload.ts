import { contextBridge, ipcRenderer } from 'electron'

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
}

export interface DownloadProgress {
  percent: number
  downloaded: number
  total: number
  speed: number
  eta: number
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  analyzeVideo: (url: string): Promise<{ success: boolean; data?: VideoInfo; error?: string }> =>
    ipcRenderer.invoke('analyze-video', url),

  downloadVideo: (url: string, quality: string, outputPath: string): Promise<{ success: boolean; data?: any; error?: string }> =>
    ipcRenderer.invoke('download-video', url, quality, outputPath),

  selectDownloadFolder: (): Promise<{ success: boolean; path: string | null }> =>
    ipcRenderer.invoke('select-download-folder'),

  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const subscription = (_: any, progress: DownloadProgress) => callback(progress)
    ipcRenderer.on('download-progress', subscription)

    return () => {
      ipcRenderer.removeListener('download-progress', subscription)
    }
  }
})
