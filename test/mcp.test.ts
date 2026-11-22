/**
 * MCP (Model Context Protocol) server: the JSON-RPC core shared by every
 * surface, and the stdio transport behind `guessit-js --mcp`.
 */
import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { guessit, guessitMany, properties, version } from '../src/index.js';
// @ts-expect-error plain ES module without type declarations
import { handleMcpMessage, handleMcpPayload, handleMcpHttp } from '../bin/mcp-core.mjs';

const api = { guessit, guessitMany, properties, version, maxBatch: 100 };
const call = (method: string, params?: unknown, id: number | undefined = 1) =>
  handleMcpMessage(api, { jsonrpc: '2.0', id, method, params });

describe('MCP core', () => {
  it('initialize negotiates the protocol version and names the server', () => {
    const r = call('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't', version: '1' } });
    expect(r.result.protocolVersion).toBe('2025-03-26');
    expect(r.result.serverInfo).toMatchObject({ name: 'guessit-js', version });
    expect(r.result.capabilities.tools).toBeDefined();
    expect(call('initialize', { protocolVersion: '2025-11-25' }).result.protocolVersion).toBe('2025-11-25');
    // The handshake only ever settles on a legacy revision.
    expect(call('initialize', { protocolVersion: '1999-01-01' }).result.protocolVersion).toBe('2025-11-25');
    expect(call('initialize', { protocolVersion: '2026-07-28' }).result.protocolVersion).toBe('2025-11-25');
  });

  it('lists three read-only tools with input schemas', () => {
    const { tools } = call('tools/list').result;
    expect(tools.map((t: any) => t.name)).toEqual(['guessit', 'guessit_batch', 'guessit_properties']);
    for (const t of tools) {
      expect(t.inputSchema.type).toBe('object');
      expect(t.annotations.readOnlyHint).toBe(true);
    }
    expect(tools[1].inputSchema.properties.filenames.maxItems).toBe(100);
  });

  it('guessit returns the library result as text and structured content', () => {
    const r = call('tools/call', { name: 'guessit', arguments: { filename: 'Amelie.2001.FRENCH.1080p.mkv' } }).result;
    expect(r.structuredContent).toEqual(guessit('Amelie.2001.FRENCH.1080p.mkv'));
    expect(JSON.parse(r.content[0].text)).toEqual(r.structuredContent);
    expect(r.structuredContent.language).toBe('French');
  });

  it('passes options through (output: codes, type)', () => {
    const r = call('tools/call', {
      name: 'guessit', arguments: { filename: 'Movie.2020.PT-BR.mkv', options: { output: 'codes' } },
    }).result;
    expect(r.structuredContent.language).toEqual({ alpha3: 'por', country: 'BR' });
    const e = call('tools/call', { name: 'guessit', arguments: { filename: 'Show.Name.2020.mkv', options: { type: 'episode' } } }).result;
    expect(e.structuredContent.type).toBe('episode');
  });

  it('guessit_batch answers one entry per name, in order', () => {
    const r = call('tools/call', { name: 'guessit_batch', arguments: { filenames: ['A.2020.mkv', 'B.S01E02.mkv'] } }).result;
    expect(r.structuredContent.results.map((e: any) => e.input_string)).toEqual(['A.2020.mkv', 'B.S01E02.mkv']);
    expect(r.structuredContent.results[1].result).toMatchObject({ title: 'B', season: 1, episode: 2 });
  });

  it('guessit_properties lists every property', () => {
    const r = call('tools/call', { name: 'guessit_properties', arguments: {} }).result;
    expect(Object.keys(r.structuredContent)).toContain('screen_size');
  });

  it('reports bad tool input as a tool error, not a protocol error', () => {
    for (const args of [{}, { filename: '' }, { filename: 'x'.repeat(5000) }]) {
      expect(call('tools/call', { name: 'guessit', arguments: args }).result.isError).toBe(true);
    }
    expect(call('tools/call', { name: 'guessit_batch', arguments: { filenames: Array(101).fill('a') } }).result.isError).toBe(true);
    expect(call('tools/call', { name: 'guessit', arguments: { filename: 'a.mkv', options: { output: 'yaml' } } }).result.isError).toBe(true);
  });

  it('answers protocol errors with JSON-RPC error codes', () => {
    expect(call('tools/call', { name: 'nope', arguments: {} }).error.code).toBe(-32602);
    expect(call('resources/list').error.code).toBe(-32601);
    expect(handleMcpPayload(api, 'not json').error.code).toBe(-32700);
    expect(handleMcpMessage(api, { id: 3, method: 'x' }).error.code).toBe(-32600);
  });

  it('notifications get no answer; batches answer only requests', () => {
    expect(handleMcpMessage(api, { jsonrpc: '2.0', method: 'notifications/initialized' })).toBeNull();
    const batch = handleMcpPayload(api, JSON.stringify([
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 9, method: 'ping' },
    ]));
    expect(batch).toEqual([{ jsonrpc: '2.0', id: 9, result: {} }]);
    expect(handleMcpPayload(api, JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }))).toBeNull();
  });
});

