const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let pythonProcess;

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start Python backend process
function startPythonBackend() {
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  const scriptPath = path.join(__dirname, 'backend.py');

  pythonProcess = spawn(pythonExecutable, [scriptPath]);

  pythonProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());

    lines.forEach(line => {
      try {
        const response = JSON.parse(line);
        // Send response back to renderer via pending request
        if (pendingRequests.size > 0) {
          const [requestId, callback] = pendingRequests.entries().next().value;
          pendingRequests.delete(requestId);
          callback(response);
        }
      } catch (e) {
        console.error('Failed to parse Python response:', e);
      }
    });
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error('Python stderr:', data.toString());
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });

  pythonProcess.on('error', (error) => {
    console.error('Failed to start Python process:', error);
  });
}

// Request ID counter and pending requests map
let requestIdCounter = 0;
const pendingRequests = new Map();

// Send message to Python backend
function sendToPython(message) {
  return new Promise((resolve, reject) => {
    const requestId = requestIdCounter++;

    // Store the callback
    pendingRequests.set(requestId, (response) => {
      resolve(response);
    });

    // Send to Python
    try {
      pythonProcess.stdin.write(JSON.stringify(message) + '\n');
    } catch (error) {
      pendingRequests.delete(requestId);
      reject(error);
    }

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }
    }, 30000);
  });
}

// IPC Handlers

// Extract video info
ipcMain.handle('extract-video-info', async (event, url) => {
  try {
    const response = await sendToPython({
      action: 'extract_info',
      url: url
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      error_type: 'IPCError'
    };
  }
});

// Test Python connection
ipcMain.handle('ping-backend', async () => {
  try {
    const response = await sendToPython({
      action: 'ping'
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// App lifecycle
app.whenReady().then(() => {
  startPythonBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});
