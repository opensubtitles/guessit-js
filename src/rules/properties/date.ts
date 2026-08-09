/**
 * Date property — port of guessit/rules/properties/date.py
 */
import { Rebulk } from 'rebulk-js';
import { Rule, RemoveMatch } from 'rebulk-js';
import type { Match, Matches } from 'rebulk-js';
import type { Context } from 'rebulk-js';
import { dash, seps } from '../common/index.js';
import { searchDate, validYear, validWeek } from '../common/date.js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import { buildOrPattern } from '../../reutils.js';

/**
 * Rule to keep only the marked year in the filepart (remove others).
 * Prioritizes grouped years over ungrouped.
 */
class KeepMarkedYearInFilepart extends Rule {
  static override priority = 64;
  override consequence = RemoveMatch;

  override enabled(context: Context): boolean {
    return !isDisabled(context, 'year');
  }

  override when(matches: Matches, _context: Context): Match[] {
    const ret: Match[] = [];
    const yearMatches = matches.named('year') as Match[] | Match | undefined;
    const yearArray = Array.isArray(yearMatches) ? yearMatches : yearMatches ? [yearMatches] : [];

    if (yearArray.length <= 1) return ret;

    // Get path markers
    const pathMarkers = matches.markers.named('path') as Match[] | Match | undefined;
    const pathArray = Array.isArray(pathMarkers) ? pathMarkers : pathMarkers ? [pathMarkers] : [];

    for (const filepart of pathArray) {
      const yearsInPart = matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === 'year',
      ) as Match[] | Match | undefined;
      const yearsInPartArray = Array.isArray(yearsInPart) ? yearsInPart : yearsInPart ? [yearsInPart] : [];

      if (yearsInPartArray.length <= 1) continue;

      const groupYears: Match[] = [];
      const ungroupYears: Match[] = [];

      for (const year of yearsInPartArray) {
        const groupMarker = matches.markers.atMatch(year, (m: Match) => m.name === 'group', 0) as Match | undefined;
        if (groupMarker) {
          groupYears.push(year);
        } else {
          ungroupYears.push(year);
        }
      }

      if (groupYears.length > 0 && ungroupYears.length > 0) {
        // Only remove ungrouped years that appear BEFORE the first grouped year
        // (they are likely part of the title). Ungrouped years after the grouped year
        // may be part of bonus_title or episode content.
        const firstGroupStart = groupYears[0].start;
        ret.push(...ungroupYears.filter((y: Match) => y.start < firstGroupStart));
        ret.push(...groupYears.slice(1));
      } else if (groupYears.length === 0) {
        ret.push(ungroupYears[0]);
        if (ungroupYears.length > 2) {
          ret.push(...ungroupYears.slice(2));
        }
      }
    }

    return ret;
  }
}

/**
 * Remove years inside group markers when a strong SxxExx episode pattern exists.
 * e.g. "feud.s01e05.and.the.winner.is.(the.oscars.of.1963)" — 1963 is episode content, not year.
 */
class RemoveGroupedYearWithSxxExx extends Rule {
  static override priority = 64;
  override consequence = RemoveMatch;

  override when(matches: Matches, _context: Context): Match[] {
    const ret: Match[] = [];
    const hasSxxExx = (matches.named('episode') as Match[]).some(
      (m: Match) => m.tags?.includes('SxxExx')
    );
    if (!hasSxxExx) return ret;

    for (const year of (matches.named('year') as Match[])) {
      const group = matches.markers.atMatch(year, (m: Match) => m.name === 'group', 0) as Match | undefined;
      if (!group) continue;
      // Only remove if the group contains significant non-year content
      // e.g. "(the.oscars.of.1963)" has lots of text, but "(2005)" is just a year
      const groupLen = group.end - group.start;
      const yearLen = year.end - year.start;
      if (groupLen - yearLen > 4) {
        // Group has significant content beyond the year - it's episode title content
        ret.push(year);
      }
    }
    return ret;
  }
}

/**
 * Create a rebulk pattern for date detection.
 */
