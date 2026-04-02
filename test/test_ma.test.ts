import { describe, it } from 'vitest';
import { guessit } from '../src/index.js';

describe('ma test', () => {
  it('checks', () => {
    const cases = [
      '[Evil-Saizen]_Laughing_Salesman_14_[DVD][1C98686A].mkv',
      'Laughing_Salesman_14',
    ];
    for (const c of cases) {
      const r = guessit(c) as any;
      console.log(c, '=> audio_profile:', r.audio_profile, '| title:', r.title);
    }
  });
});
