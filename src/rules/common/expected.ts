/**
 * Expected titles/groups — port of guessit/rules/common/expected.py
 */
import type { Context } from 'rebulk-js';
import type { MatchOptions } from 'rebulk-js';

/**
 * Build a functional pattern function that finds expected titles/groups in the string.
 * Mirrors Python's build_expected_function('expected_title').
 */
export function buildExpectedFunction(optionName: string) {
  return function findExpected(inputString: string, context?: Context): Array<[number, number, Partial<MatchOptions>]> {
    let expected = context?.[optionName] as string | string[] | undefined;
    if (!expected || (Array.isArray(expected) && expected.length === 0)) return [];
    // Normalise to array — a single string from CLI options (-T "title") must be wrapped
    if (typeof expected === 'string') expected = [expected];

    // Separator characters that can appear between words in a filename
    const SEP_CLASS = '[\\s._-]';

    const results: Array<[number, number, Partial<MatchOptions>]> = [];
    for (const title of expected) {
      let pattern: RegExp;

      // Support "re:" prefix for raw regex patterns (e.g. "re:my \\d+p show")
      if (title.startsWith('re:')) {
        const rawPattern = title.slice(3);
        try {
          pattern = new RegExp(rawPattern, 'gi');
        } catch {
          continue;
        }
      } else {
        // Build a flexible pattern: spaces and separators in expected titles can match
        // any separator character in the input (handles "OSS 117" matching "OSS_117").
        // Escape each word individually, then join with separator class.
        const parts = title.split(/[\s._-]+/).map(p => p.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&'));
        if (parts.length === 0) continue;
        // Require at least one separator character (or none) between words;
        // use word boundaries to prevent partial matches inside longer words.
        const patternStr = '(?<![a-zA-Z0-9])' + parts.join(`${SEP_CLASS}?`) + '(?![a-zA-Z0-9])';
        try {
          pattern = new RegExp(patternStr, 'gi');
        } catch {
          // Fallback to literal matching if regex construction fails
          const literalPat = title.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
          try {
            pattern = new RegExp(literalPat, 'gi');
          } catch {
            continue;
          }
        }
      }
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(inputString)) !== null) {
        results.push([m.index, m.index + m[0].length, {}]);
        // Prevent infinite loop on zero-length matches
        if (m[0].length === 0) break;
      }
    }
    return results;
  };
}
