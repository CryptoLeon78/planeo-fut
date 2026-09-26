// Genera portable/runtime-config.generated.cjs a partir del portable-config.json real del
// administrador, ANTES de empaquetar con electron-builder. El resultado queda embebido dentro
// del app.asar del ejecutable: los compañeros entrenadores nunca reciben un archivo de config
// suelto ni editable junto al .exe. Ver PORTABLE-WINDOWS.md.
const fs = require('node:fs');
const path = require('node:path');
const { resolveConfig } = require('./lib/portable-config.cjs');

const root = path.resolve(__dirname, '..');
const { path: source, config } = resolveConfig(root);

const resolved = {
  supabaseUrl: config.supabaseUrl,
  supabasePublishableKey: config.supabasePublishableKey,
  openaiApiKey: config.openaiApiKey || '',
  googleOAuthEnabled: config.googleOAuthEnabled === true,
  emailConfirmationRequired: config.emailConfirmationRequired === true,
  supportEmail: config.supportEmail || '',
};

const outFile = path.join(root, 'portable', 'runtime-config.generated.cjs');
fs.writeFileSync(
  outFile,
  `// Generado en build a partir de ${path.relative(root, source).replace(/\\/g, '/')}.\n`
  + `// NO se distribuye como archivo suelto: queda empaquetado dentro del app.asar.\n`
  + `// NO comitear (ver .gitignore): contiene las credenciales reales de este despliegue.\n`
  + `module.exports = ${JSON.stringify(resolved, null, 2)};\n`,
);

console.log(JSON.stringify({ generated: path.relative(root, outFile), configSource: path.relative(root, source) }));
