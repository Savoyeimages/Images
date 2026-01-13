import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { app } from 'electron'
import { EventEmitter } from 'events'

export interface VideoInfo {
  title: string
  thumbnail: string
  duration: number
  formats: any[]
  uploader: string
  view_count: number
}

export class PythonBridge extends EventEmitter {
  private pythonProcess: ChildProcess | null = null
  private isProduction: boolean

  constructor() {
    super()
    this.isProduction = app.isPackaged
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonPath = this.isProduction
        ? path.join(process.resourcesPath, 'python')
        : path.join(app.getAppPath(), 'python')

      const scriptPath = path.join(pythonPath, 'main.py')

      // Use system python or bundled python
      const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3'

      this.pythonProcess = spawn(pythonExecutable, [scriptPath], {
        cwd: pythonPath,
        env: { ...process.env }
      })

      this.pythonProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim()
        console.log('[Python stdout]:', output)

        try {
          const message = JSON.parse(output)
          if (message.type === 'progress') {
            this.emit('download-progress', message.data)
          }
        } catch {
          // Not JSON, regular log output
        }
      })

      this.pythonProcess.stderr?.on('data', (data) => {
        console.error('[Python stderr]:', data.toString())
      })

      this.pythonProcess.on('error', (error) => {
        console.error('Python process error:', error)
        reject(error)
      })

      this.pythonProcess.on('exit', (code) => {
        console.log(`Python process exited with code ${code}`)
        this.pythonProcess = null
      })

      // Give Python a moment to start
      setTimeout(() => resolve(), 1000)
    })
  }

  stop(): void {
    if (this.pythonProcess) {
      this.pythonProcess.kill()
      this.pythonProcess = null
    }
  }

  async analyzeVideo(url: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Analysis timeout'))
      }, 30000)

      const command = JSON.stringify({ action: 'analyze', url })

      if (!this.pythonProcess || !this.pythonProcess.stdin) {
        clearTimeout(timeout)
        reject(new Error('Python process not available'))
        return
      }

      const dataHandler = (data: Buffer) => {
        const output = data.toString().trim()
        try {
          const response = JSON.parse(output)
          if (response.type === 'result' && response.action === 'analyze') {
            clearTimeout(timeout)
            this.pythonProcess?.stdout?.removeListener('data', dataHandler)
            if (response.success) {
              resolve(response.data)
            } else {
              reject(new Error(response.error || 'Analysis failed'))
            }
          }
        } catch {
          // Not the response we're looking for
        }
      }

      this.pythonProcess.stdout?.on('data', dataHandler)
      this.pythonProcess.stdin.write(command + '\n')
    })
  }

  async downloadVideo(url: string, quality: string, outputPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Download timeout'))
      }, 300000) // 5 minutes timeout

      const command = JSON.stringify({
        action: 'download',
        url,
        quality,
        output_path: outputPath
      })

      if (!this.pythonProcess || !this.pythonProcess.stdin) {
        clearTimeout(timeout)
        reject(new Error('Python process not available'))
        return
      }

      const dataHandler = (data: Buffer) => {
        const output = data.toString().trim()
        try {
          const response = JSON.parse(output)
          if (response.type === 'result' && response.action === 'download') {
            clearTimeout(timeout)
            this.pythonProcess?.stdout?.removeListener('data', dataHandler)
            if (response.success) {
              resolve(response.data)
            } else {
              reject(new Error(response.error || 'Download failed'))
            }
          }
        } catch {
          // Not the response we're looking for
        }
      }

      this.pythonProcess.stdout?.on('data', dataHandler)
      this.pythonProcess.stdin.write(command + '\n')
    })
  }
}
