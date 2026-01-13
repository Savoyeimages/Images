const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Extract video information
  extractVideoInfo: (url) => ipcRenderer.invoke('extract-video-info', url),

  // Test backend connection
  pingBackend: () => ipcRenderer.invoke('ping-backend')
});
