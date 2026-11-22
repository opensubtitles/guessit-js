/**
 * The `output` parameter on the HTTP surfaces: Python guessit's notation by
 * default, guessit-js codes on request, 400 for anything else. Runs against both
 * the CLI's --serve (needs dist) and server.ts (what production runs).
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(__dirname, '..');
const hasDist = existsSync(join(root, 'dist', 'guessit-js.js'));

// Ports 38471 (serve-limits) and 38472 (batch) belong to other test files, which run in parallel.
const SURFACES = [
  { name: 'cli --serve', port: 38474, cmd: ['node', join(root, 'bin', 'cli.mjs'), '--serve', '38474'], env: {}, needsDist: true },
  { name: 'server.ts', port: 38475, cmd: ['node', '--import', 'tsx', join(root, 'server.ts')], env: { PORT: '38475' }, needsDist: false },
];

for (const surface of SURFACES) {
  describe.skipIf(surface.needsDist && !hasDist)(`${surface.name}: output parameter`, () => {
    const BASE = `http://127.0.0.1:${surface.port}/api/guessit`;
    let server: ChildProcess | undefined;

    beforeAll(async () => {
      server = spawn(surface.cmd[0], surface.cmd.slice(1), {
        cwd: root, stdio: 'ignore', env: { ...process.env, ...surface.env },
      });
      for (let attempt = 0; attempt < 300; attempt++) {
        try { await fetch(`${BASE}?filename=probe.2020.mkv`); return; }
        catch { await new Promise((r) => setTimeout(r, 100)); }
      }
      throw new Error(`${surface.name} did not come up`);
    }, 40_000);
    afterAll(() => { server?.kill(); });

    const get = async (query: string) => {
      const res = await fetch(`${BASE}?${query}`);
      return { status: res.status, body: (await res.json()) as Record<string, any> };
    };
    const post = async (body: unknown) => {
      const res = await fetch(BASE, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      return { status: res.status, body: (await res.json()) as any };
    };

    it('GET defaults to Python notation', async () => {
      const { body } = await get('filename=Movie.2020.German.DL.US.2024.03.15.mkv');
      expect(body.language).toEqual(['German', 'Multiple languages']);
      const pt = await get('filename=Movie.2020.PT-BR.1080p.mkv');
      expect(pt.body.language).toBe('Portuguese');
      const us = await get('filename=The.Office.US.S02E01.mkv');
      expect(us.body.country).toBe('UNITED STATES');
    });

    it('GET ?output=codes returns guessit-js codes', async () => {
      const { body } = await get('filename=Movie.2020.PT-BR.1080p.mkv&output=codes');
      expect(body.language).toEqual({ alpha3: 'por', country: 'BR' });
      const us = await get('filename=The.Office.US.S02E01.mkv&output=codes');
      expect(us.body.country).toBe('US');
    });

    it('GET rejects an unknown output with 400', async () => {
      const { status } = await get('filename=Movie.2020.mkv&output=yaml');
      expect(status).toBe(400);
    });

    it('POST single and batch honour options.output', async () => {
      const single = await post({ filename: 'Amelie.2001.FRENCH.mkv' });
      expect(single.body.language).toBe('French');
      const codes = await post({ filename: 'Amelie.2001.FRENCH.mkv', options: { output: 'codes' } });
      expect(codes.body.language).toEqual({ alpha3: 'fra' });
      const batch = await post({ filenames: ['Amelie.2001.FRENCH.mkv'], options: { output: 'codes' } });
      expect(batch.body[0].result.language).toEqual({ alpha3: 'fra' });
      const bad = await post({ filename: 'Amelie.2001.FRENCH.mkv', options: { output: 'x' } });
      expect(bad.status).toBe(400);
    });

    it.runIf(surface.name === 'server.ts')('serves MCP over HTTP and llms.txt for AI agents', async () => {
      const origin = `http://127.0.0.1:${surface.port}`;
      const rpc = async (body: unknown) => fetch(`${origin}/mcp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
        body: JSON.stringify(body),
      });
      const list = await (await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' })).json() as any;
      expect(list.result.tools.map((t: any) => t.name)).toContain('guessit');
      const called = await (await rpc({
        jsonrpc: '2.0', id: 2, method: 'tools/call',
        params: { name: 'guessit', arguments: { filename: 'Amelie.2001.FRENCH.mkv' } },
      })).json() as any;
      expect(called.result.structuredContent.language).toBe('French');
      expect((await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' })).status).toBe(202);
      expect((await fetch(`${origin}/mcp`)).status).toBe(405);
      const llms = await fetch(`${origin}/llms.txt`);
      expect(llms.headers.get('content-type')).toContain('text/plain');
      expect(await llms.text()).toMatch(/^# guessit-js/);
    });
  });
}
