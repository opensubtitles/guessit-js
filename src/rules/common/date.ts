/**
 * Date utilities — port of guessit/rules/common/date.py
 */

const DSEP = '[-/ .]';
const DSEP_BIS = '[-/ .x]';

const DATE_REGEXPS: RegExp[] = [
  new RegExp(`${DSEP}((\\d{8}))${DSEP}`, 'i'),
  new RegExp(`${DSEP}((\\d{6}))${DSEP}`, 'i'),
  new RegExp(`(?:^|[^\\d])((\\d{2})${DSEP}(\\d{1,2})${DSEP}(\\d{1,2}))(?:$|[^\\d])`, 'i'),
  new RegExp(`(?:^|[^\\d])((\\d{1,2})${DSEP}(\\d{1,2})${DSEP}(\\d{2}))(?:$|[^\\d])`, 'i'),
  new RegExp(`(?:^|[^\\d])((\\d{4})${DSEP_BIS}(\\d{1,2})${DSEP}(\\d{1,2}))(?:$|[^\\d])`, 'i'),
  new RegExp(`(?:^|[^\\d])((\\d{1,2})${DSEP}(\\d{1,2})${DSEP_BIS}(\\d{4}))(?:$|[^\\d])`, 'i'),
  new RegExp(`(?:^|[^\\d])((\\d{1,2}(?:st|nd|rd|th)?${DSEP}(?:[a-z]{3,10})${DSEP}\\d{4}))(?:$|[^\\d])`, 'i'),
];

export function validYear(year: number): boolean {
  return year >= 1920 && year < 2035;
}

export function validWeek(week: number): boolean {
  return week >= 1 && week < 53;
}

function isInt(s: string): boolean {
  return !isNaN(parseInt(s, 10)) && String(parseInt(s, 10)) === s.replace(/^0+/, '') || s === '0';
}

function guessDayFirst(groups: string[]): boolean | undefined {
  const first = groups[0];
  const last = groups[groups.length - 1];
  if (isInt(first) && validYear(parseInt(first.slice(0, 4), 10))) return false;
  if (isInt(last) && validYear(parseInt(last.slice(-4), 10))) return true;
  if (isInt(first) && parseInt(first.slice(0, 2), 10) > 31) return false;
  if (isInt(last) && parseInt(last.slice(-2), 10) > 31) return true;
  return undefined;
}

function tryParseDate(
  match: string,
  groups: string[],
  yearFirst?: boolean,
  dayFirst?: boolean,
): Date | undefined {
  // Normalize the match string: replace separators with '-'
  const normalized = match.replace(/[-/ .x]/g, '-');
  const parts = normalized.split('-').filter(Boolean);

  const yearFirstOpts = yearFirst !== undefined ? [yearFirst] : [false, true];
  const dayFirstOpts = dayFirst !== undefined ? [dayFirst] : [true, false];

  for (const yf of yearFirstOpts) {
    for (const df of dayFirstOpts) {
      let year: number, month: number, day: number;

      if (parts.length === 1) {
        // yyyymmdd or yymmdd
        const s = parts[0];
        if (s.length === 8) {
          year = parseInt(s.slice(0, 4), 10);
          month = parseInt(s.slice(4, 6), 10);
          day = parseInt(s.slice(6, 8), 10);
        } else if (s.length === 6) {
          // yymmdd
          const yy = parseInt(s.slice(0, 2), 10);
          year = yy > 50 ? 1900 + yy : 2000 + yy;
          month = parseInt(s.slice(2, 4), 10);
          day = parseInt(s.slice(4, 6), 10);
        } else {
          continue;
        }
      } else if (parts.length === 3) {
        const p = parts.map(Number);
        if (yf) {
          [year, month, day] = df ? [p[0], p[2], p[1]] : [p[0], p[1], p[2]];
          // Convert 2-digit year
          if (!validYear(year) && year < 100) {
            year = year > 50 ? 1900 + year : 2000 + year;
          }
        } else {
          // year is the 4-digit one, or the last part
          const longIdx = p.findIndex((n, i) => parts[i].length === 4 && validYear(n));
          if (longIdx === 0) {
            [year, month, day] = df ? [p[0], p[2], p[1]] : [p[0], p[1], p[2]];
          } else if (longIdx === 2) {
            [year, month, day] = df ? [p[2], p[1], p[0]] : [p[2], p[0], p[1]];
          } else {
            // 2-digit year
            if (df) {
              [day, month, year] = yf ? [p[2], p[1], p[0]] : [p[0], p[1], p[2]];
            } else {
              [month, day, year] = yf ? [p[2], p[0], p[1]] : [p[0], p[1], p[2]];
            }
            const yy = year > 100 ? year : (year > 50 ? 1900 + year : 2000 + year);
            year = yy;
          }
        }
      } else {
        continue;
      }

      if (month < 1 || month > 12) continue;
      if (day < 1 || day > 31) continue;
      if (!validYear(year)) continue;

      try {
        // Use UTC to avoid local-timezone offsets shifting the date when serialized to ISO string.
        const ts = Date.UTC(year, month - 1, day);
        const date = new Date(ts);
        if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
          return date;
        }
      } catch {
        // invalid date
      }
    }
  }
  return undefined;
}

export function searchDate(
  string: string,
  yearFirst?: boolean,
  dayFirst?: boolean,
): [number, number, Date] | undefined {
  for (const dateRe of DATE_REGEXPS) {
    const globalRe = new RegExp(dateRe.source, dateRe.flags.includes('g') ? dateRe.flags : dateRe.flags + 'g');
    let m: RegExpExecArray | null;
    globalRe.lastIndex = 0;
    while ((m = globalRe.exec(string)) !== null) {
      if (!m[1]) continue;
      const start = m.index + m[0].indexOf(m[1]);
      const end = start + m[1].length;
      const groups = m.slice(2).filter(Boolean);
      const matchStr = m[1];

      let dfGuess = dayFirst;
      if (yearFirst && dfGuess === undefined) dfGuess = false;
      const dfGuessWasExplicit = dfGuess !== undefined;
      if (!dfGuessWasExplicit && groups.length > 0) {
        dfGuess = guessDayFirst(groups);
      }

      // Try guessed day-first setting first. If it fails (e.g., month > 12),
      // fall back to the opposite setting so ambiguous dates like "03-29-2012"
      // are correctly resolved even when the heuristic guesses wrong.
      const dfOptions: Array<boolean | undefined> = dfGuess !== undefined
        ? (dfGuessWasExplicit ? [dfGuess] : [dfGuess, !dfGuess])
        : [undefined];

      let date: Date | undefined;
      for (const df of dfOptions) {
        date = tryParseDate(matchStr, groups, yearFirst, df);
        if (date && validYear(date.getUTCFullYear())) break;
      }
      if (date && validYear(date.getUTCFullYear())) {
        return [start, end, date];
      }
    }
  }
  return undefined;
}
