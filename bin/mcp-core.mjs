// guessit-js MCP core: the Model Context Protocol tools and JSON-RPC handling,
// shared by the stdio server (bin/mcp.mjs, `guessit-js --mcp`), the hosted
// Cloudflare worker and server.ts (HTTP POST /mcp). No Node-only imports, no
// dependencies.

// Dual-era: "modern" revisions (2026-07-28+) are stateless and carry the
// protocol version in every request's _meta; "legacy" revisions open with an
// initialize handshake. The server itself keeps no state either way.
const MODERN_PROTOCOLS = ['2026-07-28'];
const LEGACY_PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const SUPPORTED_PROTOCOLS = [...MODERN_PROTOCOLS, ...LEGACY_PROTOCOLS];
const MAX_FILENAME_LENGTH = 4096;

const META = 'io.modelcontextprotocol/';
// The tool list only changes with a new release; clients and shared caches may keep it.
const CACHEABLE = { ttlMs: 3_600_000, cacheScope: 'public' };

const INSTRUCTIONS =
  'guessit-js extracts metadata (title, year, season, episode, resolution, codecs, '
  + 'languages, release group, ...) from movie and TV filenames. Use guessit for one '
  + 'name, guessit_batch for many. Output matches Python guessit; pass '
  + 'options.output="codes" for ISO language codes with regions.';

const serverInfo = (api) => ({
  name: 'guessit-js',
  title: 'guessit-js',
  version: api.version,
  description: 'Parse movie and TV filenames: title, year, season, episode, codecs, languages, release group.',
  websiteUrl: 'https://opensubtitles.github.io/guessit-js/',
});

// Error codes (2026-07-28 reserves -32020..-32099 for the MCP specification).
const HEADER_MISMATCH = -32020;
const UNSUPPORTED_PROTOCOL_VERSION = -32022;

const OPTIONS_SCHEMA = {
  type: 'object',
  description:
    'Optional guessit options, as in the library and Python guessit: type ("movie" | "episode"), '
    + 'output ("python" default: language/country as names like "French"; "codes": {"alpha3": "fra"} '
    + 'objects that keep regions such as pt-BR), expected_title, allowed_languages, allowed_countries, '
    + 'name_only, date_day_first, date_year_first, excludes, includes.',
  additionalProperties: true,
};

