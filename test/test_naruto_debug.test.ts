import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';
import { rebulkBuilder } from '../src/rules/index.js';
import { loadConfig } from '../src/options.js';

describe('naruto_debug', () => {
  it('indexDict at Episode positions', () => {
    const config = loadConfig({});
    const advCfg = (config['advanced_config'] as any) ?? {};
    const rb = rebulkBuilder(advCfg as any);
    const input = 'Naruto Shippuden Episode 366 VOSTFR.avi';
    const matches = (rb as any).matches(input, {});
    const epStart = input.indexOf('Episode');
    const epEnd = epStart + 'Episode'.length;
    console.log(`"Episode" spans [${epStart},${epEnd})`);
    const idxDict = matches.indexDict;
    for (let i = epStart; i < epEnd; i++) {
      const atI = idxDict?.get(i) ?? [];
      if (atI.length > 0) console.log(`  [${i}]: ${atI.map((m:any) => `${m.name}@[${m.start},${m.end}) priv=${m.private}`).join(', ')}`);
      else console.log(`  [${i}]: (empty)`);
    }
    console.log('all matches:', matches.toArray().map((m:any) => `${m.name}=${m.value}@[${m.start},${m.end}) priv=${m.private}`).join(' | '));
    console.log('Result:', JSON.stringify(guessit(input)));
  });
});
