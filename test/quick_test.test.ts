import { describe, it, expect } from 'vitest';
import { guessit } from '../src/api.js';

describe('quick tests', () => {
  it('KILLERS case', () => {
    const r = guessit('The.KILLERS.S05E07.HDTV.XviD-KILLERS');
    console.log('KILLERS:', JSON.stringify(r));
    expect(r.title).toBe('The KILLERS');
  });
  
  it('DashSeparated ordering debug', () => {
    const r = guessit('Movie.Title-KILLERS.avi');
    console.log('DashSep:', JSON.stringify(r));
  });
  
  it('streaming service as', () => {
    const r = guessit('Show.Name.S01E02.Nice.Title.720p.AdultSwim.WEBRip.AAC2.0.H.264-monkee');
    console.log('AdultSwim:', JSON.stringify(r));
  });
});