const TOOLS = [
  {
    name: 'guessit',
    title: 'Parse a media filename',
    description:
      'Extract metadata from one movie or TV episode filename or release name: title, year, '
      + 'season, episode, episode_title, screen_size, source, video_codec, audio_codec, language, '
      + 'subtitle_language, release_group, streaming_service, container, type (movie or episode) and '
      + 'more (56 properties). Output matches Python guessit\'s JSON. Pass just the file name or a '
      + 'full path; directory names help (e.g. "Show/Season 2/episode.mkv").',
    inputSchema: {
      type: 'object',
      properties: {
        filename: { type: 'string', description: 'Filename, path or release name, e.g. "The.Matrix.1999.1080p.BluRay.x264-GRP.mkv"' },
        options: OPTIONS_SCHEMA,
      },
      required: ['filename'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      description: 'Python guessit JSON: only the properties found; several values become an array. '
        + 'guessit_properties lists every property. Full schema: '
        + 'https://github.com/opensubtitles/guessit-js/blob/main/docs/output-schema.json',
      properties: {
        type: { type: 'string', enum: ['movie', 'episode'] },
        title: {},
        year: {},
        season: {},
        episode: {},
      },
      additionalProperties: true,
    },
    annotations: { title: 'Parse a media filename', readOnlyHint: true, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'guessit_batch',
    title: 'Parse many media filenames',
    description:
      'Parse many filenames in one call with the same options. Returns one entry per '
      + 'name, in order: {input_string, result} or {input_string, error}. Faster than calling '
      + 'guessit repeatedly.',
    inputSchema: {
      type: 'object',
      properties: {
        filenames: { type: 'array', items: { type: 'string' }, minItems: 1 },
        options: OPTIONS_SCHEMA,
      },
      required: ['filenames'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          description: 'One entry per input name, in order',
          items: {
            type: 'object',
            properties: {
              input_string: { type: 'string' },
              result: { type: 'object', additionalProperties: true },
              error: { type: 'string' },
            },
            required: ['input_string'],
          },
        },
      },
      required: ['results'],
    },
    annotations: { title: 'Parse many media filenames', readOnlyHint: true, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'guessit_properties',
    title: 'List guessit properties',
    description:
      'List every property guessit can return with its possible values (enum values such as '
      + 'source: ["Blu-ray", "Web", ...]; [null] for free-form ones such as title).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: {
      type: 'object',
      description: 'Property name -> possible values',
      additionalProperties: { type: 'array' },
    },
    annotations: { title: 'List guessit properties', readOnlyHint: true, openWorldHint: false, idempotentHint: true },
  },
];

/** The tool list, with the batch limit of the surface serving it. */
function toolsFor(api) {
  return TOOLS.map((t) => (t.name !== 'guessit_batch' ? t : {
    ...t,
    description: t.description.replace('many filenames', `up to ${api.maxBatch} filenames`),
    inputSchema: {
      ...t.inputSchema,
      properties: {
        ...t.inputSchema.properties,
        filenames: { ...t.inputSchema.properties.filenames, maxItems: api.maxBatch },
      },
    },
  }));
}

function toolResult(value) {
  // structuredContent must be an object; batch results are wrapped.
  const structured = Array.isArray(value) ? { results: value } : value;
  return {
    content: [{ type: 'text', text: JSON.stringify(value) }],
    structuredContent: structured,
  };
}

function toolError(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function validOptions(options) {
  if (options === undefined) return {};
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('options must be an object');
  }
  return options;
}

/**
 * Answer one JSON-RPC message. Returns the response object, or null when the
 * message is a notification (or anything else that takes no answer).
 * @param {{ guessit: Function, guessitMany: Function, properties: Function, version: string }} api
 */
/** The protocol version a request's _meta declares (modern revisions), if any. */
function requestedVersion(msg) {
  const meta = msg && msg.params && msg.params._meta;
  return meta && typeof meta === 'object' ? meta[`${META}protocolVersion`] : undefined;
}

/** Modern requests declare their version per request; server/discover exists only there. */
export function isModernRequest(msg) {
  return !!msg && typeof msg === 'object'
    && (requestedVersion(msg) !== undefined || msg.method === 'server/discover');
}

/**
 * Answer one JSON-RPC message. Returns the response object, or null when the
 * message is a notification (or anything else that takes no answer).
 * @param {{ guessit: Function, guessitMany: Function, properties: Function, version: string, maxBatch: number }} api
 */
export function handleMcpMessage(api, msg) {
  const fail = (id, code, message, data) => ({ jsonrpc: '2.0', id, error: data === undefined ? { code, message } : { code, message, data } });

  function callTool(name, args) {
    args = args ?? {};
    try {
      if (name === 'guessit') {
        if (typeof args.filename !== 'string' || !args.filename) return toolError('filename (string) is required');
        if (args.filename.length > MAX_FILENAME_LENGTH) return toolError(`filename exceeds ${MAX_FILENAME_LENGTH} characters`);
        return toolResult(api.guessit(args.filename, validOptions(args.options)));
      }
      if (name === 'guessit_batch') {
        const names = args.filenames;
        if (!Array.isArray(names) || names.length === 0) return toolError('filenames (non-empty array of strings) is required');
        if (names.length > api.maxBatch) return toolError(`at most ${api.maxBatch} filenames per call`);
        const strings = names.map(String);
        if (strings.some((f) => f.length > MAX_FILENAME_LENGTH)) return toolError(`filename exceeds ${MAX_FILENAME_LENGTH} characters`);
        return toolResult(api.guessitMany(strings, validOptions(args.options)));
      }
      if (name === 'guessit_properties') return toolResult(api.properties());
    } catch (e) {
      return toolError(String((e && e.message) || e));
    }
    return null;
  }

  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return msg && typeof msg === 'object' && msg.id !== undefined ? fail(msg.id, -32600, 'Invalid Request') : null;
  }
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;
  if (isNotification) return null; // notifications/initialized, cancelled, ... take no answer

  // Modern (stateless) requests: validate the per-request _meta first.
  const modern = isModernRequest(msg);
  const requested = requestedVersion(msg);
  let modernShape = false;
  if (modern) {
    if (typeof requested !== 'string') {
      return fail(id, -32602, `Invalid params: _meta["${META}protocolVersion"] is required`);
    }
    if (!SUPPORTED_PROTOCOLS.includes(requested)) {
      return fail(id, UNSUPPORTED_PROTOCOL_VERSION, 'Unsupported protocol version', { supported: SUPPORTED_PROTOCOLS, requested });
    }
    modernShape = MODERN_PROTOCOLS.includes(requested);
    const caps = params._meta[`${META}clientCapabilities`];
    if (modernShape && (!caps || typeof caps !== 'object' || Array.isArray(caps))) {
      return fail(id, -32602, `Invalid params: _meta["${META}clientCapabilities"] is required`);
    }
  }
  // Modern results say they are complete and name the server (there is no handshake).
  const reply = (result) => ({
    jsonrpc: '2.0',
    id,
    result: modernShape
      ? { resultType: 'complete', ...result, _meta: { [`${META}serverInfo`]: serverInfo(api) } }
      : result,
  });

  switch (method) {
    case 'server/discover':
      return reply({
        supportedVersions: SUPPORTED_PROTOCOLS,
        capabilities: { tools: {} },
        instructions: INSTRUCTIONS,
        ...CACHEABLE,
      });
    case 'initialize': {
      // The legacy handshake negotiates a legacy revision only.
      const asked = params && params.protocolVersion;
      return reply({
        protocolVersion: LEGACY_PROTOCOLS.includes(asked) ? asked : LEGACY_PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: serverInfo(api),
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply(modernShape ? { tools: toolsFor(api), ...CACHEABLE } : { tools: toolsFor(api) });
    case 'tools/call': {
      const result = callTool(params && params.name, params && params.arguments);
      return result === null ? fail(id, -32602, `Unknown tool: ${params && params.name}`) : reply(result);
    }
    default:
      return fail(id, -32601, `Method not found: ${method}`);
  }
}

/** Parse one transport payload (a message or a JSON-RPC batch) and answer it. */
export function handleMcpPayload(api, text) {
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    return { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } };
  }
  if (Array.isArray(msg)) {
    const out = msg.map((m) => handleMcpMessage(api, m)).filter(Boolean);
    return out.length ? out : null;
  }
  return handleMcpMessage(api, msg);
}

/** Decode an Mcp-Name / Mcp-Param-* header value ("=?base64?...?=" sentinel or plain ASCII). */
function decodeHeaderValue(v) {
  const m = /^=\?base64\?([A-Za-z0-9+/=]*)\?=$/.exec(v);
  if (!m) return v;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

/**
 * Streamable HTTP POST /mcp, shared by server.ts and the Cloudflare worker.
 * Stateless: every request is answered with plain JSON, notifications with 202.
 * @param {string} text the request body
 * @param {(name: string) => string | null | undefined} header case-insensitive header lookup
 * @returns {{ status: number, body: unknown }} body null means "no body"
 */
export function handleMcpHttp(api, text, header) {
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    return { status: 400, body: { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } } };
  }
  const mismatch = (message) => ({
    status: 400,
    body: { jsonrpc: '2.0', id: msg && typeof msg === 'object' && 'id' in msg ? msg.id : null, error: { code: HEADER_MISMATCH, message } },
  });

  // Modern request: the mirrored headers must be present and match the body.
  if (!Array.isArray(msg) && isModernRequest(msg)) {
    const version = requestedVersion(msg);
    const hv = header('mcp-protocol-version');
    if (!hv) return mismatch('Header mismatch: MCP-Protocol-Version header is required');
    if (typeof version === 'string' && hv !== version) {
      return mismatch(`Header mismatch: MCP-Protocol-Version header value '${hv}' does not match body value '${version}'`);
    }
    const hm = header('mcp-method');
    if (!hm) return mismatch('Header mismatch: Mcp-Method header is required');
    if (hm !== msg.method) return mismatch(`Header mismatch: Mcp-Method header value '${hm}' does not match body value '${msg.method}'`);
    if (msg.method === 'tools/call') {
      const raw = header('mcp-name');
      if (!raw) return mismatch('Header mismatch: Mcp-Name header is required for tools/call');
      const name = decodeHeaderValue(raw);
      if (name === null) return mismatch('Header mismatch: Mcp-Name header is not valid Base64 UTF-8');
      if (name !== (msg.params && msg.params.name)) return mismatch('Header mismatch: Mcp-Name header does not match params.name');
    }
    const answer = handleMcpMessage(api, msg);
    if (!answer) return { status: 202, body: null };
    if (!answer.error) return { status: 200, body: answer };
    const { code } = answer.error;
    return { status: code === -32601 ? 404 : code === -32603 ? 500 : 400, body: answer };
  }

  // Legacy (initialize handshake) revisions: as before, JSON-RPC errors ride on 200,
  // except an MCP-Protocol-Version header this server cannot speak.
  const hv = header('mcp-protocol-version');
  if (hv && !SUPPORTED_PROTOCOLS.includes(hv)) {
    return {
      status: 400,
      body: {
        jsonrpc: '2.0',
        id: msg && typeof msg === 'object' && 'id' in msg ? msg.id : null,
        error: { code: UNSUPPORTED_PROTOCOL_VERSION, message: 'Unsupported protocol version', data: { supported: SUPPORTED_PROTOCOLS, requested: hv } },
      },
    };
  }
  const answer = Array.isArray(msg)
    ? (() => { const out = msg.map((m) => handleMcpMessage(api, m)).filter(Boolean); return out.length ? out : null; })()
    : handleMcpMessage(api, msg);
  return answer ? { status: 200, body: answer } : { status: 202, body: null };
}

export { TOOLS, SUPPORTED_PROTOCOLS, MODERN_PROTOCOLS, LEGACY_PROTOCOLS };
