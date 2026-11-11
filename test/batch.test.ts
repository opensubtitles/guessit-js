/**
 * Batch parsing: the `guessitMany` library entry point and the batch form of
 * `POST /api/guessit` on server.ts.
 *
 * `guessitMany` exists to hoist the options parse and config merge out of the
 * per-name loop and to isolate failures, so the tests pin both: results must be
 * identical to calling `guessit` one name at a time, and a name that throws must
 * become an `error` entry instead of taking the batch down with it.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { join, resolve } from 'node:path';
import { guessit, guessitMany, GuessItApi } from '../src/index.js';

const NAMES = [
  'The.Dark.Knight.2008.1080p.BluRay.x264-GROUP.mkv',
  'Breaking.Bad.S01E02.720p.BluRay.x264-DEMAND.mkv',
  'Series/Season 2/03 - Episode Title.avi',
  'Movie.Title.2020.MULTi.VFF.1080p.WEB-DL.mkv',
];

describe('guessitMany', () => {
  it('returns one entry per input, in order, keyed by input_string', () => {
    const entries = guessitMany(NAMES);
    expect(entries).toHaveLength(NAMES.length);
    expect(entries.map((e) => e.input_string)).toEqual(NAMES);
  });

  it('matches guessit() called one name at a time', () => {
    const batch = guessitMany(NAMES);
    for (const [i, name] of NAMES.entries()) {
      const entry = batch[i];
      expect(entry).not.toHaveProperty('error');
      expect('result' in entry && entry.result).toEqual(guessit(name));
    }
  });

  it('honours options for every name in the batch', () => {
    const entries = guessitMany(['Something.Ambiguous.2020.mkv', 'Another.One.2019.mkv'], {
      type: 'movie',
      output_input_string: true,
    });
    for (const entry of entries) {
      expect('result' in entry && entry.result['type']).toBe('movie');
      expect('result' in entry && entry.result['input_string']).toBe(entry.input_string);
    }
  });

  it('isolates a failing name instead of aborting the batch', () => {
    // Force a failure for exactly one name by making the matcher throw on it.
    const api = new GuessItApi();
    api.guessit('warmup.2020.mkv'); // build the matcher before we wrap it
    const rebulk = (api as unknown as { _rebulk: { matches: (s: string, c: unknown) => unknown } })._rebulk;
    const original = rebulk.matches.bind(rebulk);
    rebulk.matches = (s, c) => {
      if (s.includes('BOOM')) throw new Error('synthetic failure');
      return original(s, c);
    };

    const entries = api.guessitMany(['Good.2020.mkv', 'BOOM.2020.mkv', 'AlsoGood.2021.mkv']);
    expect(entries).toHaveLength(3);
    expect('result' in entries[0] && entries[0].result['year']).toBe(2020);
    expect('error' in entries[1] && entries[1].error).toContain('synthetic failure');
    expect('result' in entries[2] && entries[2].result['year']).toBe(2021);
  });

  it('accepts an empty list', () => {
    expect(guessitMany([])).toEqual([]);
  });
});

const root = resolve(__dirname, '..');
const PORT = 38472;
const BASE = `http://127.0.0.1:${PORT}/api/guessit`;
let server: ChildProcess | undefined;

async function startServer(): Promise<void> {
  server = spawn(join(root, 'node_modules', '.bin', 'tsx'), [join(root, 'server.ts')], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await fetch(`${BASE}?filename=probe.2020.mkv`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('server.ts did not come up');
}

const post = (body: unknown) =>
  fetch(BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

afterAll(() => { server?.kill(); });

describe('server.ts batch POST', () => {
  it('parses a batch and returns an entry per name', async () => {
    await startServer();
    const res = await post({ filenames: NAMES });
    expect(res.status).toBe(200);
    const entries = (await res.json()) as Array<{ input_string: string; result?: Record<string, unknown> }>;
    expect(entries).toHaveLength(NAMES.length);
    expect(entries.map((e) => e.input_string)).toEqual(NAMES);
    expect(entries[0].result).toMatchObject({ title: 'The Dark Knight', year: 2008 });
  });

  it('still answers the single-filename form with a bare result', async () => {
    const res = await post({ filename: 'Movie.2020.1080p.mkv' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ title: 'Movie', year: 2020 });
  });

  it('passes options through to the batch', async () => {
    const res = await post({ filenames: ['Ambiguous.Name.2020.mkv'], options: { type: 'movie' } });
    const entries = (await res.json()) as Array<{ result: Record<string, unknown> }>;
    expect(entries[0].result['type']).toBe('movie');
  });

  it('rejects a batch beyond the count limit', async () => {
    const res = await post({ filenames: Array(101).fill('Movie.2020.mkv') });
    expect(res.status).toBe(413);
  });

  it('rejects an oversized filename inside a batch', async () => {
    const res = await post({ filenames: ['fine.2020.mkv', 'S01E01.'.repeat(400)] });
    expect(res.status).toBe(413);
  });

  it('rejects a non-array filenames field', async () => {
    const res = await post({ filenames: 'Movie.2020.mkv' });
    expect(res.status).toBe(400);
  });

  it('rejects a body with neither field', async () => {
    const res = await post({ options: { type: 'movie' } });
    expect(res.status).toBe(400);
  });

  it('accepts a full 100-name batch', async () => {
    const res = await post({ filenames: Array.from({ length: 100 }, (_, i) => `Show.S01E${i % 20 + 1}.1080p.mkv`) });
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(100);
  });
});
