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

    // " / " with whitespace on both sides separates alternative titles and info fields
    // ("Six Feet Under / Season: 2 / Episodes: 1-13 of 13 [2002, …]", tracker naming), not folders.
    // Exception: inside a bracket of a name that opens with a bracketed group, where the
    // titles themselves are bracketed ("【Grp】[中文名 / Romaji Title][07]"): there the last
    // part is the romaji title, as with the plain split.
    const animeBracketed = /^\s*[[【]/.test(inputString);
    const inBracket = (i: number) => {
      const open = Math.max(inputString.lastIndexOf('[', i), inputString.lastIndexOf('【', i));
      const close = Math.max(inputString.lastIndexOf(']', i), inputString.lastIndexOf('】', i));
      return open > close;
    };
    // Same style, unbracketed: "[Grp] 青之箱 第二季 / Ao no Hako S2 [05]" still splits when a
    // non-Latin title is followed by a Latin one, so the romaji title wins as before.
    const latin = (t: string) => (t.match(/\p{Script=Latin}/gu)?.length ?? 0) * 2 > (t.match(/\p{L}/gu)?.length ?? 0);
    // Only while every title before it is non-Latin: "Swallowed Star / 吞噬星空 / Tunshi Xingkong"
    // keeps its first, Latin, title.
    const toLatin = (i: number) => {
      const before = inputString.slice(0, i).split(/[\]】]/).pop() ?? '';
      const after = inputString.slice(i + 1).split(/[[【/]|\s-\s/)[0] ?? '';
      return before.split('/').every((t) => !latin(t)) && latin(after);
    };
    // A "/" inside parentheses is a list, not a folder: "I Am Sam (2001 ITA/ENG) [1080p]".
    const inParens = (i: number) => inputString.lastIndexOf('(', i) > inputString.lastIndexOf(')', i);
    const isSep = (i: number) => (!(/\s/.test(inputString[i - 1] ?? '') && /\s/.test(inputString[i + 1] ?? '')) ||
      (animeBracketed && (inBracket(i) || toLatin(i)))) && !inParens(i);
    const indices: number[] = [
      ...[...findAll(inputString, '/')].filter(isSep),
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
