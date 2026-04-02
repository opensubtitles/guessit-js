import { test } from 'vitest';
import { guessit } from '../src/index.js';
test('debug fear and loathing', () => {
  const r = guessit('Fear.and.Loathing.in.Las.Vegas.720p.HDDVD.DTS.x264-ESiR.mkv');
  console.log(JSON.stringify(r, null, 2));
});
