import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';
describe('rg debug', () => {
  it('tigole', () => {
    const r = guessit('Battle Royale 2000 DC (1080p Bluray x265 HEVC 10bit AAC 7.1 Japanese Tigole)') as any;
    console.log(`rg=${JSON.stringify(r.release_group)}`);
  });
});
