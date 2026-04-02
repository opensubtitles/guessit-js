import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';
import { Matches } from 'rebulk-js';

// Patch remove to log episode removals
const origRemove = Matches.prototype.remove;
Matches.prototype.remove = function(matches: any) {
  const arr = Array.isArray(matches) ? matches : [matches];
  for (const m of arr) {
    if ((m as any).name === 'episode') {
      console.log(`REMOVE episode=${(m as any).value} @[${(m as any).start},${(m as any).end}) tags=${JSON.stringify((m as any).tags)} initLen=${(m as any).initiator?.length} raw="${(m as any).raw}"`);
    }
  }
  return origRemove.call(this, matches);
};

describe('679', () => {
  it('episode 679', () => {
    process.env.DEBUG_CONFLICT = '1';
    const r = guessit('[ISLAND]One_Piece_679_[VOSTFR]_[V1]_[8bit]_[720p]_[EB7838FC].mp4');
    console.log('result episode:', JSON.stringify(r.episode));
  });
});
