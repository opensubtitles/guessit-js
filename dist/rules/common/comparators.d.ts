import { Match, _BaseMatches } from 'rebulk-js';

/**
 * Predicate for marker comparator — excludes private, proper_count, title, extension containers, and Rip other.
 */
export declare function markerComparatorPredicate(m: Match): boolean;
/**
 * Sort markers from most valuable (most distinct match types) to least.
 * Ties broken by rightmost position (later in path = preferred).
 * Mirrors Python guessit's marker_sorted / marker_comparator.
 */
export declare function markerSorted(markers: Iterable<Match>, matches: _BaseMatches, predicate?: (m: Match) => boolean): Match[];
