/**
 * Post/pre processors — port of guessit/rules/processors.py
 */
import { Rebulk } from 'rebulk-js';
import { Rule, CustomRule, AppendMatch, RemoveMatch, AppendTags } from 'rebulk-js';
import type { Match, Matches } from 'rebulk-js';
import type { Context } from 'rebulk-js';
import { PRE_PROCESS, POST_PROCESS } from 'rebulk-js';
import { sepsNoGroups } from './common/index.js';
import { cleanup } from './common/formatters.js';
import { markerSorted } from './common/comparators.js';
import { validYear } from './common/date.js';
import { iterWords } from './common/words.js';
import { Language } from '../language/index.js';

const LANG_KEYS = new Set(['language', 'subtitle_language']);

/** Check whether a match value represents the "undetermined" language placeholder. */
function isUndeterminedLang(match: Match): boolean {
  if (!LANG_KEYS.has(match.name ?? '')) return false;
  const v = match.value;
  if (v === 'und') return true;
  if (v && typeof v === 'object' && 'alpha3' in (v as Record<string, unknown>)) {
    return (v as { alpha3: string }).alpha3 === 'und';
  }
  return false;
}

/** Enlarge matches that start/end a group to include bracket characters. */
export class EnlargeGroupMatches extends CustomRule {
  static override priority = PRE_PROCESS;

  when(matches: Matches, _context: Context): [Match[], Match[]] | false {
    const starting: Match[] = [];
    const ending: Match[] = [];

    for (const group of matches.markers.named('group')) {
      for (const match of matches.starting(group.start + 1)) {
        starting.push(match);
      }
      for (const match of matches.ending(group.end - 1)) {
        ending.push(match);
      }
    }

    if (starting.length > 0 || ending.length > 0) return [starting, ending];
    return false;
  }

  then(matches: Matches, whenResponse: unknown, _context: Context): void {
    const [starting, ending] = whenResponse as [Match[], Match[]];
    for (const match of starting) {
      matches.remove(match);
      (match as unknown as { start: number }).start -= 1;
      (match as unknown as { rawStart: number }).rawStart += 1;
      matches.append(match);
    }
    for (const match of ending) {
      matches.remove(match);
      (match as unknown as { end: number }).end += 1;
      (match as unknown as { rawEnd: number }).rawEnd -= 1;
      matches.append(match);
    }
  }
}

function preferredString(value1: string, value2: string): string {
  if (value1 === value2) return value1;
  if (isTitleCase(value1) && !isTitleCase(value2)) return value1;
  if (!value1.toUpperCase().startsWith(value1) && value2 === value2.toUpperCase()) return value1;
  if (!value1.toUpperCase().startsWith(value1) && value1[0] === value1[0].toUpperCase() && value2[0] !== value2[0].toUpperCase()) return value1;
  if (countTitleWords(value1) > countTitleWords(value2)) return value1;
  return value2;
}

function isTitleCase(s: string): boolean {
  return s.split(' ').every(w => w.length === 0 || w[0] === w[0].toUpperCase());
}

function countTitleWords(value: string): number {
  let ret = 0;
  for (const word of iterWords(value)) {
    if (word.value[0] === word.value[0].toUpperCase() && word.value[0] !== word.value[0].toLowerCase()) ret++;
  }
  return ret;
}

/** Creates equivalent matches for holes that have the same value as an existing match. */
export class EquivalentHoles extends Rule {
  static priority = POST_PROCESS;
  static consequence = AppendMatch;

