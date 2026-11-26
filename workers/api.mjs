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
const { guessit, guessitMany, properties, version, OUTPUT_FORMATS } = await import('../dist/guessit-js.js');
// Agent-facing documents and the MCP protocol core. wrangler bundles .txt as
// text and .json as data, so the worker serves the same files as the repo.
const { handleMcpHttp } = await import('../bin/mcp-core.mjs');
const { default: LLMS_TXT } = await import('../public/llms.txt');
const { default: OPENAPI } = await import('../public/openapi.json');

// Parsing cost grows with the square of the number of matches a name yields, so
// a long synthetic string costs far more than its length suggests: 400
// repetitions of "S01E01" take seconds where a real name takes under 3 ms. The
// whole fixture corpus tops out at 196 characters, so these bounds only ever
// reject something that was never a filename.
const MAX_FILENAME_LENGTH = 1024;
// 100 names is the documented batch contract across every HTTP surface, and on
// the free Workers tier it also keeps one request inside the CPU budget.
const MAX_BATCH = 100;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id',
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
  get: '/api/guessit?filename=Movie.2020.1080p.mkv&type=movie|episode&output=python|codes (type and output optional)',
  output: 'python (default): Python guessit notation, e.g. "language": "French"; codes: guessit-js values, e.g. "language": {"alpha3": "fra"}',
  post: '/api/guessit with {"filename": "..."} or {"filenames": [...], "options": {...}}',
  health: '/api/health',
  mcp: 'POST /mcp: Model Context Protocol (Streamable HTTP) for AI agents; tools guessit, guessit_batch, guessit_properties',
  llms: '/llms.txt',
  openapi: '/openapi.json',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/api/health') return json({ status: 'ok', version });
    if (url.pathname === '/' || url.pathname === '') return json({ ...USAGE, version });
    if (url.pathname === '/llms.txt') {
      return new Response(LLMS_TXT, { headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
    }
    if (url.pathname === '/openapi.json') return json(OPENAPI, 200, { 'Cache-Control': 'public, max-age=3600' });
    if (url.pathname === '/mcp') {
      // Stateless Streamable HTTP: every POST is answered with plain JSON; there
      // is no server-initiated stream, so GET is not offered.
      if (request.method !== 'POST') return json({ error: 'Use POST for MCP JSON-RPC messages' }, 405, { Allow: 'POST, OPTIONS' });
      const text = await request.text();
      if (text.length > 1 << 20) return json({ error: 'Request body too large' }, 413);
      const { status, body } = handleMcpHttp(
        { guessit, guessitMany, properties, version, maxBatch: MAX_BATCH }, text, (name) => request.headers.get(name),
      );
      return body ? json(body, status) : new Response(null, { status, headers: CORS });
    }
    if (url.pathname !== '/api/guessit') return json({ error: 'Not found', ...USAGE }, 404);

    if (request.method === 'GET') {
      const filename = url.searchParams.get('filename');
      if (!filename) return json({ error: 'Missing required parameter: filename', ...USAGE }, 400);
      if (filename.length > MAX_FILENAME_LENGTH) {
        return json({ error: `filename exceeds ${MAX_FILENAME_LENGTH} characters` }, 413);
      }
      const options = {};
      const type = url.searchParams.get('type');
      if (type === 'movie' || type === 'episode') options.type = type;
      const output = url.searchParams.get('output');
      if (output !== null && !OUTPUT_FORMATS.includes(output)) {
        return json({ error: `Invalid output "${output}": must be "python" or "codes"` }, 400);
      }
      if (output) options.output = output;
      // Off by default; ?year_season=1 copies the year into a missing season, like Python.
      if (/^(?:1|true|yes|on)$/i.test(url.searchParams.get('year_season') ?? '')) options.year_season = true;
      try {
        // Cloudflare does NOT auto-cache Worker responses — a Cache-Control
        // header alone only instructs browsers. Real edge caching needs the
        // Cache API. Identical input → identical output, so cache hard.
        const cache = caches.default;
        // The version is part of the key, so a release never serves answers cached
        // by the previous one.
        const keyUrl = new URL(url.toString());
        keyUrl.searchParams.set('__v', version);
        const cacheKey = new Request(keyUrl.toString(), { method: 'GET' });
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
      if (options.output !== undefined && !OUTPUT_FORMATS.includes(options.output)) {
        return json({ error: `Invalid output "${options.output}": must be "python" or "codes"` }, 400);
      }
      try {
        if (Array.isArray(body.filenames)) {
          // One entry per name, each {input_string, result} or {input_string, error},
          // answered in request order — the same contract as server.ts and --serve.
          // guessitMany parses the options once for the batch and isolates a failing
          // name instead of taking the request down with it. Over-limit is 413, as
          // the single-filename path and the other two surfaces already answered.
          if (body.filenames.length > MAX_BATCH) {
            return json({ error: `Max ${MAX_BATCH} filenames per request` }, 413);
          }
          const names = body.filenames.map(String);
          if (names.some((f) => f.length > MAX_FILENAME_LENGTH)) {
            return json({ error: `filename exceeds ${MAX_FILENAME_LENGTH} characters` }, 413);
          }
          return json(guessitMany(names, options));
        }
        if (typeof body.filename === 'string') {
          if (body.filename.length > MAX_FILENAME_LENGTH) {
            return json({ error: `filename exceeds ${MAX_FILENAME_LENGTH} characters` }, 413);
          }
          return json(guessit(body.filename, options));
        }
        return json({ error: 'Body must contain "filename" (string) or "filenames" (array)' }, 400);
      } catch (e) {
        return json({ error: String((e && e.message) || e) }, 500);
      }
    }

    return json({ error: 'Method not allowed' }, 405);
  },
};
