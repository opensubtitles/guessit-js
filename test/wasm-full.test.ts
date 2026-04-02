import { test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import yaml from 'js-yaml';
import { guessit } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WASMTIME = join(process.env.HOME || '', '.wasmtime/bin/wasmtime');
const WASM_PATH = join(__dirname, '..', 'wasm', 'guessit.wasm');

function wasmGuessit(filename: string): Record<string, unknown> {
  const input = JSON.stringify({ filename });
  // Use printf to avoid shell interpretation of backslashes
  const result = execSync(`printf '%s' ${JSON.stringify(input)} | ${WASMTIME} ${WASM_PATH}`, {
    timeout: 10000,
    encoding: 'utf-8',
  }).trim();
  return JSON.parse(result);
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

test(`WASM vs JS: all ${allCases.length} fixtures`, () => {
  let pass = 0, fail = 0, error = 0;
  const failures: string[] = [];

  for (const { file, input } of allCases) {
    let jsResult: Record<string, unknown>;
    let wasmResult: Record<string, unknown>;

    try {
      jsResult = guessit(input) as Record<string, unknown>;
    } catch {
      continue; // skip if JS itself errors
    }

    try {
      wasmResult = wasmGuessit(input);
    } catch (e) {
      error++;
      failures.push(`[${file}] ERROR: ${input.slice(0, 60)} - ${e}`);
      continue;
    }

    if (wasmResult.error) {
      error++;
      failures.push(`[${file}] WASM_ERR: ${input.slice(0, 60)} - ${wasmResult.error}`);
      continue;
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

    if (match) {
      pass++;
    } else {
      fail++;
      failures.push(`[${file}] DIFF: ${input.slice(0, 60)}\n  ${diffs.join('\n  ')}`);
    }
  }

  console.log(`\nWASM vs JS comparison: ${pass} match, ${fail} diff, ${error} errors out of ${allCases.length}`);
  if (failures.length > 0) {
    console.log(`\nFailures (${failures.length}):`);
    for (const f of failures) console.log(f);
  }

  // The WASM should match JS for the vast majority
  // 1 known diff: La Science des Rêves (accent normalization not available in QuickJS)
  expect(fail + error, `${fail} diffs + ${error} errors`).toBeLessThan(2);
}, 600000); // 10 minute timeout
