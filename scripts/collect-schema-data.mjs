// Collects per-property type/cardinality/emitted-values from the golden corpus.
import { guessit } from '../src/index.js';
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const ref = require('../test/fixtures/python-reference.json');
const inputs = Object.keys(ref.results);
const info = {};
for (const f of inputs) {
  let r; try { r = guessit(f); } catch { continue; }
  for (const [k, v] of Object.entries(r)) {
    const e = info[k] ||= { types: new Set(), array: false, scalar: false, values: new Set() };
    const arr = Array.isArray(v); arr ? (e.array = true) : (e.scalar = true);
    for (const item of (arr ? v : [v])) {
      let t = item === null ? 'null' : typeof item;
      if (t === 'object') t = (item && 'alpha3' in item) ? 'Language' : 'object';
      e.types.add(t);
      if (typeof item === 'string' || typeof item === 'number') e.values.add(item);
    }
  }
}
const out = {};
for (const k of Object.keys(info).sort()) {
  const e = info[k];
  out[k] = { types: [...e.types].sort(), array: e.array, scalar: e.scalar,
    values: [...e.values].sort((a,b)=>String(a).localeCompare(String(b))) };
}
writeFileSync(new URL('../test/fixtures/corpus-schema-data.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('wrote corpus-schema-data.json for', Object.keys(out).length, 'properties');