// 2026-07-28: no handshake; every request carries its version and capabilities in _meta.
const MODERN = '2026-07-28';
const meta = (extra: Record<string, unknown> = {}) => ({
  'io.modelcontextprotocol/protocolVersion': MODERN,
  'io.modelcontextprotocol/clientCapabilities': {},
  'io.modelcontextprotocol/clientInfo': { name: 't', version: '1' },
  ...extra,
});
const modern = (method: string, params: Record<string, unknown> = {}, id = 1) =>
  handleMcpMessage(api, { jsonrpc: '2.0', id, method, params: { ...params, _meta: meta() } });

describe('MCP core, modern (stateless) revision', () => {
  it('server/discover lists versions, capabilities and identity', () => {
    const r = modern('server/discover').result;
    expect(r.resultType).toBe('complete');
    expect(r.supportedVersions[0]).toBe(MODERN);
    expect(r.supportedVersions).toContain('2025-11-25');
    expect(r.capabilities.tools).toBeDefined();
    expect(r._meta['io.modelcontextprotocol/serverInfo']).toMatchObject({ name: 'guessit-js', version });
    expect(r.ttlMs).toBeGreaterThan(0);
    expect(r.cacheScope).toBe('public');
    expect(r.instructions).toMatch(/guessit_batch/);
  });

  it('serves tools without a handshake, marking results complete', () => {
    const list = modern('tools/list').result;
    expect(list.resultType).toBe('complete');
    expect(list.tools.map((t: any) => t.name)).toEqual(['guessit', 'guessit_batch', 'guessit_properties']);
    expect(list.cacheScope).toBe('public');
    const r = modern('tools/call', { name: 'guessit', arguments: { filename: 'The.Matrix.1999.1080p.mkv' } }).result;
    expect(r.resultType).toBe('complete');
    expect(r.structuredContent).toMatchObject({ title: 'The Matrix', year: 1999 });
    expect(r._meta['io.modelcontextprotocol/serverInfo'].name).toBe('guessit-js');
  });

  it('rejects unknown versions with the supported list, and malformed _meta', () => {
    const e = handleMcpMessage(api, { jsonrpc: '2.0', id: 4, method: 'tools/list', params: { _meta: meta({ 'io.modelcontextprotocol/protocolVersion': '1900-01-01' }) } }).error;
    expect(e.code).toBe(-32022);
    expect(e.data).toMatchObject({ requested: '1900-01-01' });
    expect(e.data.supported).toContain(MODERN);
    expect(handleMcpMessage(api, { jsonrpc: '2.0', id: 5, method: 'server/discover' }).error.code).toBe(-32602);
    const noCaps = handleMcpMessage(api, { jsonrpc: '2.0', id: 6, method: 'tools/list', params: { _meta: { 'io.modelcontextprotocol/protocolVersion': MODERN } } });
    expect(noCaps.error.code).toBe(-32602);
  });

  it('legacy results stay exactly as before (no resultType, no _meta)', () => {
    const r = call('tools/list').result;
    expect(r.resultType).toBeUndefined();
    expect(r._meta).toBeUndefined();
    expect(r.ttlMs).toBeUndefined();
  });

  it('every tool declares an output schema its structured content fits', () => {
    const { tools } = call('tools/list').result;
    for (const t of tools) expect(t.outputSchema.type).toBe('object');
    const batch = call('tools/call', { name: 'guessit_batch', arguments: { filenames: ['A.2020.mkv'] } }).result;
    expect(Array.isArray(batch.structuredContent.results)).toBe(true);
  });
});

