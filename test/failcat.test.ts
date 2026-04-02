import { test } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { guessit } from '../src/index.js';
import { Language } from '../src/language/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function tryResolveLanguage(s: string): string | undefined {
  try { return Language.fromString(s)?.alpha3; } catch { return undefined; }
}

function normaliseResult(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map(normaliseResult);
  if (typeof v === 'object' && 'alpha3' in (v as object)) return (v as { alpha3: string }).alpha3;
  return v;
}

function normaliseExpected(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map(normaliseExpected);
  if (typeof v === 'string') {
    const alpha3 = tryResolveLanguage(v);
    if (alpha3 !== undefined) return alpha3;
  }
  return v;
}

test('categorize failures', () => {
  const files = ['movies.yml', 'episodes.yml', 'various.yml', 'streaming_services.yaml'];
  const failCats: Record<string, {count: number, examples: string[]}> = {};
  let pass = 0, fail = 0;
  
  for (const f of files) {
    const raw = readFileSync(join(__dirname, 'fixtures', f), 'utf8');
    const doc = yaml.load(raw, { schema: yaml.DEFAULT_SCHEMA, json: true }) as Record<string, unknown>;
    if (!doc) continue;
    
    for (const [input, value] of Object.entries(doc)) {
      if (input === '__default__' || typeof value !== 'object' || !value) continue;
      const expected = value as Record<string, unknown>;
      
      let thisPass = true;
      try {
        const result = guessit(input);
        
        for (const [key, expVal] of Object.entries(expected)) {
          const actual = normaliseResult(result[key]);
          const exp = normaliseExpected(expVal);
          const matches = JSON.stringify(actual) === JSON.stringify(exp);
          if (!matches) {
            thisPass = false;
            const cat = `${key}: got ${JSON.stringify(actual)} vs ${JSON.stringify(exp).substring(0,30)}`;
            if (!failCats[key]) failCats[key] = { count: 0, examples: [] };
            failCats[key].count++;
            if (failCats[key].examples.length < 2) {
              failCats[key].examples.push(`"${input.substring(0,50)}" -> ${key}=${JSON.stringify(actual)} (want ${JSON.stringify(exp)})`);
            }
          }
        }
      } catch(e) {
        thisPass = false;
        if (!failCats['ERROR']) failCats['ERROR'] = { count: 0, examples: [] };
        failCats['ERROR'].count++;
        if (failCats['ERROR'].examples.length < 2) failCats['ERROR'].examples.push(`"${input}" -> ${e}`);
      }
      
      if (thisPass) pass++;
      else fail++;
    }
  }
  
  console.log(`\nPass: ${pass}, Fail: ${fail}`);
  console.log('\n=== Failures by key ===');
  const sorted = Object.entries(failCats).sort(([,a],[,b]) => b.count-a.count);
  for (const [key, {count, examples}] of sorted) {
    console.log(`\n${key}: ${count}`);
    for (const ex of examples) console.log(`  ex: ${ex}`);
  }
});
