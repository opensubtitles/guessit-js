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
import { handleMcpMessage, handleMcpPayload } from '../bin/mcp-core.mjs';

const api = { guessit, guessitMany, properties, version, maxBatch: 100 };
const call = (method: string, params?: unknown, id: number | undefined = 1) =>
  handleMcpMessage(api, { jsonrpc: '2.0', id, method, params });

describe('MCP core', () => {
  it('initialize negotiates the protocol version and names the server', () => {
    const r = call('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't', version: '1' } });
    expect(r.result.protocolVersion).toBe('2025-03-26');
    expect(r.result.serverInfo).toMatchObject({ name: 'guessit-js', version });
    expect(r.result.capabilities.tools).toBeDefined();
    expect(call('initialize', { protocolVersion: '1999-01-01' }).result.protocolVersion).toBe('2025-06-18');
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
});
