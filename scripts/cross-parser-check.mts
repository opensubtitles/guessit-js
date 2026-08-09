// Runs guessit-js against upstream guessit's cross-parser baseline — the 276 cases
// Python guessit admits failing vs anitomy/ptt/ptn/go-ptn/thcolin fixtures.
// Usage: clone guessit-io/guessit, build xp-cases.json (see docs/upstream-issues.md), then npx tsx scripts/cross-parser-check.mts
import { readFileSync, writeFileSync } from 'fs';
import { guessit } from './src/index.js';

const SP = '/private/tmp/claude-501/-Users-brano-Documents-data-www-opensubtitles-org-public-html-github-guessit-js/d37da71b-6c4a-4670-a4af-ce5078acaee1/scratchpad';
const cases = JSON.parse(readFileSync(SP + '/xp-cases.json', 'utf8'));
const norm = (v: any): any => {
  if (Array.isArray(v)) return v.map(norm);
  if (v && typeof v === 'object' && 'alpha3' in v) return String(v);
  return v;
};
let pass = 0, fail = 0;
const failures: any[] = [];
for (const [parser, entries] of Object.entries(cases) as any) {
  for (const [name, expected] of Object.entries(entries) as any) {
    let r: any;
    try { r = guessit(name); } catch { fail++; failures.push([parser, name, 'CRASH', '']); continue; }
    const bad: string[] = [];
    for (const [f, v] of Object.entries(expected) as any) {
      const got = norm(r[f]);
      if (JSON.stringify(got) !== JSON.stringify(v) && String(got) !== String(v)) bad.push(`${f}: want ${JSON.stringify(v)} got ${JSON.stringify(got)}`);
    }
    if (bad.length) { fail++; failures.push([parser, name, bad.join('; ')]); } else pass++;
  }
}
console.log(`guessit-js passes ${pass} / ${pass + fail} of the cases Python guessit fails`);
const byParser: any = {};
for (const [p] of failures) byParser[p] = (byParser[p] ?? 0) + 1;
console.log('remaining fails by corpus:', JSON.stringify(byParser));
writeFileSync(SP + '/xp-failures.json', JSON.stringify(failures, null, 1));
