/**
 * Validators — port of guessit/rules/common/validators.py
 */
import { charsBefore, charsAfter, charsSurround } from 'rebulk-js';
import { seps } from './index.js';
import type { Match } from 'rebulk-js';

export const sepsBefore = (match: Match) => charsBefore(seps, match);
export const sepsAfter = (match: Match) => charsAfter(seps, match);
export const sepsSurround = (match: Match) => charsSurround(seps, match);

export function intCoercable(string: string): boolean {
  // Matches Python's int() behaviour: the ENTIRE string must be a valid integer.
  // parseInt('720p') returns 720 in JS but int('720p') raises ValueError in Python.
  // Use Number() which returns NaN for '720p', matching Python semantics.
  const n = Number(string.trim());
  return Number.isInteger(n);
}

export function and_(...validators: ((m: Match) => boolean)[]): (m: Match) => boolean {
  return (m) => validators.every((v) => v(m));
}

export function or_(...validators: ((m: Match) => boolean)[]): (m: Match) => boolean {
  return (m) => validators.some((v) => v(m));
}
