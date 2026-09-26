// Empaqueta el .exe único de electron-builder (formato "portable" de NSIS) como
// dist/PlaneoFUT-Portable-<version>.exe + .zip. La configuración de Supabase ya va
// horneada dentro del .exe (ver scripts/generate-portable-runtime-config.cjs): el
// ZIP distribuido no lleva ningún portable-config.json suelto.
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

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

if (!fs.existsSync(executable)) {
  throw new Error(`Portable executable not found: ${executable}. Run electron-builder before this script.`);
}

fs.mkdirSync(distDir, { recursive: true });
copyFile(executable, path.join(distDir, artifactName));
copyFile(path.join(root, 'PORTABLE-WINDOWS.md'), path.join(distDir, 'PORTABLE-WINDOWS.md'));

const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'planeofut-portable-'));
const bundleDir = path.join(stagingRoot, path.parse(archiveName).name);
fs.mkdirSync(bundleDir);

try {
  for (const filename of [artifactName, 'PORTABLE-WINDOWS.md']) {
    copyFile(path.join(distDir, filename), path.join(bundleDir, filename));
  }

  const archive = path.join(distDir, archiveName);
  fs.rmSync(archive, { force: true });
  execFileSync('tar', ['-a', '-c', '-f', archive, '-C', stagingRoot, path.basename(bundleDir)], { stdio: 'inherit' });

  const entries = execFileSync('tar', ['-tf', archive], { encoding: 'utf8' });
  if (!entries.includes(artifactName)) throw new Error(`Archive validation failed: missing ${artifactName}`);
  if (entries.includes('portable-config')) throw new Error('Archive validation failed: a loose portable-config file leaked into the distributable.');
} finally {
  fs.rmSync(stagingRoot, { recursive: true, force: true });
}

console.log(JSON.stringify({
  executable: path.join('dist', artifactName),
  archive: path.join('dist', archiveName),
  configEmbedded: true,
}));
