const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const CLIENT = path.join(ROOT, 'dist', 'client');
const SERVER = path.join(ROOT, 'dist', 'server', 'index.js');
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = path.resolve(CLIENT, '.' + decoded);
  return candidate.startsWith(CLIENT + path.sep) ? candidate : null;
}

async function start(config) {
  process.env.SUPABASE_URL = config.supabaseUrl || process.env.SUPABASE_URL || '';
  process.env.SUPABASE_PUBLISHABLE_KEY = config.supabasePublishableKey || process.env.SUPABASE_PUBLISHABLE_KEY || '';
  if (config.openaiApiKey) process.env.OPENAI_API_KEY = config.openaiApiKey;
  const worker = (await import(pathToFileURL(SERVER).href)).default;

  const server = http.createServer(async (req, res) => {
    try {
      const file = safePath(req.url || '/');
      if (file && req.method === 'GET' && fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        fs.createReadStream(file).pipe(res);
        return;
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const request = new Request(`http://127.0.0.1:${server.address().port}${req.url || '/'}`, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : Buffer.concat(chunks) });
      const response = await worker.fetch(request);
      const headers = Object.fromEntries(response.headers.entries());
      let body = Buffer.from(await response.arrayBuffer());
      if ((headers['content-type'] || '').includes('text/html')) {
        const runtime = `<script>globalThis.__PLANEOfut_CONFIG__=${JSON.stringify({ supabaseUrl: config.supabaseUrl || '', supabasePublishableKey: config.supabasePublishableKey || '' })}</script>`;
        body = Buffer.from(body.toString('utf8').replace('</head>', `${runtime}</head>`));
        headers['content-length'] = String(body.length);
      }
      res.writeHead(response.status, headers);
      res.end(body);
    } catch (error) {
      console.error(error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('PlaneoFUT no pudo iniciar el servidor local. Revisa portable-config.json.');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, port: server.address().port };
}
module.exports = { start };
