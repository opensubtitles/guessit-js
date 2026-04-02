/**
 * Common constants and helpers — port of guessit/rules/common/__init__.py
 */
/** Characters that can act as separators between words/tokens. */
export declare const seps = " [](){}+*|=-_~#/\\.,;:";
/** Separators without group brackets */
export declare const sepsNoGroups: string;
/** Separators without filesystem path characters */
export declare const sepsNoFs: string;
/** Separators for title splitting */
export declare const titleSeps = "-+/\\|";
/** Escape a string for use in a regex character class. */
export declare function reEscape(s: string): string;
/** Pre-escaped `seps` safe for use in a regex character class `[sepsPattern]`. */
export declare const sepsPattern: string;
/** Pre-escaped `sepsNoGroups` safe for use in a regex character class. */
export declare const sepsNoGroupsPattern: string;
/** Strip all separator characters from a string. */
export declare function stripSeps(s: string): string;
/**
 * Abbreviation pair: literal `-` expands to a separator character class.
 * Used as: abbreviations=[dash] in regex_defaults.
 */
export declare const dash: [string, string];
export declare const altDash: [string, string];
/** Make a regex pattern optional. */
export declare function optional(pattern: string): string;
