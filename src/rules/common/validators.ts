/**
 * Validators — port of guessit/rules/common/validators.py
 */
import { charsBefore, charsAfter } from 'rebulk-js';
import { seps } from './index.js';
import type { Match } from 'rebulk-js';

/**
 * A match that fills a whole bracket group is enlarged over the brackets by
 * `EnlargeGroupMatches`, so `start` lands on "(" and `rawStart` on the content.
 * `charsBefore` then reads the character in front of the bracket and a glued
 * neighbour looks like a missing separator — "abc(BluRay)" loses its source
 * entirely. The bracket is itself the delimiter, so an enlarged edge counts as
 * separated. Before that processor runs (pattern-time validation) raw and span
 * edges coincide and these read exactly as `charsBefore`/`charsAfter` do.
 */
const enlargedStart = (match: Match) => (match as { rawStart?: number }).rawStart !== undefined
  && (match as unknown as { rawStart: number }).rawStart > match.start;
const enlargedEnd = (match: Match) => (match as { rawEnd?: number }).rawEnd !== undefined
  && (match as unknown as { rawEnd: number }).rawEnd < match.end;

export const sepsBefore = (match: Match) => enlargedStart(match) || charsBefore(seps, match);
export const sepsAfter = (match: Match) => enlargedEnd(match) || charsAfter(seps, match);
export const sepsSurround = (match: Match) => sepsBefore(match) && sepsAfter(match);

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
