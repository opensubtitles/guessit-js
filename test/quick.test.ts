import { test } from 'vitest';
import { guessit } from '../src/index.js';

test('quick checks', () => {
  const cases = [
    'Fear.and.Loathing.in.Las.Vegas.1998.mkv',
    'Fear and Loathing in Las Vegas (1998).mkv', 
    'The.Dark.Knight.2008.BluRay.1080p.x264-GROUP.mkv',
    'Taken.2008.FRENCH.720p.BluRay.x264-LOST.mkv',
    'Interstellar.2014.BluRay.1080p.DTS.x264-CHD.mkv',
  ];
  
  for (const c of cases) {
    const r = guessit(c);
    console.log(`\n"${c.substring(0,50)}"`);
    console.log(`  title=${JSON.stringify(r.title)} year=${JSON.stringify(r.year)} source=${JSON.stringify(r.source)}`);
    console.log(`  audio_codec=${JSON.stringify(r.audio_codec)} release_group=${JSON.stringify(r.release_group)}`);
  }
});
