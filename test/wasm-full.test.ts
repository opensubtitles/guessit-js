import { test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { cpus } from 'os';
import yaml from 'js-yaml';
import { guessit } from '../src/index.js';

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const WASMTIME = join(process.env.HOME || '', '.wasmtime/bin/wasmtime');
const WASM_PATH = join(__dirname, '..', 'wasm', 'guessit.wasm');

// Each fixture spawns a fresh wasmtime subprocess, so the suite is process-spawn
// bound. Run spawns through a bounded pool sized to the host's cores.
const WASM_CONCURRENCY = Math.max(2, cpus().length - 2);

async function wasmGuessit(filename: string): Promise<Record<string, unknown>> {
  const input = JSON.stringify({ filename });
  // Use printf to avoid shell interpretation of backslashes
  const { stdout } = await execAsync(
    `printf '%s' ${JSON.stringify(input)} | ${WASMTIME} ${WASM_PATH}`,
    { timeout: 10000, encoding: 'utf-8' }
  );
  return JSON.parse(stdout.trim());
}

// Map over items with a fixed number of concurrent workers, preserving order.
async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function normalizeValue(v: unknown): unknown {
  if (v === null || v === undefined) return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10); // YYYY-MM-DD only
  if (typeof v === 'object' && v !== null && 'alpha3' in (v as any)) return (v as any).alpha3;
  if (Array.isArray(v)) return v.map(normalizeValue).sort();
  if (typeof v === 'string') {
    // Normalize date strings to YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    return v.toLowerCase();
  }
  return v;
}

const FIXTURE_FILES = ['movies.yml', 'episodes.yml', 'various.yml', 'streaming_services.yaml'];

// Load all fixtures
const allCases: Array<{ file: string; input: string }> = [];
for (const f of FIXTURE_FILES) {
  try {
    const raw = readFileSync(join(__dirname, 'fixtures', f), 'utf8');
    const doc = yaml.load(raw, { schema: yaml.DEFAULT_SCHEMA, json: true }) as Record<string, unknown>;
    if (!doc) continue;
    for (const key of Object.keys(doc)) {
      if (key === '__default__') continue;
      allCases.push({ file: f, input: key });
    }
  } catch {}
}

test(`WASM vs JS: all ${allCases.length} fixtures`, async () => {
  let pass = 0, fail = 0, error = 0;
  const failures: string[] = [];

  type Outcome = { kind: 'skip' } | { kind: 'error'; msg: string } | { kind: 'pass' } | { kind: 'diff'; msg: string };

  const outcomes = await mapPool(allCases, WASM_CONCURRENCY, async ({ file, input }): Promise<Outcome> => {
    let jsResult: Record<string, unknown>;
    let wasmResult: Record<string, unknown>;

    try {
      jsResult = guessit(input) as Record<string, unknown>;
    } catch {
      return { kind: 'skip' }; // skip if JS itself errors
    }

    try {
      wasmResult = await wasmGuessit(input);
    } catch (e) {
      return { kind: 'error', msg: `[${file}] ERROR: ${input.slice(0, 60)} - ${e}` };
    }

    if (wasmResult.error) {
      return { kind: 'error', msg: `[${file}] WASM_ERR: ${input.slice(0, 60)} - ${wasmResult.error}` };
    }

    // Compare all keys from JS result
    let match = true;
    const diffs: string[] = [];
    for (const key of Object.keys(jsResult)) {
      const jsVal = normalizeValue(jsResult[key]);
      const wasmVal = normalizeValue(wasmResult[key]);
      if (JSON.stringify(jsVal) !== JSON.stringify(wasmVal)) {
        match = false;
        diffs.push(`${key}: js=${JSON.stringify(jsVal)} wasm=${JSON.stringify(wasmVal)}`);
      }
    }

    if (match) return { kind: 'pass' };
    return { kind: 'diff', msg: `[${file}] DIFF: ${input.slice(0, 60)}\n  ${diffs.join('\n  ')}` };
  });

  for (const o of outcomes) {
    if (o.kind === 'pass') pass++;
    else if (o.kind === 'diff') { fail++; failures.push(o.msg); }
    else if (o.kind === 'error') { error++; failures.push(o.msg); }
  }

  console.log(`\nWASM vs JS comparison: ${pass} match, ${fail} diff, ${error} errors out of ${allCases.length}`);
  if (failures.length > 0) {
    console.log(`\nFailures (${failures.length}):`);
    for (const f of failures) console.log(f);
  }

  // WASM must match the JS build EXACTLY. The former accent diffs ("La Science
  // des Rêves", "Bunker Palace Hôtel") are gone: title comparison now uses a
  // self-contained diacritic-folding table (foldDiacritics) instead of the JS
  // engine's normalize('NFD'), which QuickJS/Javy doesn't implement.
  expect(fail + error, `${fail} diffs + ${error} errors`).toBe(0);
}, 600000); // 10 minute timeout
