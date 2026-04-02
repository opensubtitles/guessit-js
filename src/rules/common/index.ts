/**
 * Common constants and helpers — port of guessit/rules/common/__init__.py
 */

/** Characters that can act as separators between words/tokens. */
export const seps = ' [](){}+*|=-_~#/\\.,;:';

/** Separators without group brackets */
export const sepsNoGroups = seps.replace(/[\[\](){}]/g, '');

/** Separators without filesystem path characters */
export const sepsNoFs = seps.replace(/[/\\]/g, '');

/** Separators for title splitting */
export const titleSeps = '-+/\\|';

/** Escape a string for use in a regex character class. */
export function reEscape(s: string): string {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/** Pre-escaped `seps` safe for use in a regex character class `[sepsPattern]`. */
export const sepsPattern = reEscape(seps);

/** Pre-escaped `sepsNoGroups` safe for use in a regex character class. */
export const sepsNoGroupsPattern = reEscape(sepsNoGroups);

/** Strip all separator characters from a string. */
export function stripSeps(s: string): string {
  return s.replace(new RegExp(`[${sepsPattern}]`, 'g'), '');
}

/**
 * Abbreviation pair: literal `-` expands to a separator character class.
 * Used as: abbreviations=[dash] in regex_defaults.
 */
export const dash: [string, string] = ['-', '[' + reEscape(sepsNoFs) + ']'];
export const altDash: [string, string] = ['@', '[' + reEscape(sepsNoFs) + ']'];

/** Make a regex pattern optional. */
export function optional(pattern: string): string {
  return '(?:' + pattern + ')?';
}