  when(matches: Matches, _context: Record<string, unknown>): Match[] {
    const newMatches: Match[] = [];

    for (const filepath of markerSorted(matches.markers.named('path'), matches)) {
      const holes = matches.holes(filepath.start, filepath.end, { formatter: cleanup }) as Match[];
      for (const name of matches.names) {
        const holesLeft = [...holes];
        for (const hole of [...holesLeft]) {
          for (const currentMatch of matches.named(name)) {
            if (typeof currentMatch.value === 'string' &&
                hole.value && typeof hole.value === 'string' &&
                hole.value.toLowerCase() === (currentMatch.value as string).toLowerCase()) {
              if (currentMatch.tags.includes('equivalent-ignore')) continue;
              const newValue = preferredString(hole.value as string, currentMatch.value as string);
              if (hole.value !== newValue) (hole as unknown as { value: unknown }).value = newValue;
              if (currentMatch.value !== newValue) (currentMatch as unknown as { value: unknown }).value = newValue;
              (hole as unknown as { name: string; tags: string[] }).name = name;
              (hole as unknown as { tags: string[] }).tags = ['equivalent'];
              newMatches.push(hole);
              const idx = holesLeft.indexOf(hole);
              if (idx > -1) holesLeft.splice(idx, 1);
            }
          }
        }
      }
    }
    return newMatches;
  }
}

/**
 * If multiple matches with same name and different values exist, keep the one
 * in the most valuable filepart and mark others for removal.
 */
export class RemoveAmbiguous extends Rule {
  static priority = POST_PROCESS;
  static consequence = RemoveMatch;

  protected sortFunction: (markers: Match[], matches: Matches) => Match[];
  protected predicate: ((m: Match) => boolean) | null;

  constructor(
    sortFn?: (markers: Match[], matches: Matches) => Match[],
    predicate?: (m: Match) => boolean,
  ) {
    super();
    this.sortFunction = sortFn ?? markerSorted;
    this.predicate = predicate ?? null;
  }

  when(matches: Matches, _context: Record<string, unknown>): Match[] {
    const fileparts = this.sortFunction(matches.markers.named('path'), matches);
    const previousFilepartsNames = new Set<string>();
    const values = new Map<string, unknown[]>();
    const toRemove: Match[] = [];

    for (const filepart of fileparts) {
      const filepartMatches = (this.predicate
        ? matches.range(filepart.start, filepart.end, this.predicate)
        : matches.range(filepart.start, filepart.end)) as Match[];

      const filepartNames = new Set<string>();
      for (const match of filepartMatches) {
        const matchName = match.name ?? '';
        filepartNames.add(matchName);
        if (previousFilepartsNames.has(matchName)) {
          const vals = values.get(matchName) ?? [];
          if (!vals.includes(match.value)) {
            // For episode_title, prefer the match from the filepart that
            // contains the SxxExx episode match (typically the filename).
            if (matchName === 'episode_title') {
              const hasSxxExx = (matches.range(filepart.start, filepart.end,
                (m: Match) => !m.private && (m.tags?.includes('SxxExx') ?? false), 0) as Match | undefined);
              if (hasSxxExx) {
                // This filepart has the episode match — prefer its episode_title.
                // Remove the previously registered episode_titles and keep this one.
                const oldEpTitles = (matches.named(matchName) as Match[]).filter(
                  (m: Match) => m.start < filepart.start || m.end > filepart.end
                );
                toRemove.push(...oldEpTitles);
                vals.length = 0;
                vals.push(match.value);
                values.set(matchName, vals);
                continue;
              }
            }
            // When a real language value appears in a secondary filepart,
            // and the primary filepart only registered "und" (undetermined),
            // keep the real value and remove the "und" matches instead.
            if (!isUndeterminedLang(match) && LANG_KEYS.has(matchName)) {
              const allUnd = vals.every(v =>
                v === 'und' || (v && typeof v === 'object' && 'alpha3' in (v as Record<string, unknown>) && (v as { alpha3: string }).alpha3 === 'und')
              );
              if (allUnd) {
                // Replace und values: remove existing und matches for this name and keep the new one
                const undMatches = toRemove.length > 0 ? [] :
                  (matches.named(matchName) as Match[]).filter((m: Match) => isUndeterminedLang(m));
                toRemove.push(...undMatches);
                vals.length = 0;
                vals.push(match.value);
                values.set(matchName, vals);
                continue;
              }
            }
            toRemove.push(match);
          }
        } else {
          const vals = values.get(matchName) ?? [];
          if (!vals.includes(match.value)) {
            vals.push(match.value);
            values.set(matchName, vals);
          }
        }
      }
      for (const n of filepartNames) previousFilepartsNames.add(n);
    }
    return toRemove;
  }
}

