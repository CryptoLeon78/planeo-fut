// El build móvil (vite.mobile.config.ts) genera un único shell pre-renderizado
// en dist/client/_shell.html (modo "spa" de TanStack Start). Capacitor espera
// un index.html como punto de entrada: lo copiamos aquí en vez de duplicar la
// lógica de build.
const fs = require('node:fs');
const path = require('node:path');

const clientDir = path.resolve(__dirname, '..', 'dist', 'client');
const shell = path.join(clientDir, '_shell.html');
const index = path.join(clientDir, 'index.html');

if (!fs.existsSync(shell)) {
  throw new Error(`No se encontró ${shell}. Ejecuta "vite build --config vite.mobile.config.ts" primero.`);
}
fs.copyFileSync(shell, index);
console.log(JSON.stringify({ from: path.relative(process.cwd(), shell), to: path.relative(process.cwd(), index) }));
