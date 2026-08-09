/**
 * Comparators — port of guessit/rules/common/comparators.py
 */
import type { Match, Matches, _BaseMatches } from 'rebulk-js';

/**
 * Predicate for marker comparator — excludes private, proper_count, title, extension containers, and Rip other.
 */
export function markerComparatorPredicate(m: Match): boolean {
  return (
    !m.private &&
    m.name !== 'proper_count' &&
    m.name !== 'title' &&
    !(m.name === 'container' && m.tags?.includes('extension')) &&
    !(m.name === 'other' && m.value === 'Rip')
  );
}

/**
 * Compute weight of a marker: number of distinct match names inside it.
 */
function markerWeight(matches: _BaseMatches, marker: Match, predicate: (m: Match) => boolean): number {
  const rangeResult = (matches as Matches).range(marker.start, marker.end, predicate);
  const arr: Match[] = Array.isArray(rangeResult) ? rangeResult : rangeResult ? [rangeResult as Match] : [];
  const names = new Set(arr.map((m) => m.name));
  return names.size;
}

/**
 * Sort markers from most valuable (most distinct match types) to least.
 * Ties broken by rightmost position (later in path = preferred).
 * Mirrors Python guessit's marker_sorted / marker_comparator.
 */
export function markerSorted(
  markers: Iterable<Match>,
  matches: _BaseMatches,
  predicate: (m: Match) => boolean = markerComparatorPredicate,
): Match[] {
  const markersArr = [...markers];
  // Snapshot input order — Python's comparator indexes the ORIGINAL list; calling
  // indexOf on the array being sorted in place gives unstable garbage mid-sort.
  const originalIndex = new Map<Match, number>(markersArr.map((m, i) => [m, i]));
  return markersArr.sort((a, b) => {
    const weightDiff = markerWeight(matches, b, predicate) - markerWeight(matches, a, predicate);
    if (weightDiff !== 0) return weightDiff;
    // Give preference to rightmost (higher index in the input array = later in path)
    return (originalIndex.get(b) ?? 0) - (originalIndex.get(a) ?? 0);
  });
}
