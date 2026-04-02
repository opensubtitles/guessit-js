import { it } from 'vitest';
import { guessit } from '../src/index.js';
import { Matches } from 'rebulk-js';
const origBuildMatcherResults = Matches.prototype.append;
it('360p test', () => {
  const r = guessit('FooBar 360');
  // Check if screen_size was ever in matches
  console.log('FooBar 360 result:', JSON.stringify(r));
  // Try with explicit screen_size
  const r2 = guessit('FooBar 360p');
  console.log('FooBar 360p result:', JSON.stringify(r2));
});
