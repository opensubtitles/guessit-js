// guessit-js MCP core: the Model Context Protocol tools and JSON-RPC handling,
// shared by the stdio server (bin/mcp.mjs, `guessit-js --mcp`), the hosted
// Cloudflare worker and server.ts (HTTP POST /mcp). No Node-only imports, no
// dependencies.

const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_FILENAME_LENGTH = 4096;

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
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
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
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'guessit_properties',
    title: 'List guessit properties',
    description:
      'List every property guessit can return with its possible values (enum values such as '
      + 'source: ["Blu-ray", "Web", ...]; [null] for free-form ones such as title).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
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
export function handleMcpMessage(api, msg) {
  const reply = (id, result) => ({ jsonrpc: '2.0', id, result });
  const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

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
  switch (method) {
    case 'initialize': {
      const requested = params && params.protocolVersion;
      return reply(id, {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'guessit-js', title: 'guessit-js', version: api.version },
        instructions:
          'guessit-js extracts metadata (title, year, season, episode, resolution, codecs, '
          + 'languages, release group, ...) from movie and TV filenames. Use guessit for one '
          + 'name, guessit_batch for many. Output matches Python guessit; pass '
          + 'options.output="codes" for ISO language codes with regions.',
      });
    }
    case 'ping':
      return isNotification ? null : reply(id, {});
    case 'tools/list':
      return reply(id, { tools: toolsFor(api) });
    case 'tools/call': {
      const result = callTool(params && params.name, params && params.arguments);
      return result === null ? fail(id, -32602, `Unknown tool: ${params && params.name}`) : reply(id, result);
    }
    default:
      // Notifications (notifications/initialized, cancelled, ...) take no answer.
      return isNotification ? null : fail(id, -32601, `Method not found: ${method}`);
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

export { TOOLS };
