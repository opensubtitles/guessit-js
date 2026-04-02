import { it } from 'vitest';
import { guessit } from '../src/index.js';
it('source tests', () => {
  process.env.DEBUG_CONFLICT = '1';
  const r1 = guessit('Name.BDMux.720p');
  console.log('BDMux:', JSON.stringify(r1));
});
