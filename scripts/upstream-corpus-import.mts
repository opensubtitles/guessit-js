// Imports the cases from upstream guessit's own test suite that this port does not
// carry, into test/fixtures/upstream-{corpus,rules}-*.yml.
//
//   1. Clone or fetch guessit-io/guessit, then export its fixture files:
//        for f in $(git ls-tree -r origin/develop --name-only guessit/test/ | grep -E '\.ya?ml$' | grep -v test/config/); do
//          git show "origin/develop:$f" > "$SP/up/$(echo $f | sed 's#guessit/test/##; s#/#__#g')"
//        done
//   2. SP=<dir> npx tsx scripts/upstream-corpus-import.mts   (writes $SP/missing.json too)
//   3. Wire the new files into FIXTURE_FILES in test/guessit.test.ts and run the suite.
//   4. SP=<dir> npx tsx scripts/upstream-corpus-quarantine.mts to park what fails.
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const SP = process.env['SP']!;
const upDir = join(SP, 'up');
const missing: Record<string, string[]> = JSON.parse(readFileSync(join(SP, 'missing.json'), 'utf8'));

/** Split a guessit fixture file into blocks: each block is the `? name` lines plus its body. */
function blocks(raw: string): { names: string[]; text: string }[] {
  const lines = raw.split('\n');
  const out: { names: string[]; text: string }[] = [];
  let cur: string[] = [];
  const flush = () => {
    if (!cur.length) return;
    const text = cur.join('\n');
    const names: string[] = [];
    for (const l of cur) {
      const m = /^\? (.*)$/.exec(l);
      if (m) {
        const parsed = yaml.load(`? ${m[1]}\n: 1\n`, { schema: yaml.DEFAULT_SCHEMA, json: true }) as Record<string, unknown>;
        names.push(Object.keys(parsed)[0]);
      }
    }
    out.push({ names, text });
    cur = [];
  };
  for (const l of lines) {
    if (/^\? /.test(l) && cur.some((c) => /^[:\s]/.test(c) && c.trim())) flush();
    cur.push(l);
  }
  flush();
  return out;
}

let written = 0;
for (const [file, missNames] of Object.entries(missing)) {
  const raw = readFileSync(join(upDir, file), 'utf8');
  const missSet = new Set(missNames.map((n) => n.replace(/^-/, '').trim()));
  const kept: string[] = [];
  let defaultBlock = '';
  for (const b of blocks(raw)) {
    if (b.names.includes('__default__')) { defaultBlock = b.text.replace(/\n+$/, ''); continue; }
    if (!b.names.some((n) => missSet.has(n.replace(/^-/, '').trim()))) continue;
    kept.push(b.text.replace(/\n+$/, ''));
  }
  if (!kept.length) continue;
  const stem = file.replace(/\.ya?ml$/, '');
  const target = `test/fixtures/upstream-${stem.startsWith('rules__') ? 'rules-' + stem.slice(7) : 'corpus-' + stem}.yml`;
  const header = `# Cases from upstream guessit's own test suite (guessit/test/${file.replace(/^rules__/, 'rules/').replace('__', '/')})\n`
    + `# that this port did not carry. Imported 2026-11-10 from guessit 4.5.1.\n`;
  writeFileSync(target, header + (defaultBlock ? defaultBlock + '\n\n' : '\n') + kept.join('\n\n') + '\n');
  console.log(`${target}: ${kept.length} blocks`);
  written++;
}
console.log(`wrote ${written} files`);
