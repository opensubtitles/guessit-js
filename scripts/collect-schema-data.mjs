// Collects per-property schema data from two sources:
//   1. the golden corpus (types, cardinality, values actually emitted)
//   2. the configured rebulk patterns (every value the CODE can emit — including
//      values no corpus example happens to trigger, e.g. source "Workprint")
import { guessit } from '../src/index.js';
import { defaultApi } from '../src/api.js';
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const ref = require('../test/fixtures/python-reference.json');
// Synthetic inputs that exercise code paths the golden corpus doesn't cover, so
// their emitted values (container extensions, artwork `other` kinds) land in the
// schema enums. Keep in sync with container config + ImageArtKeywordToOther.
const SYNTHETIC = [
  'Movie.2020.1080p.x264-GRP.rar', 'Movie.2020-GRP.zip', 'Movie.2020-GRP.7z',
  'Movie.2020-GRP.tar', 'Movie.2020-GRP.gz', 'Movie.2020-GRP.bz2', 'Movie.2020-GRP.tgz',
  'Movie.2020-GRP.ace', 'Movie.2020-GRP.arj', 'Movie.2020-GRP.cbr', 'Movie.2020-GRP.cbz',
  'Movie.2020-GRP.cb7', 'Movie.2020.1080p.x264.r00',
  'Movie.2020-GRP.jpg', 'Movie.2020-GRP.jpeg', 'Movie.2020-GRP.png', 'Movie.2020-GRP.gif',
  'Movie.2020-GRP.bmp', 'Movie.2020-GRP.tbn', 'Movie.2020-GRP.webp',
  'poster.jpg', 'fanart.jpg', 'banner.jpg', 'thumb.jpg', 'thumbnail.jpg',
  'landscape.jpg', 'cover.jpg', 'clearart.png', 'clearlogo.png', 'logo.png', 'discart.png',
];
const inputs = [...Object.keys(ref.results), ...SYNTHETIC];
const info = {};

// ---- code-defined values: walk every pattern's value mappings ----
const codeValues = {};
const addCode = (prop, val) => {
  if (val == null || typeof val === 'object') return;
  // Ignore positional regex group indices ("0","1") that aren't real properties.
  if (!/^[a-z][a-z0-9_]*$/.test(String(prop))) return;
  (codeValues[prop] ??= new Set()).add(val);
};
defaultApi.configure({});
for (const p of defaultApi._rebulk.effectivePatterns()) {
  const name = p.name;
  // defaultValue: scalar belongs to the pattern's property; object spreads by key
  if (p.defaultValue && typeof p.defaultValue === 'object') {
    for (const [pp, vv] of Object.entries(p.defaultValue)) addCode(pp, vv);
  } else if (p.defaultValue != null && name) addCode(name, p.defaultValue);
  // values: { groupName: value } or { groupName: { prop: value } }; "undefined"
  // key (or a non-property group name) means the value belongs to p.name.
  for (const [gname, val] of Object.entries(p.values || {})) {
    if (val && typeof val === 'object') { for (const [pp, vv] of Object.entries(val)) addCode(pp, vv); }
    else addCode(gname === 'undefined' ? name : gname, val);
  }
}

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
const allKeys = new Set([...Object.keys(info), ...Object.keys(codeValues)]);
for (const k of [...allKeys].sort()) {
  const e = info[k] || { types: new Set(), array: false, scalar: false, values: new Set() };
  const cv = codeValues[k] || new Set();
  out[k] = {
    types: [...e.types].sort(),
    array: e.array, scalar: e.scalar,
    values: [...e.values].sort((a, b) => String(a).localeCompare(String(b))),
    codeValues: [...cv].sort((a, b) => String(a).localeCompare(String(b))),
  };
}
writeFileSync(new URL('../test/fixtures/corpus-schema-data.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('wrote corpus-schema-data.json for', Object.keys(out).length, 'properties',
  '(' + Object.keys(codeValues).length, 'have code-defined values)');
