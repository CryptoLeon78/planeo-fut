const { app, BrowserWindow, shell, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { start } = require('./server.cjs');

const base = app.isPackaged ? path.dirname(process.execPath) : path.resolve(__dirname, '..');
const configPath = path.join(base, 'portable-config.json');
const defaultConfig = { supabaseUrl: '', supabasePublishableKey: '', openaiApiKey: '' };

function readConfig() {
  try { return { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }; }
  catch { fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2)); return defaultConfig; }
}

async function createWindow() {
  const config = readConfig();
  const { port, server } = await start(config);
  const win = new BrowserWindow({ width: 1440, height: 920, minWidth: 1024, minHeight: 700, title: 'PlaneoFUT', autoHideMenuBar: true, webPreferences: { contextIsolation: true, nodeIntegration: false } });
  win.on('closed', () => server.close());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  await win.loadURL(`http://127.0.0.1:${port}/`);
}
app.whenReady().then(createWindow).catch(error => { dialog.showErrorBox('PlaneoFUT', String(error?.stack || error)); app.quit(); });
app.on('window-all-closed', () => app.quit());
