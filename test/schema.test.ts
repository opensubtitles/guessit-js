import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { guessit, properties, GUESSIT_SCHEMA } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ref = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'python-reference.json'), 'utf8'));
const inputs = Object.keys(ref.results);
const outputSchema = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'output-schema.json'), 'utf8'));

describe('output schema', () => {
  it('properties() advertises every property in GUESSIT_SCHEMA', () => {
    const p = properties();
    for (const name of Object.keys(GUESSIT_SCHEMA)) {
      expect(p[name], `properties() missing ${name}`).toBeDefined();
    }
    expect(Object.keys(p).length).toBe(Object.keys(GUESSIT_SCHEMA).length);
  });

  it('value-constrained properties expose a non-empty enum', () => {
    expect(GUESSIT_SCHEMA.source.enum).toContain('Blu-ray');
    expect(GUESSIT_SCHEMA.type.enum).toEqual(['episode', 'movie']);
    expect(GUESSIT_SCHEMA.video_codec.enum).toContain('H.264');
    expect(properties().source).toContain('Web');
  });

  it('enums are code-complete — include values no corpus example triggers', () => {
    // These source values are defined in src/rules/properties/source.ts but are
    // absent from the 1009-input corpus; the enum must still list them.
    for (const v of ['Workprint', 'Telecine', 'Telesync', 'Pay-per-view', 'Video on Demand']) {
      expect(GUESSIT_SCHEMA.source.enum, `source enum missing ${v}`).toContain(v);
    }
  });

  it('every property emitted across the corpus is in the schema', () => {
    const unknownKeys = new Set<string>();
    for (const f of inputs) {
      let r: Record<string, unknown>;
      try { r = guessit(f) as Record<string, unknown>; } catch { continue; }
      for (const k of Object.keys(r)) if (!(k in GUESSIT_SCHEMA)) unknownKeys.add(k);
    }
    expect([...unknownKeys]).toEqual([]);
  });

  it('every emitted enum value is allowed by the schema (schema is not stale)', () => {
    const violations: string[] = [];
    for (const f of inputs) {
      let r: Record<string, unknown>;
      try { r = guessit(f) as Record<string, unknown>; } catch { continue; }
      for (const [k, v] of Object.entries(r)) {
        const def = GUESSIT_SCHEMA[k];
        if (!def?.enum) continue;
        for (const item of (Array.isArray(v) ? v : [v])) {
          if ((typeof item === 'string' || typeof item === 'number') && !def.enum.includes(item)) {
            violations.push(`${k}=${JSON.stringify(item)} (${f.slice(0, 60)})`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('docs/output-schema.json is a valid draft-07 schema describing all properties', () => {
    expect(outputSchema.$schema).toContain('draft-07');
    for (const name of Object.keys(GUESSIT_SCHEMA)) {
      expect(outputSchema.properties[name], `JSON schema missing ${name}`).toBeDefined();
    }
  });
});
