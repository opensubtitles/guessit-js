import { test } from 'vitest';
import { guessit } from '../src/index.js';

test('analyze failures', () => {
  const testCases = [
    // Episode tests
    ['Game.of.Thrones.S05E07.HDTV.720p-KILLERS.mkv', { type: 'episode', season: 5, episode: 7 }],
    ['The.Flash.2014.S01E01.mkv', { type: 'episode', season: 1, episode: 1 }],
    // Movie tests  
    ['Divergent.2014.HDTV.720p.mkv', { type: 'movie', year: 2014 }],
    // Title tests
    ['The.Big.Bang.Theory.mkv', { title: 'The Big Bang Theory' }],
  ];
  
  for (const [input, expected] of testCases) {
    const result = guessit(input as string);
    console.log(`\nInput: ${input}`);
    console.log(`Result: ${JSON.stringify(result)}`);
    const exp = expected as Record<string, unknown>;
    for (const [k, v] of Object.entries(exp)) {
      const actual = result[k];
      const ok = JSON.stringify(actual) === JSON.stringify(v);
      console.log(`  ${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(actual)} ${ok ? '✓' : '✗'}`);
    }
  }
});
