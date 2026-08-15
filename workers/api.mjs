/**
 * guessit-js API as a Cloudflare Worker — zero-maintenance hosted API.
 * Deploy: npx wrangler deploy   (or the deploy-api GitHub workflow on release)
 *
 * Routes (same contract as `guessit-js --serve` and server.ts):
 *   GET  /api/guessit?filename=Movie.2020.1080p.mkv[&type=movie|episode]
 *   POST /api/guessit   {"filename": "..."} or {"filenames": [...], "options": {...}}
 *   GET  /api/health
 */
// Workers runtime has no `process` global, and the bundle reads process.env
// debug flags at call time. A side-effect shim import gets tree-shaken (the
// package sets sideEffects: false), so define it before a dynamic import.
if (typeof globalThis.process === 'undefined') {
  globalThis.process = { env: {} };
}
const { guessit, version } = await import('../dist/guessit-js.js');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...extra },
  });
}

const USAGE = {
  service: 'guessit-js API',
  notice: 'DEMO for testing/evaluation only — never use in production. Free tier, daily request cap, no SLA. Self-host: npx guessit-js --serve',
  docs: 'https://opensubtitles.github.io/guessit-js/docs/',
  get: '/api/guessit?filename=Movie.2020.1080p.mkv&type=movie|episode (type optional)',
  post: '/api/guessit with {"filename": "..."} or {"filenames": [...], "options": {...}}',
  health: '/api/health',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/api/health') return json({ status: 'ok', version });
    if (url.pathname === '/' || url.pathname === '') return json({ ...USAGE, version });
    if (url.pathname !== '/api/guessit') return json({ error: 'Not found', ...USAGE }, 404);

    if (request.method === 'GET') {
      const filename = url.searchParams.get('filename');
      if (!filename) return json({ error: 'Missing required parameter: filename', ...USAGE }, 400);
      const options = {};
      const type = url.searchParams.get('type');
      if (type === 'movie' || type === 'episode') options.type = type;
      try {
        // Cloudflare does NOT auto-cache Worker responses — a Cache-Control
        // header alone only instructs browsers. Real edge caching needs the
        // Cache API. Identical input → identical output, so cache hard.
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), { method: 'GET' });
        const hit = await cache.match(cacheKey);
        if (hit) {
          const res = new Response(hit.body, hit);
          res.headers.set('X-Cache', 'HIT');
          return res;
        }
        const res = json(guessit(filename, options), 200, {
          'Cache-Control': 'public, max-age=86400',
          'X-Cache': 'MISS',
        });
        await cache.put(cacheKey, res.clone());
        return res;
      } catch (e) {
        return json({ error: String((e && e.message) || e) }, 500);
      }
    }

    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Invalid JSON body' }, 400); }
      const options = body && typeof body.options === 'object' && body.options ? body.options : {};
      try {
        if (Array.isArray(body.filenames)) {
          if (body.filenames.length > 500) return json({ error: 'Max 500 filenames per request' }, 400);
          return json(body.filenames.map((f) => guessit(String(f), options)));
        }
        if (typeof body.filename === 'string') return json(guessit(body.filename, options));
        return json({ error: 'Body must contain "filename" (string) or "filenames" (array)' }, 400);
      } catch (e) {
        return json({ error: String((e && e.message) || e) }, 500);
      }
    }

    return json({ error: 'Method not allowed' }, 405);
  },
};