export class RemoveLessSpecificSeasonEpisode extends RemoveAmbiguous {
  constructor(name: string) {
    super(
      (markers, matches) => markerSorted(
        [...[...markers].reverse()],
        matches,
        (m: Match) => m.name === name && m.tags.includes('SxxExx'),
      ),
      (m: Match) => m.name === name,
    );
  }
}

/** If a season is a valid year and no year found, create a year match. */
export class SeasonYear extends Rule {
  static priority = POST_PROCESS;
  static consequence = AppendMatch;

  when(matches: Matches, _context: Record<string, unknown>): Match[] {
    const ret: Match[] = [];
    if (matches.named('year').length === 0) {
      for (const season of matches.named('season')) {
        if (typeof season.value === 'number' && validYear(season.value)) {
          const year = season.clone();
          (year as unknown as { name: string }).name = 'year';
          ret.push(year);
        }
      }
    }
    return ret;
  }
}

/** If year found, no season found, and episode found, create a season match. */
export class YearSeason extends Rule {
  static priority = POST_PROCESS;
  static consequence = AppendMatch;

  when(matches: Matches, _context: Record<string, unknown>): Match[] {
    const ret: Match[] = [];
    // Only trigger when there are strong (non-weak) episodes. Weak-episode matches
    // (bare 2-digit numbers) often coincide with title numbers like "21" or "12".
    const strongEpisodes = matches.named('episode').filter(
      (m: Match) => !m.tags.includes('weak-episode') && !m.tags.includes('weak-duplicate'),
    );
    if (matches.named('season').length === 0 && strongEpisodes.length > 0) {
      for (const year of matches.named('year')) {
        const season = year.clone();
        (season as unknown as { name: string }).name = 'season';
        ret.push(season);
      }
    }
    return ret;
  }
}

/** Empty rule for ordering post-processing. */
export class Processors extends Rule {
  static priority = POST_PROCESS;

  when(_matches: Matches, _context: Record<string, unknown>): false {
    return false;
  }
}

/** Strip separator characters from match boundaries. */
export class StripSeparators extends CustomRule {
  static override priority = POST_PROCESS;

  when(matches: Matches, _context: Context): Matches {
    return matches;
  }

  then(matches: Matches, _whenResponse: unknown, _context: Context): void {
    for (const match of matches) {
      const span = match.span;
      for (let i = 0; i < span[1] - span[0]; i++) {
        const raw = match.raw;
        if (raw && sepsNoGroups.includes(raw[0]) && (raw.length < 3 || !sepsNoGroups.includes(raw[2]))) {
          match.rawStart = match.rawStart + 1;
        } else break;
      }
      for (let i = span[1] - span[0] - 1; i >= 0; i--) {
        const raw = match.raw;
        if (raw && sepsNoGroups.includes(raw[raw.length - 1]) && (raw.length < 3 || !sepsNoGroups.includes(raw[raw.length - 3]))) {
          match.rawEnd = match.rawEnd - 1;
        } else break;
      }
    }
  }
}

/** Remove matches with invalid values (NaN, null, undefined, empty) after processing. */
class RemoveInvalidMatches extends CustomRule {
  static override priority = POST_PROCESS;

  when(matches: Matches): Match[] {
    const toRemove: Match[] = [];
    for (const match of matches) {
      if (match.value === null || match.value === undefined ||
          (typeof match.value === 'number' && isNaN(match.value)) ||
          match.value === '') {
        toRemove.push(match);
      }
    }
    return toRemove;
  }

  then(matches: Matches, whenResponse: unknown): void {
    const toRemove = whenResponse as Match[];
    for (const m of toRemove) {
      matches.remove(m);
    }
  }
}

export function processors(_config: Record<string, unknown>): Rebulk {
  return new Rebulk().rules(
    EnlargeGroupMatches,
    EquivalentHoles,
    new RemoveLessSpecificSeasonEpisode('season'),
    new RemoveLessSpecificSeasonEpisode('episode'),
    RemoveAmbiguous,
    SeasonYear,
    YearSeason,
    Processors,
    StripSeparators,
    RemoveInvalidMatches,
  );
}
