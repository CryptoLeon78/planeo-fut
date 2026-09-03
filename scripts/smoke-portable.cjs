const http = require('node:http');
const { start } = require('../portable/server.cjs');
(async () => {
  const { server, port } = await start({ supabaseUrl: '', supabasePublishableKey: '' });
  http.get(`http://127.0.0.1:${port}/`, response => {
    let data = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {
      const ok = response.statusCode >= 200 && response.statusCode < 500 && data.includes('<html');
      console.log(JSON.stringify({ status: response.statusCode, html: data.includes('<html'), bytes: data.length, ok }));
      server.close(() => process.exit(ok ? 0 : 1));
    });
  }).on('error', error => { console.error(error); server.close(() => process.exit(1)); });
})();
