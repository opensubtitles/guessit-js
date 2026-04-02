import { test } from 'vitest';
import { guessit } from '../src/index.js';
import { defaultApi } from '../src/index.js';
import { Matches } from 'rebulk-js';

test('trace KILLERS', () => {
  guessit('test.mkv'); // init
  const rb = (defaultApi as any)._rebulk;
  const input = 'Game.of.Thrones.S05E07.HDTV.720p-KILLERS.mkv';
  
  const origAppend = Matches.prototype.append;
  Matches.prototype.append = function(this: any, match: any) {
    if (String(match?.value) === 'KILLERS' || String(match?.value) === 'Game of Thrones') {
      console.log(`APPEND ${match.name}="${match.value}" at [${match.start},${match.end}]`);
      const stack = new Error().stack?.split('\n').slice(2,5).join('\n');
      console.log(stack);
    }
    return origAppend.call(this, match);
  };
  
  const result = rb.matches(input);
  Matches.prototype.append = origAppend;
  
  console.log('\nFinal:', result.toArray().map((m: any) => `${m.name}=${JSON.stringify(m.value)}`).join(', '));
});
