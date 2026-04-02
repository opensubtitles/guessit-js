/**
 * guessit-js HTTP server
 * Serves the homepage and provides a REST API for filename parsing.
 *
 * Usage:
 *   npx tsx server.ts
 *   PORT=8080 npx tsx server.ts
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guessit } from './src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env['PORT'] || '3847', 10);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.gz': 'application/gzip',
};

function setCors(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: http.ServerResponse, status: number, data: unknown): void {
  setCors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const MAX_BODY = 1024 * 64; // 64 KB limit
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        req.destroy();
        reject(new Error('Body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function handleGuessitGet(url: URL, res: http.ServerResponse): void {
  const filename = url.searchParams.get('filename');
  if (!filename) {
    sendJson(res, 400, { error: 'Missing required parameter: filename' });
    return;
  }

  const options: Record<string, unknown> = {};
  const type = url.searchParams.get('type');
  if (type === 'movie' || type === 'episode') {
    options.type = type;
  }

  try {
    const result = guessit(filename, options);
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 500, { error: 'Failed to parse filename', detail: String(err) });
  }
}

async function handleGuessitPost(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    const body = await readBody(req);
    let parsed: { filename?: string; options?: Record<string, unknown> };
    try {
      parsed = JSON.parse(body);
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    if (!parsed.filename || typeof parsed.filename !== 'string') {
      sendJson(res, 400, { error: 'Missing required field: filename' });
      return;
    }

    const result = guessit(parsed.filename, parsed.options ?? {});
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 500, { error: 'Failed to parse filename', detail: String(err) });
  }
}

function serveStatic(filePath: string, res: http.ServerResponse): void {
  const ext = path.extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const method = req.method?.toUpperCase() || 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // API routes
  if (url.pathname === '/api/guessit') {
    if (method === 'GET') {
      handleGuessitGet(url, res);
      return;
    }
    if (method === 'POST') {
      await handleGuessitPost(req, res);
      return;
    }
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  // OpenAPI spec
  if (url.pathname === '/openapi.json') {
    serveStatic(path.join(__dirname, 'public', 'openapi.json'), res);
    return;
  }

  // Swagger UI docs
  if (url.pathname === '/docs' || url.pathname === '/docs/') {
    setCors(res);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>guessit-js API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background: #1a1a2e; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { max-width: 1100px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`);
    return;
  }

  // Health check
  if (url.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok', version: '3.8.1' });
    return;
  }

  // Static file serving
  let filePath: string;
  if (url.pathname === '/' || url.pathname === '/index.html') {
    filePath = path.join(__dirname, 'public', 'index.html');
  } else if (url.pathname.startsWith('/wasm/')) {
    // Serve WASM files from the wasm/ directory
    const safePath = path.normalize(url.pathname.slice(1)).replace(/^(\.\.(\/|\\|$))+/, '');
    filePath = path.join(__dirname, safePath);
  } else {
    // Prevent directory traversal
    const safePath = path.normalize(url.pathname).replace(/^(\.\.(\/|\\|$))+/, '');
    filePath = path.join(__dirname, 'public', safePath);
  }

  serveStatic(filePath, res);
});

server.listen(PORT, () => {
  console.log(`guessit-js server running at http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/guessit?filename=...`);
});
