const fs = require('node:fs');
const path = require('node:path');

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

function isUsableConfig(config) {
  if (!config || typeof config !== 'object') return false;
  const url = String(config.supabaseUrl || '');
  const key = String(config.supabasePublishableKey || '');
  return /^https:\/\/[^/]+\.supabase\.co\/?$/i.test(url)
    && key.length > 20
    && !/TU_(PROYECTO|CLAVE)|your-(project|publishable)/i.test(`${url} ${key}`);
}

/** Busca un portable-config.json usable (raíz del proyecto, luego dist/) y lo devuelve junto a su ruta. */
function resolveConfig(root) {
  const candidates = [
    path.join(root, 'portable-config.json'),
    path.join(root, 'dist', 'portable-config.json'),
  ];
  for (const candidate of candidates) {
    const config = readJson(candidate);
    if (isUsableConfig(config)) return { path: candidate, config };
  }
  throw new Error(
    'No usable portable-config.json found. Create it at the project root (copy portable-config.example.json) before packaging.',
  );
}

module.exports = { readJson, isUsableConfig, resolveConfig };
