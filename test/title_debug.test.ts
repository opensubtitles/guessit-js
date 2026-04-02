import { test } from 'vitest';
import { defaultApi } from '../src/index.js';
import { Matches } from 'rebulk-js';

test('rule trace debug', () => {
  defaultApi.guessit('test.mkv'); // init
  const rb = (defaultApi as any)._rebulk;
  const input = 'Movies/Fear.and.Loathing.1998.1080p.BluRay.x264.mkv';
  
  // Monkey-patch append to trace when episode_title is set
  const origAppend = Matches.prototype.append;
  const origRemove = Matches.prototype.remove;
  
  const patchedAppend = function(this: any, match: any) {
    if (match?.name === 'episode_title') {
      console.log(`\n>>> APPEND episode_title="${match.value}" at [${match.start},${match.end}]`);
      console.trace();
    }
    if (match?.name === 'title') {
      console.log(`\n>>> APPEND title="${match.value}" at [${match.start},${match.end}]`);
    }
    return origAppend.call(this, match);
  };
  
  Matches.prototype.append = patchedAppend;
  
  const result = rb.matches(input);
  
  Matches.prototype.append = origAppend;
  
  console.log('\nFinal matches:');
  result.toArray().forEach((m: any) => console.log(` ${m.name}=${JSON.stringify(m.value)}`));
});
