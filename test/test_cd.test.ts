import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';

describe('cd', () => {
  const cases = [
    'Brazil_Criterion_Edition_(1985).CD2.avi',
    'Blade.Runner.(1982).(Director\'s.Cut).CD1.DVDRip.XviD.AC3-WAF.avi',
    'Battle.Royale.(2000).CD1of2.DVDRiP.XviD.avi',
  ];
  cases.forEach(input => {
    it(input, () => {
      const r = guessit(input);
      console.log(JSON.stringify(r));
    });
  });
});
