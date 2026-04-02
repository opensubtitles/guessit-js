import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';

describe('ep_details', () => {
  it('Naruto', () => {
    const r = guessit('Naruto Shippuden Episode 366 VOSTFR.avi');
    console.log(JSON.stringify(r));
  });
  it('the100', () => {
    const r = guessit('the.100.109.hdtv-lol.mp4');
    console.log(JSON.stringify(r));
  });
  it('IS', () => {
    const r = guessit('[Ayako]_Infinite_Stratos_-_IS_-_07_[H264][720p][EB7838FC]');
    console.log(JSON.stringify(r));
  });
  it('JB', () => {
    const r = guessit('/movies/James_Bond-f21-Casino_Royale.mkv');
    console.log(JSON.stringify(r));
  });
});
