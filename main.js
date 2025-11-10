// main.js
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createMainWindow(){
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools();
}

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Export Itineraries (JSON)',
        click: async () => {
          const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Export itineraries',
            defaultPath: 'itineraries.json',
            filters: [{ name: 'JSON', extensions: ['json'] }]
          });
          if (canceled) return;
          // ask renderer to supply data
          mainWindow.webContents.send('request:export');
          ipcMain.once('reply:export', (e, jsonStr) => {
            fs.writeFile(filePath, jsonStr, (err) => {
              if (err) dialog.showErrorBox('Save failed', err.message);
              else dialog.showMessageBox({ message: 'Export saved.' });
            });
          });
        }
      },
      { type: 'separator' },
      { role: 'quit', label: 'Exit' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click: () => {
          dialog.showMessageBox({
            title: 'About World Explorer',
            message: 'World Explorer — created for CSC2923. Author: (your name).'
          });
        }
      }
    ]
  }
];

app.whenReady().then(() => {
  createMainWindow();
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
