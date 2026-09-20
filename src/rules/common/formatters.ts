/**
 * Common formatters — port of guessit/rules/common/formatters.py
 */
import { seps } from './index.js';
import { formatters as composeFormatters } from 'rebulk-js';
import { DIACRITIC_FOLD } from './diacritics.js';

/**
 * Strip diacritics from a string, reproducing V8's
 *   s.normalize('NFD').replace(/[̀-ͯ]/g, '')
 * for every accented letter in every script (Latin, Greek, Cyrillic, Vietnamese,
 * …) WITHOUT calling `String.prototype.normalize` — QuickJS (the runtime Javy
 * compiles to WASM) doesn't implement `normalize` at all, so relying on it would
 * make the WASM build diverge from the JS build on any accented title (e.g.
 * "Hôtel", "Rêves", "Ολυμπιάδα"). The folding table in `./diacritics.ts` is
 * generated from V8's NFD (scripts/gen-diacritics.mjs), so both engines fold
 * identically. The trailing regex also removes any already-decomposed standalone
 * combining marks (U+0300–U+036F), which works in both engines.
 */
export function foldDiacritics(input: string): string {
  let out = '';
  for (const ch of input) out += DIACRITIC_FOLD[ch] ?? ch;
  return out.replace(/[̀-ͯ]/g, '');
}

// Characters excluded from cleanup stripping (we keep them inside)
const EXCLUDED_CLEAN_CHARS = new Set([',', ':', ';', '-', '/', '\\']);
const cleanChars = seps.split('').filter(c => !EXCLUDED_CLEAN_CHARS.has(c)).join('');

function potentialBefore(i: number, inputString: string): boolean {
  return (
    i - 1 >= 0 &&
    seps.includes(inputString[i]) &&
    (i - 2 < 0 || seps.includes(inputString[i - 2])) &&
    !seps.includes(inputString[i - 1])
  );
}

function potentialAfter(i: number, inputString: string): boolean {
  return (
    i + 2 >= inputString.length ||
    (inputString[i + 2] === inputString[i] && !seps.includes(inputString[i + 1]))
  );
}

/**
 * Remove and strip separators from inputString (but keep ',;' characters).
 * Also keeps separators for single characters (e.g., S.H.I.E.L.D.).
 */
export function cleanup(inputString: string): string {
  if (!inputString) return inputString;

  // Replace clean chars with spaces
  let cleanString = inputString;
  for (const char of cleanChars) {
    cleanString = cleanString.split(char).join(' ');
  }

  // Find indices where separators remain
  const indices: number[] = [];
  for (let i = 0; i < cleanString.length; i++) {
    if (seps.includes(cleanString[i])) indices.push(i);
  }

  const dots = new Set<string>();
  if (indices.length > 0) {
    const cleanList = cleanString.split('');

    const potentialIndices: number[] = [];
    for (const i of indices) {
      if (potentialBefore(i, inputString) && potentialAfter(i, inputString)) {
        potentialIndices.push(i);
      }
    }

    const replaceIndices: number[] = [];
    for (const pi of potentialIndices) {
      if (potentialIndices.includes(pi - 2) || potentialIndices.includes(pi + 2)) {
        replaceIndices.push(pi);
      }
    }

    if (replaceIndices.length > 0) {
      for (const ri of replaceIndices) {
        dots.add(inputString[ri]);
        cleanList[ri] = inputString[ri];
      }
      cleanString = cleanList.join('');
    }
  }

  // A dotted version run trailing a title is one token ("Evangelion.3.0.1.11").
  // The acronym rule above only keeps a separator between single characters, so
  // the ".11" tail would be split off; restore every dot inside the run
  // (upstream #963). A run that opens the value is the title itself and keeps
  // Python's spelling — the show "11.22.63" is titled "11 22 63".
  const versionDots: number[] = [];
  const versionPattern = /\d+(?:\.\d+){2,}/g;
  let versionMatch: RegExpExecArray | null;
  while ((versionMatch = versionPattern.exec(inputString)) !== null) {
    if (!/[^\s._-]/.test(inputString.slice(0, versionMatch.index))) continue;
    for (let i = versionMatch.index; i < versionMatch.index + versionMatch[0].length; i++) {
      if (inputString[i] === '.') versionDots.push(i);
    }
  }
  if (versionDots.length > 0) {
    const cleanList = cleanString.split('');
    for (const i of versionDots) cleanList[i] = '.';
    dots.add('.');
    cleanString = cleanList.join('');
  }

  // Strip surrounding separators (except preserved dots)
  const stripChars = seps.split('').filter(c => !dots.has(c)).join('');
  cleanString = strip(cleanString, stripChars);

  // A decimal version at the end of a title ("Jackass.2.5.", "M3GAN.2.0.")
  // keeps its inner dot through the acronym rule above, but the trailing
  // separator is just the gap to the next property — drop it. Real acronyms
  // ("S.H.I.E.L.D.") end in a letter, so they are untouched (upstream #963).
  if (/(?:^|[ ])\d+\.\d+\.$/.test(cleanString)) {
    cleanString = cleanString.slice(0, -1);
  }

  // Collapse multiple spaces
  cleanString = cleanString.replace(/ +/g, ' ');
  return cleanString;
}

/**
 * Strip separator characters from both ends of the string.
 */
export function strip(inputString: string, chars: string = seps): string {
  let start = 0;
  let end = inputString.length;
  while (start < end && chars.includes(inputString[start])) start++;
  while (end > start && chars.includes(inputString[end - 1])) end--;
  return inputString.slice(start, end);
}

/**
 * Cleanup a raw value to perform raw comparison.
 */
export function rawCleanup(raw: string): string {
  return composeFormatters(cleanup, strip)(raw.toLowerCase()) as string;
}

/**
 * Reorder the title by moving a trailing article to the front.
 * "The Dark Knight, The" → "The Dark Knight"
 * Also handles moving leading article to end: not the primary direction in Python.
 * Python's reorder_title moves "title, the" patterns to canonical form.
 */
export function reorderTitle(
  title: string,
  articles: string[] = ['the'],
  separators: string[] = [', ', ','],
): string {
  const ltitle = title.toLowerCase();
  for (const article of articles) {
    for (const separator of separators) {
      const suffix = separator + article;
      if (ltitle.endsWith(suffix)) {
        return title.slice(title.length - suffix.length + separator.length) + ' ' + title.slice(0, title.length - suffix.length);
      }
    }
  }
  return title;
}
