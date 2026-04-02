import { describe, it } from 'vitest';
import { rebulkBuilder } from '../src/rules/index.js';
import { loadConfig } from '../src/options.js';
import { Matches } from 'rebulk-js';

describe('naruto_debug2', () => {
  it('pre-rules matches', () => {
    const config = loadConfig({});
    const advCfg = (config['advanced_config'] as any) ?? {};
    const rb = rebulkBuilder(advCfg as any);
    const input = 'Naruto Shippuden Episode 366 VOSTFR.avi';
    const m = new Matches(null, input);
    (rb as any)._matchesPatterns(m, {});
    console.log('Pre-rules matches:');
    for (const match of m.toArray()) {
      console.log(`  ${match.name}=${match.value}@[${match.start},${match.end}) priv=${match.private}`);
    }
    const epStart = input.indexOf('Episode');
    const epEnd = epStart + 'Episode'.length;
    const idxDict = m.indexDict;
    console.log(`indexDict at "Episode"[${epStart},${epEnd}):`);
    for (let i = epStart; i < epEnd; i++) {
      const atI = idxDict?.get(i) ?? [];
      if (atI.length > 0) console.log(`  [${i}]: ${atI.map((x:any) => `${x.name}@[${x.start},${x.end}) priv=${x.private}`).join(', ')}`);
      else console.log(`  [${i}]: empty`);
    }
  });
});
