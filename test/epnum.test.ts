import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';

describe('episode numbers', () => {
  it('cases', () => {
    const tests = [
      '[ISLAND]One_Piece_679_[VOSTFR]_[V1]_[8bit]_[720p]_[EB7838FC].mp4',
      'FooBar.307.PDTV-FlexGet',
      'FooBar.0307.PDTV-FlexGet',
      'One Piece - 102',
      'Show.Name.102.HDTV.XViD.Etc-Group',
      'FooBar 360 1080i',
      'Show Name - 722 [HD_1280x720].mp4',
      '24.S05E07.FRENCH.DVDRip.XviD-FiXi0N.avi',
    ];
    for (const t of tests) {
      const r = guessit(t);
      console.log(`${t} => episode=${JSON.stringify(r.episode)}, season=${JSON.stringify(r.season)}`);
    }
  });
});