describe('MCP over HTTP (handleMcpHttp)', () => {
  const http = (body: unknown, headers: Record<string, string> = {}) => {
    const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    return handleMcpHttp(api, typeof body === 'string' ? body : JSON.stringify(body), (n: string) => lower[n]);
  };
  const call1 = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'guessit', arguments: { filename: 'A.2020.mkv' }, _meta: meta() } };
  const good = { 'MCP-Protocol-Version': MODERN, 'Mcp-Method': 'tools/call', 'Mcp-Name': 'guessit' };

  it('modern request with matching headers: 200', () => {
    const r = http(call1, good);
    expect(r.status).toBe(200);
    expect(r.body.result.structuredContent.title).toBe('A');
  });

  it('decodes a Base64 Mcp-Name', () => {
    expect(http(call1, { ...good, 'Mcp-Name': `=?base64?${btoa('guessit')}?=` }).status).toBe(200);
  });

  it('missing or mismatched mirrored headers: 400 HeaderMismatch', () => {
    for (const h of [
      { ...good, 'MCP-Protocol-Version': '' },
      { ...good, 'MCP-Protocol-Version': '2025-11-25' },
      { ...good, 'Mcp-Method': '' },
      { ...good, 'Mcp-Method': 'tools/list' },
      { ...good, 'Mcp-Name': '' },
      { ...good, 'Mcp-Name': 'guessit_batch' },
    ]) {
      const r = http(call1, Object.fromEntries(Object.entries(h).filter(([, v]) => v)));
      expect(r.status).toBe(400);
      expect(r.body.error.code).toBe(-32020);
    }
  });

  it('unsupported version: 400; unknown method: 404; notification: 202', () => {
    const v = { ...call1, params: { ...call1.params, _meta: meta({ 'io.modelcontextprotocol/protocolVersion': '1900-01-01' }) } };
    const r = http(v, { ...good, 'MCP-Protocol-Version': '1900-01-01' });
    expect([r.status, r.body.error.code]).toEqual([400, -32022]);
    const m = http({ jsonrpc: '2.0', id: 2, method: 'nope/nope', params: { _meta: meta() } }, { 'MCP-Protocol-Version': MODERN, 'Mcp-Method': 'nope/nope' });
    expect([m.status, m.body.error.code]).toEqual([404, -32601]);
    expect(http({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { _meta: meta() } }, { 'MCP-Protocol-Version': MODERN, 'Mcp-Method': 'notifications/cancelled' }).status).toBe(202);
  });

  it('legacy clients keep working unchanged', () => {
    const init = http({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
    expect(init.status).toBe(200);
    expect(init.body.result.protocolVersion).toBe('2025-06-18');
    expect(http({ jsonrpc: '2.0', method: 'notifications/initialized' }).status).toBe(202);
    const t = http({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'guessit', arguments: { filename: 'A.2020.mkv' } } }, { 'MCP-Protocol-Version': '2025-06-18' });
    expect(t.status).toBe(200);
    expect(t.body.result.structuredContent.title).toBe('A');
    expect(http({ jsonrpc: '2.0', id: 3, method: 'tools/list' }, { 'MCP-Protocol-Version': '1999-01-01' }).status).toBe(400);
    expect(http('not json').status).toBe(400);
  });
});

const hasDist = existsSync(join(resolve(__dirname, '..'), 'dist', 'guessit-js.js'));

describe.skipIf(!hasDist)('guessit-js --mcp (stdio)', () => {
  it('speaks newline-delimited JSON-RPC and exits when stdin closes', async () => {
    const child = spawn('node', [join(resolve(__dirname, '..'), 'bin', 'cli.mjs'), '--mcp'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    const lines = [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'guessit', arguments: { filename: 'The.Matrix.1999.1080p.BluRay.x264-GRP.mkv' } } },
    ];
    child.stdin.end(lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
    const code = await new Promise((r) => child.on('close', r));
    expect(code).toBe(0);
    const msgs = out.trim().split('\n').map((l) => JSON.parse(l));
    expect(msgs.map((m) => m.id)).toEqual([1, 2]); // nothing else on stdout
    expect(msgs[1].result.structuredContent).toMatchObject({ title: 'The Matrix', year: 1999 });
  }, 30_000);

  it('answers the modern server/discover probe on stdio', async () => {
    const child = spawn('node', [join(resolve(__dirname, '..'), 'bin', 'cli.mjs'), '--mcp'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stdin.end(JSON.stringify({ jsonrpc: '2.0', id: 'd', method: 'server/discover', params: { _meta: meta() } }) + '\n');
    await new Promise((r) => child.on('close', r));
    const msg = JSON.parse(out.trim());
    expect(msg.result.supportedVersions[0]).toBe(MODERN);
  }, 30_000);
});
