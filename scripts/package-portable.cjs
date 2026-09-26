const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const artifactName = `PlaneoFUT-Portable-${pkg.version}.exe`;
const archiveName = `PlaneoFUT-Portable-${pkg.version}.zip`;
const releaseDir = path.join(root, 'release');
const distDir = path.join(root, 'dist');
const executable = path.join(releaseDir, artifactName);
const exampleConfig = path.join(root, 'portable-config.example.json');
const configCandidates = [
  path.join(root, 'portable-config.json'),
  path.join(distDir, 'portable-config.json'),
];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function isUsableConfig(config) {
  if (!config || typeof config !== 'object') return false;
  const url = String(config.supabaseUrl || '');
  const key = String(config.supabasePublishableKey || '');
  return /^https:\/\/[^/]+\.supabase\.co\/?$/i.test(url)
    && key.length > 20
    && !/TU_(PROYECTO|CLAVE)|your-(project|publishable)/i.test(`${url} ${key}`);
}

function getConfiguredSource() {
  for (const candidate of configCandidates) {
    if (isUsableConfig(readJson(candidate))) return candidate;
  }
  throw new Error(
    'No usable portable-config.json found. Configure supabaseUrl and supabasePublishableKey before creating a distributable portable.',
  );
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

if (!fs.existsSync(executable)) {
  throw new Error(`Portable executable not found: ${executable}. Run electron-builder before this script.`);
}

const configuredSource = getConfiguredSource();
fs.mkdirSync(distDir, { recursive: true });
copyFile(executable, path.join(distDir, artifactName));
copyFile(configuredSource, path.join(distDir, 'portable-config.json'));
copyFile(exampleConfig, path.join(distDir, 'portable-config.example.json'));
copyFile(path.join(root, 'PORTABLE-WINDOWS.md'), path.join(distDir, 'PORTABLE-WINDOWS.md'));

const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'planeofut-portable-'));
const bundleDir = path.join(stagingRoot, path.parse(archiveName).name);
fs.mkdirSync(bundleDir);

try {
  for (const filename of [artifactName, 'portable-config.json', 'portable-config.example.json', 'PORTABLE-WINDOWS.md']) {
    copyFile(path.join(distDir, filename), path.join(bundleDir, filename));
  }

  const archive = path.join(distDir, archiveName);
  fs.rmSync(archive, { force: true });
  execFileSync('tar', ['-a', '-c', '-f', archive, '-C', stagingRoot, path.basename(bundleDir)], { stdio: 'inherit' });

  const entries = execFileSync('tar', ['-tf', archive], { encoding: 'utf8' });
  for (const required of [artifactName, 'portable-config.json']) {
    if (!entries.includes(required)) throw new Error(`Archive validation failed: missing ${required}`);
  }
} finally {
  fs.rmSync(stagingRoot, { recursive: true, force: true });
}

console.log(JSON.stringify({
  executable: path.join('dist', artifactName),
  archive: path.join('dist', archiveName),
  configSource: path.relative(root, configuredSource),
  configIncluded: true,
}));
