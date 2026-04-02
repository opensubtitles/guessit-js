/**
 * Common formatters — port of guessit/rules/common/formatters.py
 */
import { seps } from './index.js';
import { formatters as composeFormatters } from 'rebulk-js';

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

  // Strip surrounding separators (except preserved dots)
  const stripChars = seps.split('').filter(c => !dots.has(c)).join('');
  cleanString = strip(cleanString, stripChars);

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
