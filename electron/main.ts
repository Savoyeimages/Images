import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { PythonBridge } from './python-bridge'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let pythonBridge: PythonBridge | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    title: 'Video Downloader',
    backgroundColor: '#1a1a1a',
    show: false
  })

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Initialize Python bridge
async function initPythonBridge() {
  pythonBridge = new PythonBridge()
  await pythonBridge.start()
}

// App lifecycle
app.whenReady().then(async () => {
  await initPythonBridge()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (pythonBridge) {
    pythonBridge.stop()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  if (pythonBridge) {
    pythonBridge.stop()
  }
})

// IPC Handlers
ipcMain.handle('analyze-video', async (_, url: string) => {
  try {
    if (!pythonBridge) {
      throw new Error('Python bridge not initialized')
    }
    const result = await pythonBridge.analyzeVideo(url)
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('download-video', async (_, url: string, quality: string, outputPath: string) => {
  try {
    if (!pythonBridge) {
      throw new Error('Python bridge not initialized')
    }
    const result = await pythonBridge.downloadVideo(url, quality, outputPath)
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('select-download-folder', async () => {
  const { dialog } = await import('electron')
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  if (result.canceled) {
    return { success: false, path: null }
  }

  return { success: true, path: result.filePaths[0] }
})

// Handle download progress updates from Python
if (pythonBridge) {
  pythonBridge.on('download-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-progress', progress)
    }
  })
}
