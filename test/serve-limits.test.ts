/**
 * The --serve endpoint is the only path in the package that takes untrusted
 * input. Parsing cost grows with the square of the number of matches a name
 * yields, so a synthetic string of repeated season markers costs seconds where a
 * real name costs under 3 ms — unbounded, that is a denial of service against
 * the API. These tests pin the size guards that keep it bounded.
 *
 * Requires `npm run build` first (skipped automatically when dist is missing).
 */
import { describe, it, expect, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(__dirname, '..');
const CLI = join(root, 'bin', 'cli.mjs');
const hasDist = existsSync(join(root, 'dist', 'guessit-js.js'));
const PORT = 38471;
const BASE = `http://127.0.0.1:${PORT}/api/guessit`;

/** Longer than the 1024-character cap, and pathological to parse. */
const OVERSIZED = 'S01E01.'.repeat(400);

let server: ChildProcess | undefined;

async function startServer(): Promise<void> {
  server = spawn('node', [CLI, '--serve', String(PORT)], { stdio: 'ignore' });
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      await fetch(`${BASE}?filename=probe.2020.mkv`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('serve did not come up');
}

afterAll(() => { server?.kill(); });

describe.skipIf(!hasDist)('serve input limits', () => {
  it('parses a normal filename', async () => {
    await startServer();
    const res = await fetch(`${BASE}?filename=Movie.2020.1080p.mkv`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ title: 'Movie', year: 2020 });
  });

  it('rejects an oversized filename on GET', async () => {
    const res = await fetch(`${BASE}?filename=${encodeURIComponent(OVERSIZED)}`);
    expect(res.status).toBe(413);
  });

  it('rejects an oversized filename on POST', async () => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filename: OVERSIZED }),
    });
    expect(res.status).toBe(413);
  });

  it('rejects an oversized filename inside a batch', async () => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filenames: ['fine.2020.mkv', OVERSIZED] }),
    });
    expect(res.status).toBe(413);
  });

  it('rejects a batch beyond the count limit', async () => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filenames: Array(501).fill('Movie.2020.mkv') }),
    });
    expect(res.status).toBe(413);
  });

  it('still accepts a batch within the limits', async () => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filenames: ['Movie.2020.1080p.mkv', 'Show.S01E02.mkv'] }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(2);
  });
});
