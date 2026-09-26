const { app, BrowserWindow, shell, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { start } = require('./server.cjs');

const base = process.env.PORTABLE_EXECUTABLE_DIR
  ? path.resolve(process.env.PORTABLE_EXECUTABLE_DIR)
  : app.isPackaged
    ? path.dirname(process.execPath)
    : path.resolve(__dirname, '..');
const configPath = path.join(base, 'portable-config.json');
const defaultConfig = {
  supabaseUrl: '',
  supabasePublishableKey: '',
  openaiApiKey: '',
  googleOAuthEnabled: false,
  emailConfirmationRequired: false,
  supportEmail: '',
};

function readEmbeddedConfig() {
  // Config horneada en build (scripts/generate-portable-runtime-config.cjs), empaquetada dentro
  // del app.asar. Es la vía normal para una distribución: los compañeros entrenadores nunca ven
  // ni necesitan un portable-config.json suelto.
  try { return require('./runtime-config.generated.cjs'); }
  catch { return null; }
}

function readConfig() {
  const embedded = readEmbeddedConfig();
  if (embedded) return { ...defaultConfig, ...embedded };
  // Sin config embebida (build de desarrollo sin empaquetar): admite un portable-config.json
  // suelto junto al ejecutable, igual que antes.
  try { return { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }; }
  catch { fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2)); return defaultConfig; }
}

async function createWindow() {
  const config = readConfig();
  const { port, server } = await start(config);
  const win = new BrowserWindow({ width: 1440, height: 920, minWidth: 1024, minHeight: 700, title: 'PlaneoFUT', autoHideMenuBar: true, webPreferences: { contextIsolation: true, nodeIntegration: false, devTools: !app.isPackaged } });
  win.on('closed', () => server.close());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  await win.loadURL(`http://127.0.0.1:${port}/`);
}
app.whenReady().then(createWindow).catch(error => { dialog.showErrorBox('PlaneoFUT', String(error?.stack || error)); app.quit(); });
app.on('window-all-closed', () => app.quit());
