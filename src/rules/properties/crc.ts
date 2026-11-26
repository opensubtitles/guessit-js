/**
 * crc32 and uuid property — port of guessit/rules/properties/crc.py
 */
import { Rebulk } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import type { Match } from 'rebulk-js';

const DIGIT = 0;
const LETTER = 1;
const OTHER = 2;

const IDNUM_SOURCE = '[a-zA-Z0-9-]{20,}';

function guessIdnumber(str: string): Array<[number, number]> {
  const ret: Array<[number, number]> = [];
  const regex = new RegExp(IDNUM_SOURCE, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    const uuid = match[0];
    let switchCount = 0;
    let switchLetterCount = 0;
    let letterCount = 0;
    let lastLetter: string | null = null;
    let last = LETTER;

    for (const c of uuid) {
      let ci: number;
      if ('0123456789'.includes(c)) {
        ci = DIGIT;
      } else if (/[a-zA-Z]/.test(c)) {
        ci = LETTER;
        if (c !== lastLetter) switchLetterCount++;
        lastLetter = c;
        letterCount++;
      } else {
        ci = OTHER;
      }
      if (ci !== last) switchCount++;
      last = ci;
    }

    const switchRatio = switchCount / uuid.length;
    const lettersRatio = letterCount > 0 ? switchLetterCount / letterCount : 1;

    if (switchRatio > 0.4 && lettersRatio > 0.4) {
      // Skip matches that look like SxxExx episode patterns (e.g. "S01E01E07-FooBar-Group")
      if (/^[sS]\d+[eE]\d+/i.test(uuid)) continue;
      // A dash-joined release name is not an id: "grp-show-s05e03-720p-web",
      // "CZ-ENG-RUS-SK". Ids are random alphanumerics; a token of three or more
      // letters that are not all hex digits, an episode code or a resolution
      // marks words. A real uuid inside such a name is still caught by the
      // hex uuid pattern ("grok-video-147cbe03-9a5c-…").
      if (uuid.includes('-') && uuid.split('-').some((t) =>
        /^[a-z]{3,}$/i.test(t) && /[g-z]/i.test(t) ||
        /^s\d{1,4}(?:e|ep)\d{1,4}$/i.test(t) || /^\d{3,4}[pi]$/i.test(t))) continue;
      ret.push([match.index, match.index + uuid.length]);
    }
  }

  return ret;
}

export function crc(_config: Record<string, unknown>): Rebulk {
  const rebulk = new Rebulk({ disabled: (context: Record<string, unknown>) => isDisabled(context, 'crc32') });
  rebulk.regexDefaults({ flags: 'i' });
  rebulk.defaults({ validator: sepsSurround });

  rebulk.regex('(?:[a-fA-F]|[0-9]){8}', {
    name: 'crc32',
    conflictSolver: (_match: Match, other: Match) =>
      ['episode', 'season'].includes(other.name ?? '') ? other : '__default__',
  });

  rebulk.regex('[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', {
    name: 'uuid',
    validator: undefined,
    conflictSolver: (_match: Match, other: Match) =>
      ['episode', 'season', 'crc32'].includes(other.name ?? '') ? other : '__default__',
  });

  rebulk.functional(guessIdnumber, {
    name: 'uuid',
    conflictSolver: (_match: Match, other: Match) =>
      ['episode', 'season', 'crc32'].includes(other.name ?? '') ? other : '__default__',
  });

  return rebulk;
}
