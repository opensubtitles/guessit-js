/**
 * Group markers (...), [...] and {...} — port of guessit/rules/markers/groups.py
 */
import { Rebulk } from 'rebulk-js';

export class ConfigurationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationException';
  }
}

export function groups(config: { starting: string; ending: string }): Rebulk {
  const rebulk = new Rebulk();
  rebulk.defaults({ name: 'group', marker: true });

  const { starting, ending } = config;

  if (starting.length !== ending.length) {
    throw new ConfigurationException('Starting and ending groups must have the same length');
  }

  function markGroups(inputString: string): Array<[number, number]> {
    // One stack per bracket type
    const openings: number[][] = Array.from({ length: starting.length }, () => []);
    const ret: Array<[number, number]> = [];

    for (let i = 0; i < inputString.length; i++) {
      const ch = inputString[i];

      const startType = starting.indexOf(ch);
      if (startType > -1) {
        openings[startType].push(i);
      }

      const endType = ending.indexOf(ch);
      if (endType > -1) {
        const stack = openings[endType];
        if (stack.length > 0) {
          const startIndex = stack.pop()!;
          // 「」 are also Japanese quotation marks: glued to text on both outer sides
          // ("出会い 「星」の名を持つ少年" → the 「星」 is a quoted word inside the title),
          // they are not a bracket group.
          if (ch === '」') {
            const before = inputString[startIndex - 1];
            const after = inputString[i + 1];
            const glued = (c: string | undefined) => c !== undefined && !/[\s._\-\[\](){}【】（）+]/.test(c);
            if (glued(after) || (glued(before) && after !== undefined)) continue;
          }
          ret.push([startIndex, i + 1]);
        }
      }
    }
    return ret;
  }

  rebulk.functional(markGroups);
  return rebulk;
}
