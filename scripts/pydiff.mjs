// Fast JS-vs-Python parity diff. Compares live JS output against the committed
// Python golden snapshot (test/fixtures/python-reference.json). No WASM, in-process.
//   node --import tsx scripts/pydiff.mjs            # summary + category counts
//   node --import tsx scripts/pydiff.mjs <substr>   # full diffs for inputs matching substr
//   node --import tsx scripts/pydiff.mjs --cat      # list every diff grouped by category
//   node --import tsx scripts/pydiff.mjs --verdicts # every diff grouped by fix/neutral/keep verdict
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

// Per-case verdict. First matching substring wins. Verdict is 'fix' (JS wrong),
// 'keep' (JS more correct than Python — intentional), or 'neutral' (undecided).
// Anything unmatched falls through to neutral/'unclassified' so new diffs surface.
// [substring, verdict, cluster, note]
const VERDICTS = [
  // ---- FIX: alternative_title that is a label / edition / region / junk ----
  ['Criterion.Collection', 'fix', 'alt → label/edition/region/junk', 'edition "collection" → drop'],
  ['Kino.Classics', 'fix', 'alt → label/edition/region/junk', 'label → drop'],
  ['Heathers', 'fix', 'alt → label/edition/region/junk', 'label "arrow" + "plus comm" → drop'],
  ['InDefinitely.Maybe', 'fix', 'alt → label/edition/region/junk', 'region "eur" → drop'],
  ['Suicide Squad EXTENDED', 'fix', 'alt → label/edition/region/junk', 'colour-space "bt" (BT709) → drop'],
  ['Dead Man Down', 'fix', 'alt → label/edition/region/junk', 'release descriptor "custom" → drop'],
  ['Hacksaw Ridge', 'fix', 'alt → label/edition/region/junk', 'punctuation "&" → drop'],
  ['MASH.(1970)', 'fix', 'alt → label/edition/region/junk', 'codec-version "5" → drop'],
  // ---- KEEP: numeric alternative_title fixed (RemoveNumericAlternativeTitle); ----
  //      remaining diff is Python's year→season bug (JS correctly emits `year`) ----
  ['Show!.Name.2.-.10', 'keep', 'JS better — Python year→season bug', 'numeric alt dropped; py reads 2016 as season'],
  ['Show.Name.-.07.(2016)', 'keep', 'JS better — Python year→season bug', 'numeric alt dropped; py reads 2016 as season'],
  ['Show.Name.-.476-479', 'keep', 'JS better — Python year→season bug', 'numeric alt dropped; py reads 2007 as season'],
  ['Show.Name.s10e15(233)', 'neutral', 'undecided', 'js episode_title "233" (the absolute number) vs py drops it'],
  // ---- FIX: episode_title that is a tag / broadcaster / credit ----
  ['Bleach.s16e03-04.313-314-GROUP', 'fix', 'ep_title → tag/broadcaster/credit', '"group" → release_group'],
  ['Show.Name.16x03-05.313-315-GROUP', 'fix', 'ep_title → tag/broadcaster/credit', '"group" → release_group'],
  ['S01e10[Mux', 'fix', 'ep_title → tag/broadcaster/credit', '"mux" container tag → drop'],
  ['S02e19 [Mux', 'fix', 'ep_title → tag/broadcaster/credit', '"mux" container tag → drop'],
  ['Eng.Soft.Subtitles', 'fix', 'ep_title → tag/broadcaster/credit', '"soft" → drop'],
  ['Cap.112_114.Final', 'fix', 'ep_title → tag/broadcaster/credit', '"final" → drop'],
  ['Ayako-Shikkaku', 'fix', 'ep_title → tag/broadcaster/credit', '"lq" quality tag → drop'],
  ['ShinBunBu-Subs] Bleach', 'fix', 'ep_title → tag/broadcaster/credit', '"cx" broadcaster → drop'],
  ['par Fansub-Resistance', 'fix', 'ep_title → tag/broadcaster/credit', 'fansub credit → drop'],
  ['Obfuscated/afaae96', 'fix', 'ep_title → tag/broadcaster/credit', 'obfuscation hash → drop'],
  // ---- FIX: episode_title returned as a LIST with a stray extra fragment ----
  ['Babylon 5', 'fix', 'ep_title → list w/ stray fragment', 'drop leading "ep"'],
  ['Away.Feed', 'fix', 'ep_title → list w/ stray fragment', 'drop "away feed"'],
  ['Home.Feed', 'fix', 'ep_title → list w/ stray fragment', 'drop "home feed"'],
  ['By.Malaguita', 'fix', 'ep_title → list w/ stray fragment', 'drop credit "by malaguita"'],
  ['Aint.Nothing.Like', 'fix', 'ep_title → list w/ stray fragment', 'drop "custom"'],
  ['Tales S01E08', 'fix', 'ep_title → list w/ stray fragment', 'drop broadcaster "bet"'],
  // ---- FIX: title absorbed junk tokens ----
  ['WWW.TORRENTING.COM', 'fix', 'title absorbs junk', 'drop "from"'],
  ['Show.Name.Part.1.and.Part.2', 'fix', 'title absorbs junk', 'drop "and","blah-group"'],
  ['The.Arrival.4K', 'fix', 'title absorbs junk', 'drop "madvr"'],
  ['Show-A (US)', 'fix', 'title absorbs junk', '"episode title" → episode_title'],
  ['French Maid Services', 'fix', 'title absorbs junk', 'drop "split scenes" + phantom language fra'],
  // ---- FIX: phantom languages ----
  ['Ejecutiva.En.Apuros', 'fix', 'phantom language', 'drop phantom eng (from "En")'],
  ['En Close, Yet En Far', 'fix', 'phantom language', 'drop phantom eng (from "En")'],
  ['Fear.the.Walking.Dead.-.Season.2.epi', 'fix', 'phantom language', 'dedup eng'],
  ['French.Immersion', 'fix', 'phantom language', 'drop phantom fra (from title "French")'],
  ['Elle.s.en.va', 'fix', 'phantom language', 'drop phantom eng'],
  ['The_Italian_Job', 'fix', 'phantom language', 'drop phantom ita (from title "Italian")'],
  ['Underworld Quadrilogie', 'fix', 'phantom language', 'dedup fra (VFF+VFQ)'],
  // ---- FIX: episode_details / release_group / version / country phantoms ----
  ['Special.Correspondents', 'fix', 'episode_details / rg / version / country phantom', 'drop episode_details "special" (movie title)'],
  ['Ouija.Seance', 'fix', 'episode_details / rg / version / country phantom', 'drop episode_details "final"'],
  ['03-Criminal.Minds', 'fix', 'episode_details / rg / version / country phantom', 'drop release_group "03"'],
  ['Season.2.Full', 'fix', 'episode_details / rg / version / country phantom', 'drop junk release_group "[season.2.full]"'],
  ['We.Bare.Bears', 'fix', 'episode_details / rg / version / country phantom', 'drop version 3 (from hash)'],
  ['Bienvenue.Au.Gondwana', 'fix', 'episode_details / rg / version / country phantom', 'drop country au (French "Au")'],

  // ---- KEEP: JS is more correct than Python (intentional) ----
  ['Masala', 'keep', 'JS better — Python misses it', 'Telugu detected (py misses)'],
  ['PutaLocura', 'keep', 'JS better — Python misses it', 'Spanish detected (py misses)'],
  ['60.Minutes.2008', 'keep', 'JS better — Python misses it', 'title "60 Minutes" (py drops the "60")'],
  ['HC.WEBRip', 'keep', 'JS better — Python misses it', 'HC = Hardcoded Subtitles (py omits)'],
  ['Deadpool', 'keep', 'JS better — Python misses it', 'UHD → Ultra HD (py omits)'],
  ['Half-OU', 'keep', 'JS better — Python misses it', 'stereoscopic 3D "Half OU" (py drops)'],
  ['Half-SBS', 'keep', 'JS better — Python misses it', 'stereoscopic 3D "Half SBS" (py drops)'],
  ['PlayboyPlus', 'keep', 'JS better — Python misses it', 'website extracted (py keeps in title)'],
  ['Duckman', 'keep', 'JS better — Python misses it', 'absolute_episode detected'],
  ['Big Bang Theory S01E00', 'keep', 'JS better — Python misses it', 'episode_title "Unaired Pilot"'],
  ['A Bout Portant (The Killers)', 'keep', 'legit alternative title (verified)', '"À bout portant" 1964 = "The Killers"'],
  ['Le.Prestige.(The.Prestige)', 'keep', 'legit alternative title (verified)', 'English original of "Le Prestige"'],
  ['Batoru.Rowaiaru', 'keep', 'legit alternative title (verified)', 'Japanese romaji of "Battle Royale"'],
  ['Youth.In.Revolt.(Be.Bad)', 'keep', 'legit alternative title (verified)', '"Be Bad!" French/intl release title'],
  ['S2.-.19', 'keep', 'JS better — Python misses it', 'anime "S2 - 19" → episode 19 (Python leaves episode_title "19")'],
  ['Outrageous.Acts.of.Science', 'keep', 'JS better — Python misses it', 'episode_title "Is This for Real" kept; Python truncates at a phantom Proper(real)'],

  // ---- NEUTRAL: undecided / both imperfect ----
  ['11.22.63', 'neutral', 'undecided', 'date-show "11.22.63"; both parse imperfectly'],
  ['CD-ROM.and.Hoagie', 'neutral', 'undecided', 'obfuscated; js partial episode_title, py none'],
  ['MotoGP', 'neutral', 'undecided', 'js country US vs py "usa race…"'],
  ['BarFood christmas', 'neutral', 'undecided', 'title/type/episode_details disagreement'],
  ['A.Common.Title.Special', 'neutral', 'undecided', '"Special" may be the title'],
  ['FooBar.7v3', 'neutral', 'undecided', 'version 3 vs title "foobar 7v3"'],
  ['555.S01', 'neutral', 'undecided', 'py absolute_episode 555 vs js title "555"'],
  ['02.5.(Special)', 'neutral', 'undecided', 'py "5" vs js "5 special"'],
  ['7.1.7.8.5] Foo Bar', 'neutral', 'undecided', 'py release_group "7.8.5" vs js none'],
  ['Bunker Palace', 'neutral', 'undecided', 'accent case (also the 1 JS↔WASM diff)'],
  ['Something.Other.Season.1&3-1to12ep', 'neutral', 'undecided', 'py "1to12ep" vs js episode 12 + ["1to","ep"]'],
  ['desca202', 'neutral', 'undecided', 'py episode_title "desca202" vs js "p"; both poor'],
];

