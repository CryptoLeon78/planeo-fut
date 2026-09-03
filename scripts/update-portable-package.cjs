const fs = require('node:fs');
const file = 'package.json';
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.version = pkg.version || '1.0.0';
pkg.description = pkg.description || 'PlaneoFUT - planificación de fútbol';
pkg.author = pkg.author || 'PlaneoFUT';
pkg.main = 'portable/main.cjs';
pkg.scripts = { ...pkg.scripts, 'package:win': 'npm run build && electron-builder --win portable --x64' };
pkg.build = {
  appId: 'com.planeofut.app',
  productName: 'PlaneoFUT',
  artifactName: 'PlaneoFUT-Portable-${version}.${ext}',
  directories: { output: 'release' },
  files: ['portable/**/*', 'dist/**/*', 'package.json', 'portable-config.example.json'],
  extraResources: [{ from: 'portable-config.example.json', to: 'portable-config.example.json' }],
  win: { target: [{ target: 'portable', arch: ['x64'] }] },
  portable: { artifactName: 'PlaneoFUT-Portable-${version}.${ext}' }
};
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
