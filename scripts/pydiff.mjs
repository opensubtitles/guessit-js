// Fast JS-vs-Python parity diff. Compares live JS output against the committed
// Python golden snapshot (test/fixtures/python-reference.json). No WASM, in-process.
//   node --import tsx scripts/pydiff.mjs            # summary + category counts
//   node --import tsx scripts/pydiff.mjs <substr>   # full diffs for inputs matching substr
//   node --import tsx scripts/pydiff.mjs --cat      # list every diff grouped by category
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { guessit } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(readFileSync(join(__dirname, '..', 'test/fixtures/python-reference.json'), 'utf8'));

function norm(v) {
  if (v === null || v === undefined) return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object' && v !== null && 'alpha3' in v) return v.alpha3;
  if (Array.isArray(v)) return v.map(norm).sort();
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    return v.toLowerCase();
  }
  return v;
}
function normObj(o) {
  const out = {};
  for (const k of Object.keys(o)) { const n = norm(o[k]); if (n !== undefined) out[k] = n; }
  return out;
}

const KNOWN_OK = new Set(['X2.2003.720p.DSNP.WEB-DL.DDP5.1.H.264-EVO.mkv']); // intentional divergence

const arg = process.argv[2];
const inputs = Object.keys(golden.results);
const diffBlocks = [];
const cats = {};
function classify(keys, blockText) {
  for (const k of keys) if (k === 'mimetype') return 'mimetype';
  if ([...keys].some(k => k === 'language' || k === 'subtitle_language') && /(language|subtitle_language): "[a-z]+" vs \[/.test(blockText)) return 'dup-language';
  if (/episode_title: undefined vs/.test(blockText)) return 'spurious-episode_title';
  if (/alternative_title: undefined vs/.test(blockText)) return 'spurious-alternative_title';
  if (/episode: \[[\d,]+\] vs \[[\d,]+\]/.test(blockText)) return 'episode-range';
  if (keys.has('release_group')) return 'release_group';
  if (keys.has('title')) return 'title';
  if (keys.has('language') || keys.has('subtitle_language')) return 'language';
  if (keys.has('season')) return 'season';
  return 'other:' + [...keys].sort().join(',');
}

let nDiff = 0, nKnown = 0;
for (const input of inputs) {
  const py = golden.results[input];
  if (py.__error__) continue;
  let js;
  try { js = normObj(guessit(input)); } catch (e) { diffBlocks.push({ input, cat: 'JS-ERROR', lines: [String(e)] }); nDiff++; continue; }
  const pn = normObj(py);
  const keys = new Set([...Object.keys(pn), ...Object.keys(js)]);
  const lines = [];
  const diffKeys = new Set();
  for (const k of keys) {
    const a = JSON.stringify(pn[k]), b = JSON.stringify(js[k]);
    if (a !== b) { lines.push(`${k}: ${a} vs ${b}`); diffKeys.add(k); }
  }
  if (!lines.length) continue;
  if (KNOWN_OK.has(input)) { nKnown++; continue; }
  const cat = classify(diffKeys, lines.join('\n'));
  cats[cat] = (cats[cat] || 0) + 1;
  diffBlocks.push({ input, cat, lines });
  nDiff++;
}

if (arg && arg !== '--cat') {
  for (const b of diffBlocks.filter(b => b.input.includes(arg))) {
    console.log(`\n[${b.cat}] ${b.input}\n    ${b.lines.join('\n    ')}`);
  }
} else if (arg === '--cat') {
  for (const cat of Object.keys(cats).sort((a, b) => cats[b] - cats[a])) {
    console.log(`\n========== ${cat} (${cats[cat]}) ==========`);
    for (const b of diffBlocks.filter(b => b.cat === cat)) console.log(`[${b.input}]\n    ${b.lines.join('\n    ')}`);
  }
}
console.log('\n----- category counts -----');
for (const c of Object.keys(cats).sort((a, b) => cats[b] - cats[a])) console.log(`${String(cats[c]).padStart(4)}  ${c}`);
// mimetype diffs come from Python's OS-specific /etc/mime.types (e.g. .ts ->
// "text/vnd.trolltech.linguist"); they are environment-dependent and bogus, so
// they are excluded from the "real" parity count.
const mimeOnly = cats['mimetype'] || 0;
console.log(`----\nTotal diverging: ${nDiff}  (known-OK skipped: ${nKnown})  of ${inputs.length} (vs Python ${golden.guessit_version})`);
console.log(`Real (excl. ${mimeOnly} env-specific mimetype): ${nDiff - mimeOnly}`);
