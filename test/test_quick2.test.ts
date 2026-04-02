import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';

describe('quick', () => {
  const cases = [
    ['Movies/Brazil (1985)/Brazil_Criterion_Edition_(1985).CD2.avi', {title:'Brazil',cd:2}],
    ['Movies/[阿维达].Avida.2006.FRENCH.DVDRiP.XViD-PROD.avi', {title:'Avida'}],
    ['Movies/Picnic.at.Hanging.Rock.1975.Criterion.Collection.1080p.BluRay.x264.DTS-WiKi', {title:'Picnic at Hanging Rock'}],
    ['Battle Royale (2000)/Battle.Royale.(Batoru.Rowaiaru).(2000).(Special.Edition).CD1of2.DVDRiP.XviD-[ZeaL].avi', {type:'movie'}],
  ] as const;
  cases.forEach(([input, _exp]) => {
    it(String(input), () => {
      const r = guessit(input as string);
      console.log(JSON.stringify(r));
    });
  });
});