function verdictFor(input, cat) {
  for (const [sub, verdict, cluster, note] of VERDICTS) {
    if (input.includes(sub)) return { verdict, cluster, note };
  }
  if (cat === 'mimetype') return { verdict: 'keep', cluster: 'mimetype (OS-specific /etc/mime.types)', note: 'Python value is env-specific/bogus; JS undefined or correct' };
  return { verdict: 'neutral', cluster: 'unclassified — needs a verdict', note: '' };
}

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
  const v = verdictFor(input, cat);
  diffBlocks.push({ input, cat, lines, ...v });
  nDiff++;
}

if (arg === '--verdicts') {
  // Group by verdict (fix → neutral → keep), then by cluster. Full diff format.
  const titles = { fix: '① TO FIX — guessit-js is wrong', neutral: '② NEUTRAL — undecided', keep: '③ WON\'T FIX — guessit-js is already more correct' };
  for (const verdict of ['fix', 'neutral', 'keep']) {
    const blocks = diffBlocks.filter(b => b.verdict === verdict);
    console.log(`\n\n############## ${titles[verdict]} (${blocks.length}) ##############`);
    const clusters = [...new Set(blocks.map(b => b.cluster))];
    for (const cluster of clusters) {
      console.log(`\n===== ${cluster} =====`);
      for (const b of blocks.filter(b => b.cluster === cluster)) {
        console.log(`[${b.input}]`);
        for (const l of b.lines) console.log(`    ${l}`);
        if (b.note) console.log(`    » ${b.note}`);
      }
    }
  }
} else if (arg && arg !== '--cat') {
  for (const b of diffBlocks.filter(b => b.input.includes(arg))) {
    console.log(`\n[${b.verdict}/${b.cat}] ${b.input}\n    ${b.lines.join('\n    ')}${b.note ? `\n    » ${b.note}` : ''}`);
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
const byVerdict = { fix: 0, neutral: 0, keep: 0 };
for (const b of diffBlocks) byVerdict[b.verdict] = (byVerdict[b.verdict] || 0) + 1;
const unclassified = diffBlocks.filter(b => b.cluster === 'unclassified — needs a verdict').length;
console.log(`Verdicts: FIX ${byVerdict.fix} · NEUTRAL ${byVerdict.neutral} · KEEP ${byVerdict.keep}${unclassified ? `  (⚠ ${unclassified} unclassified)` : ''}`);
