import { test } from 'vitest';
import { guessit } from '../src/index.js';

test('S02E03 debug', () => {
  process.env.DEBUG_CONFLICT = '1';
  const r1 = guessit('Show.Name.S02E03.720p.WEBRip.x264');
  delete process.env.DEBUG_CONFLICT;
  console.log('S02E03:', JSON.stringify(r1));
});
