const fs = require('node:fs');
const file = 'package.json';
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.version = pkg.version || '1.0.0';
pkg.description = pkg.description || 'PlaneoFUT - planificación de fútbol';
pkg.author = pkg.author || 'PlaneoFUT';
pkg.main = 'portable/main.cjs';
pkg.scripts = {
  ...pkg.scripts,
  'package:win': 'npm run build && node scripts/generate-portable-runtime-config.cjs && electron-builder --win dir --x64 && node scripts/package-portable-folder.cjs',
  'package:win:single': 'npm run build && node scripts/generate-portable-runtime-config.cjs && electron-builder --win portable --x64 && node scripts/package-portable.cjs',
};
pkg.build = {
  appId: 'com.planeofut.app',
  productName: 'PlaneoFUT',
  artifactName: 'PlaneoFUT-Portable-${version}.${ext}',
  directories: { output: 'release' },
  // La config de Supabase se hornea en build (scripts/generate-portable-runtime-config.cjs) dentro
  // de portable/runtime-config.generated.cjs: no se lista aquí ningún portable-config*.json suelto.
  files: ['portable/**/*', 'dist/client/**/*', 'dist/server/**/*', 'package.json', 'build/icon.ico', 'build/icon.png'],
  win: { target: [{ target: 'portable', arch: ['x64'] }] },
  portable: { artifactName: 'PlaneoFUT-Portable-${version}.${ext}' }
};
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
