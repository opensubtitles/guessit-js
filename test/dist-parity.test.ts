/**
 * The built bundle must parse exactly like the source.
 *
 * rebulk identifies a rule by `this.constructor.name`. A minifier that renames
 * classes therefore collapses rule identity, and the engine silently loses
 * dependency order and dedup — v4.7.1 shipped a dist that diverged from src on
 * 337 of 1412 corpus names (episode_title read as alternative_title, filepart
 * title selection, film_title dropped) while every source-level test passed.
 * `keepNames` in vite.config.ts and wasm/build.sh is what holds the two
 * together; this guards it.
 *
 * Requires `npm run build` first (skipped automatically when dist is missing).
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import yaml from 'js-yaml';
import { guessit as guessitSrc } from '@/index.js';

const root = resolve(__dirname, '..');
const distPath = join(root, 'dist', 'guessit-js.cjs');
const hasDist = existsSync(distPath);

function corpusNames(): string[] {
  const dir = join(__dirname, 'fixtures');
  const names = new Set<string>();
  for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
    const doc = yaml.load(readFileSync(join(dir, file), 'utf8'), {
      schema: yaml.DEFAULT_SCHEMA,
      json: true,
    }) as Record<string, unknown> | null;
    if (!doc || typeof doc !== 'object') continue;
    for (const key of Object.keys(doc)) {
      if (key !== '__default__') names.add(key);
    }
  }
  return [...names];
}

/** Key order is an artefact of rule execution, not part of the result. */
function stable(value: Record<string, unknown>): string {
  return JSON.stringify(value, Object.keys(value).sort());
}

describe.skipIf(!hasDist)('dist parity', () => {
  it('parses every corpus name exactly like src', () => {
    const require = createRequire(import.meta.url);
    const { guessit: guessitDist } = require(distPath) as typeof import('@/index.js');

    const diffs: string[] = [];
    for (const name of corpusNames()) {
      const fromSrc = stable(guessitSrc(name) as Record<string, unknown>);
      const fromDist = stable(guessitDist(name) as Record<string, unknown>);
      if (fromSrc !== fromDist) {
        diffs.push(`${name}\n  src : ${fromSrc}\n  dist: ${fromDist}`);
      }
    }

    expect(diffs.slice(0, 5).join('\n'), `${diffs.length} src/dist diffs`).toBe('');
  });
});
