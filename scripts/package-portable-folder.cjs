const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const source = path.join(root, 'release', 'win-unpacked');
const destination = path.join(root, 'dist', `PlaneoFUT-Portable-${pkg.version}`);
const configCandidates = [
  path.join(root, 'portable-config.json'),
  path.join(root, 'dist', 'portable-config.json'),
];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function isUsableConfig(config) {
  if (!config || typeof config !== 'object') return false;
  const url = String(config.supabaseUrl || '');
  const key = String(config.supabasePublishableKey || '');
  return /^https:\/\/[^/]+\.supabase\.co\/?$/i.test(url)
    && key.length > 20
    && !/TU_(PROYECTO|CLAVE)|your-(project|publishable)/i.test(`${url} ${key}`);
}

if (!fs.existsSync(path.join(source, 'PlaneoFUT.exe'))) {
  throw new Error(`Unpacked app not found: ${source}. Run electron-builder --win dir --x64 first.`);
}

const config = configCandidates.find(candidate => isUsableConfig(readJson(candidate)));
if (!config) {
  throw new Error('No usable portable-config.json found. Configure Supabase before preparing the portable folder.');
}

fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(source, destination, { recursive: true });
fs.copyFileSync(config, path.join(destination, 'portable-config.json'));
fs.copyFileSync(path.join(root, 'portable-config.example.json'), path.join(destination, 'portable-config.example.json'));
fs.copyFileSync(path.join(root, 'PORTABLE-WINDOWS.md'), path.join(destination, 'PORTABLE-WINDOWS.md'));

console.log(JSON.stringify({
  portableFolder: path.relative(root, destination),
  executable: path.relative(root, path.join(destination, 'PlaneoFUT.exe')),
  configSource: path.relative(root, config),
  configIncluded: true,
}));
