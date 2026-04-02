/**
 * Path markers — port of guessit/rules/markers/path.py
 */
import { Rebulk } from 'rebulk-js';
import { findAll } from 'rebulk-js';

export function path(config: Record<string, unknown>): Rebulk {
  const rebulk = new Rebulk();
  rebulk.defaults({ name: 'path', marker: true });

  function markPath(inputString: string, context?: Record<string, unknown>): Array<[number, number]> {
    if (context?.['name_only']) {
      return [[0, inputString.length]];
    }

    const indices: number[] = [
      ...findAll(inputString, '/'),
      ...findAll(inputString, '\\'),
      -1,
      inputString.length,
    ];
    indices.sort((a, b) => a - b);

    const ret: Array<[number, number]> = [];
    for (let i = 0; i < indices.length - 1; i++) {
      ret.push([indices[i] + 1, indices[i + 1]]);
    }
    return ret;
  }

  rebulk.functional(markPath);
  return rebulk;
}
