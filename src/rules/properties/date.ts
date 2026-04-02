/**
 * Date property — port of guessit/rules/properties/date.py
 */
import { Rebulk } from 'rebulk-js';
import { Rule, RemoveMatch } from 'rebulk-js';
import type { Match, Matches } from 'rebulk-js';
import type { Context } from 'rebulk-js';
import { dash } from '../common/index.js';
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

  rebulk.rules(KeepMarkedYearInFilepart);
  return rebulk;
}
