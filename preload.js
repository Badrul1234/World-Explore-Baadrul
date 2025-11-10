// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  requestExport: () => ipcRenderer.send('request:export'),
  onRequestExport: (cb) => ipcRenderer.on('request:export', cb),
  sendExportReply: (data) => ipcRenderer.send('reply:export', data)
});
