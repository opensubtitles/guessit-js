/**
 * Word iteration — port of guessit/rules/common/words.py
 */
import { seps } from './index.js';

export interface Word {
  span: [number, number];
  value: string;
}

/** Yield individual words from a string, separated by `seps` characters. */
export function* iterWords(string: string): Generator<Word> {
  let start: number | null = null;
  for (let i = 0; i <= string.length; i++) {
    const ch = i < string.length ? string[i] : null;
    if (ch !== null && !seps.includes(ch)) {
      if (start === null) start = i;
    } else {
      if (start !== null) {
        yield { span: [start, i], value: string.slice(start, i) };
        start = null;
      }
    }
  }
}