export function date(config: Record<string, unknown>): Rebulk {
  const rebulk = new Rebulk().defaults({ validator: sepsSurround });

  // Year regex
  rebulk.regex('\\d{4}', {
    name: 'year',
    formatter: (s: string) => parseInt(s, 10),
    disabled: (context: Context) => isDisabled(context, 'year'),
    conflictSolver: (match, other) =>
      other.name === 'episode' || other.name === 'season'
        ? other.raw && match.raw && other.raw.length < match.raw.length
          ? other
          : '__default__'
        : '__default__',
    validator: (m: Match) => sepsSurround(m) && validYear(m.value as number),
  });

  // Week regex
  const weekWords = config['week_words'] as string[] | undefined;
  if (weekWords && weekWords.length > 0) {
    const weekPattern = buildOrPattern(weekWords) + '-?(\\d{1,2})';
    rebulk.regex(weekPattern, {
      name: 'week',
      formatter: (s: string) => parseInt(s.replace(/\D/g, ''), 10),
      children: true,
      flags: 'i',
      abbreviations: [dash],
      conflictSolver: (match, other) =>
        other.name === 'episode' || other.name === 'season'
          ? other.raw && match.raw && other.raw.length < match.raw.length
            ? other
            : '__default__'
          : '__default__',
      validator: (m: Match) => sepsSurround(m) && validWeek(m.value as number),
    });
  }

  // Date functional pattern
  const dateFunctional = (inputString: string, context?: Context) => {
    const result = searchDate(
      inputString,
      context?.['date_year_first'] as boolean | undefined,
      context?.['date_day_first'] as boolean | undefined,
    );
    if (result) {
      return [[result[0], result[1], { value: result[2] }]];
    }
    return [];
  };

  rebulk.functional(dateFunctional, {
    name: 'date',
    properties: { date: [null] },
    disabled: (context: Context) => isDisabled(context, 'date'),
    conflictSolver: (match, other) =>
      other.name === 'episode' || other.name === 'season' || other.name === 'crc32'
        ? other
        : '__default__',
  });

  rebulk.rules(KeepMarkedYearInFilepart, RemoveGroupedYearWithSxxExx, new AbsorbWeekdayPrefix((config['weekday_words'] as string[]) ?? []));
  return rebulk;
}

/**
 * Absorb a weekday word glued to a date into the date match (upstream #794).
 * "…S2025E01.Thu.2.Jan.2025.Mar.Menor.Spain…": "Thu" is the broadcast weekday, not
 * the title — growing the date span over it removes the bogus first title hole so
 * the real episode title after the date is reclaimed.
 */
class AbsorbWeekdayPrefix extends Rule {
  override consequence = RemoveMatch;
  private weekdayRe: RegExp;

  constructor(weekdayWords: string[]) {
    super();
    const sepsClass = '[' + seps.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ']';
    this.weekdayRe = new RegExp(
      '(?:^|' + sepsClass + ')(' + buildOrPattern(weekdayWords.length ? weekdayWords : ['\\bnever\\b']) + ')' + sepsClass + '*$',
      'i',
    );
  }

  enabled(context: any): boolean {
    return !isDisabled(context, 'date');
  }

  when(matches: any, _context: any): any {
    const input: string = matches.inputString ?? '';
    const ret: Array<[any, number]> = [];
    for (const dateMatch of matches.named('date') ?? []) {
      const filepart = matches.markers.atMatch(dateMatch, (m: any) => m.name === 'path', 0);
      const lower = filepart ? filepart.start : 0;
      const segment = input.slice(lower, dateMatch.start);
      const weekday = this.weekdayRe.exec(segment);
      if (!weekday) continue;
      const groupStart = lower + weekday.index + weekday[0].indexOf(weekday[1]);
      const claimed = matches.range(groupStart, dateMatch.start, (m: any) => !m.private) as any[];
      if ((Array.isArray(claimed) ? claimed.length : claimed ? 1 : 0) > 0) continue;
      ret.push([dateMatch, groupStart]);
    }
    return ret.length ? ret : false;
  }

  override then(matches: any, whenResponse: any, _context: any): void {
    for (const [dateMatch, newStart] of whenResponse as Array<[any, number]>) {
      matches.remove(dateMatch);
      dateMatch.start = newStart;
      matches.append(dateMatch);
    }
  }
}
