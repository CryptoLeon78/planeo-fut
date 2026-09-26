// Copia el build "dir" de electron-builder a dist/PlaneoFUT-Portable-<version>.
// La configuración de Supabase ya va horneada dentro del .exe (ver
// scripts/generate-portable-runtime-config.cjs): esta carpeta no lleva ningún
// portable-config.json suelto, así que los compañeros entrenadores solo ven el
// ejecutable y no tienen forma de ver ni tocar las credenciales.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const source = path.join(root, 'release', 'win-unpacked');
const destination = path.join(root, 'dist', `PlaneoFUT-Portable-${pkg.version}`);

if (!fs.existsSync(path.join(source, 'PlaneoFUT.exe'))) {
  throw new Error(`Unpacked app not found: ${source}. Run electron-builder --win dir --x64 first.`);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(source, destination, { recursive: true });
fs.copyFileSync(path.join(root, 'PORTABLE-WINDOWS.md'), path.join(destination, 'PORTABLE-WINDOWS.md'));

console.log(JSON.stringify({
  portableFolder: path.relative(root, destination),
  executable: path.relative(root, path.join(destination, 'PlaneoFUT.exe')),
  configEmbedded: true,
}));
