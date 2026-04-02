import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';

describe('bdmux', () => {
  it('patterns', () => {
    const tests = [
      'Name.BDMux.720p',
      'Name.BRMux.720p',
      'Name.BDRipMux.720p',
      'Name.BRRipMux.720p',
    ];
    for (const t of tests) {
      const r = guessit(t);
      console.log(`${t} => source=${JSON.stringify(r.source)}, other=${JSON.stringify(r.other)}`);
    }
  });
});
