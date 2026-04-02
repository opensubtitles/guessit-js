import { it } from 'vitest';
import { guessit } from '../src/index.js';
it('date tests', () => {
  const r1 = guessit('Date.Show.03-29-2012.HDTV.XViD-FlexGet');
  console.log('date show:', JSON.stringify(r1.date));
  const r2 = guessit('Movies/The Doors (1991)/08.03.09.The.Doors.(1991).BDRip.720p.AC3.X264-HiS.mkv');
  console.log('the doors:', JSON.stringify(r2.date));
});
