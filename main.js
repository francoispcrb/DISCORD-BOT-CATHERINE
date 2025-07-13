const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let botProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,  // à activer pour accès Node dans renderer
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('start-bot', () => {
  if (botProcess) return;

  botProcess = spawn('node', ['bot/index.js'], { cwd: __dirname });

  botProcess.stdout.on('data', data => {
    mainWindow.webContents.send('bot-log', data.toString());
  });

  botProcess.stderr.on('data', data => {
    mainWindow.webContents.send('bot-log', data.toString());
  });

  botProcess.on('close', code => {
    mainWindow.webContents.send('bot-log', `Bot exited with code ${code}\n`);
    botProcess = null;
  });
});

ipcMain.on('stop-bot', () => {
  if (botProcess) {
    botProcess.kill();
    botProcess = null;
  }
});
