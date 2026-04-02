import { test } from 'vitest';
import { guessit } from '../src/index.js';
import { Matches } from 'rebulk-js';

test('audio channels debug', () => {
  const origRemove = (Matches.prototype as any).remove;
  (Matches.prototype as any).remove = function(match: any) {
    if (match.name === 'audio_channels') {
      console.log(`audio_channels REMOVED value="${match.value}" at [${match.start},${match.end}) tags=${JSON.stringify(match.tags)}`);
      console.log('  parent:', match.parent ? `${match.parent.name}@[${match.parent?.start},${match.parent?.end}) private=${match.parent?.private}` : 'none');
      console.log('  initiator:', `[${match.initiator?.start},${match.initiator?.end}) raw="${match.initiator?.raw}"`);
      const stack = new Error().stack?.split('\n').slice(1, 6).join('\n  ');
      console.log('  stack:', stack);
    }
    return origRemove.call(this, match);
  };

  process.env.DEBUG_CONFLICT = '1';
  const r = guessit('movie.DD5.1.x264.mkv');
  delete process.env.DEBUG_CONFLICT;
  console.log('Result:', JSON.stringify({audio_channels: r.audio_channels, video_codec: r.video_codec}));

  (Matches.prototype as any).remove = origRemove;
});
