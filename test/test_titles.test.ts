import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';

describe('titles', () => {
  const cases = [
    'the.100.109.hdtv-lol.mp4',
    'The.100.S01E13.iNTERNAL.READNFO.720p.HDTV.x264-2HD',
    'Dr.LiNE.The.Lorax.2012.DVDRip.LiNE.XviD.AC3.HQ.Hive-CM8.mp4',
    'Naruto Shippuden Episode 366 VOSTFR.avi',
    '[Ayako]_Infinite_Stratos_-_IS_-_07_[H264][720p][EB7838FC]',
    '/movies/James_Bond-f21-Casino_Royale.mkv',
    '/movies/James_Bond-f21-Casino_Royale-x01-Becoming_Bond.mkv',
  ];
  cases.forEach(input => {
    it(input, () => { console.log(JSON.stringify(guessit(input))); });
  });
});
