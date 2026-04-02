/**
 * Title property — port of guessit/rules/properties/title.py
 */
import { Rebulk } from 'rebulk-js';
import { Rule, AppendMatch, RemoveMatch, AppendTags } from 'rebulk-js';
import { Match, type Matches } from 'rebulk-js';
import type { Context } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import { cleanup, reorderTitle } from '../common/formatters.js';
import { markerSorted } from '../common/comparators.js';
import { buildExpectedFunction } from '../common/expected.js';
import { formatters } from 'rebulk-js';
import { titleSeps, seps } from '../common/index.js';

/** Helper: truthy check for match result (handles empty arrays correctly) */
function hasmatch(result: Match[] | Match | undefined): boolean {
  if (result === null || result === undefined) return false;
  if (Array.isArray(result)) return result.length > 0;
  return true;
}

/**
 * Base class for title rules.
 */
abstract class TitleBaseRule extends Rule {
  static override priority = 0;
  // dependency is inherited from Rule (not overridden here to allow subclasses to set string arrays)
  static override properties: Record<string, unknown[]> = {};

  override consequence = [AppendMatch, RemoveMatch];
  matchName: string;
  propertyName: string;
  alternativePropertyName: string;

  constructor(
    matchName: string,
    propertyNames: string[],
    alternativePropertyName: string,
  ) {
    super();
    this.matchName = matchName;
    this.propertyName = propertyNames[0] ?? 'title';
    this.alternativePropertyName = alternativePropertyName;
  }

  /**
   * Filter predicate for holes.
   */
  protected holeFilter(_hole: Match): boolean {
    return true;
  }

  /**
   * Filter predicate for fileparts.
   */
  protected filepartFilter(_filepart: Match): boolean {
    return true;
  }

  /**
   * Process holes: crop by group markers, skip markers spanning entire path.
   */
  protected holesProcess(holes: Match[], matches: Matches, filepart: Match): Match[] {
    const groupMarkers = matches.markers.named('group') as Match[] | Match | undefined;
    const groupArray = Array.isArray(groupMarkers)
      ? groupMarkers
      : groupMarkers
        ? [groupMarkers]
        : [];

    // Filter to groups within filepart
    const relevantGroups = groupArray.filter((g) => g.start >= filepart.start && g.end <= filepart.end);

    // Skip groups that span the entire filepart
    const filteredGroups = relevantGroups.filter((g) => !(g.start === filepart.start && g.end === filepart.end));

    const ret: Match[] = [];
    for (const hole of holes) {
      // Crop hole by filtered group markers
      const cropped = hole.crop(filteredGroups);
      if (!cropped) continue;
      if (Array.isArray(cropped)) {
        ret.push(...cropped);
      } else {
        ret.push(cropped);
      }
    }
    return ret;
  }

  /**
   * Determine if a match should be ignored (e.g., language, country).
   */
  protected isIgnored(match: Match): boolean {
    return match.name === 'language' || match.name === 'country' || match.name === 'episode_details';
  }

  /**
   * Determine if we should keep a hole boundary (don't trim this side).
   * Returns false (allow trimming) only when the ignored match spans the entire hole edge
   * with no remaining title content — i.e., it's a pure language/country/episode_details hole.
   * Mirrors Python TitleBaseRule.should_keep().
   */
  protected shouldKeep(hole: Match, ignored: Match[], before: boolean): boolean {
    if (before) {
      // Keep if there's still content in the hole after this leading ignored match
      return ignored[0].end < hole.end || ignored.length > 1;
    } else {
      // Python: `to_keep_match.start > hole.start and len(to_keep) > 1`
      return ignored[ignored.length - 1].start > hole.start && ignored.length > 1;
    }
  }

  /**
   * Check if a trailing ignored match (language/country) appears again in the same filepart
   * after the given position. If so, the occurrence in the title hole is part of the movie/show
   * title (e.g. "Immersion French" where "FRENCH" also appears later as a separate tag).
   */
  protected languageDuplicatedAfterHole(lastIgnored: Match, afterPos: number, matches: Matches): boolean {
    if (lastIgnored.name !== 'language' && lastIgnored.name !== 'country') return false;
    const filepart = matches.markers.atMatch(lastIgnored, (m: Match) => m.name === 'path') as Match | undefined;
    if (!filepart) return false;
    // Compare using string representation of the value (works for Language objects)
    const ignoredValueStr = String(lastIgnored.value ?? '').toLowerCase();
    const duplicates = matches.range(afterPos, filepart.end, (m: Match) =>
      m.name === lastIgnored.name &&
      String(m.value ?? '').toLowerCase() === ignoredValueStr
    ) as Match[] | Match | undefined;
    return Array.isArray(duplicates) ? duplicates.length > 0 : !!duplicates;
  }

  /**
   * Determine if we should remove a hole.
   */
  protected shouldRemove(_hole: Match): boolean {
    return false;
  }

  /**
   * Split a title hole at titleSeps characters (- / | + \) into title + alternative_titles.
   * Returns null if no split is possible.
   * Mirrors Python's TitleBaseRule._split_title_alternative().
   */
  protected splitTitleAlternative(
    hole: Match,
    inputString: string,
  ): { title: Match; alternatives: Match[] } | null {
    const text = inputString.slice(hole.start, hole.end);

    // Find ALL titleSep positions in the text
    const splitPositions: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (!titleSeps.includes(ch)) continue;

      // Check the character is a standalone separator (surrounded by seps or start/end)
      const prevIsSep = i === 0 || seps.includes(text[i - 1]);
      const nextIsSep = i === text.length - 1 || seps.includes(text[i + 1]);

      // Also allow "/" without surrounding seps (e.g., "Timsit/Lindon")
      if ((prevIsSep && nextIsSep) || ch === '/') {
        splitPositions.push(i);
      }
    }

    if (splitPositions.length === 0) return null;

    // Helper to create a trimmed Match from a range
    const createMatch = (start: number, end: number): Match | null => {
      let s = start;
      let e = end;
      while (s < e && seps.includes(inputString[s])) s++;
      while (e > s && seps.includes(inputString[e - 1])) e--;
      if (s >= e) return null;
      const raw = inputString.slice(s, e);
      const value = hole.formatter ? (hole.formatter as Function)(raw) : raw;
      return new Match(s, e, { inputString, formatter: hole.formatter, value });
    };

    // Split into segments
    const segments: Match[] = [];
    let prevEnd = hole.start;
    for (const pos of splitPositions) {
      const absPos = hole.start + pos;
      const seg = createMatch(prevEnd, absPos);
      if (seg) segments.push(seg);
      prevEnd = absPos + 1;
    }
    // Last segment
    const lastSeg = createMatch(prevEnd, hole.end);
    if (lastSeg) segments.push(lastSeg);

    if (segments.length < 2) return null;

    return { title: segments[0], alternatives: segments.slice(1) };
  }

  /**
   * Check and extract titles from a filepart.
   * Mirrors Python's TitleBaseRule.check_titles_in_filepart().
   */
  protected checkTitlesInFilepart(
    filepart: Match,
    matches: Matches,
  ): { toAppend: Match[]; toRemove: Match[] } {
    const toAppend: Match[] = [];
    const toRemove: Match[] = [];

    // Get holes (gaps) in the entire filepart
    // If a year exists in this filepart and a weak-episode match starts AT the very
    // beginning of the filepart, treat it as transparent so the title can include it
    // (e.g. "12.Angry.Men.1957.mkv" → title="12 Angry Men", not "Angry Men").
    // Also do this when a strong SxxExx pattern or date is present (e.g. "4400.S01E01..." → title="4400").
    const firstYearInFilepart = matches.range(filepart.start, filepart.end,
      (m: Match) => m.name === 'year', 0) as Match | undefined;
    const hasYearInFilepart = !!firstYearInFilepart;
    const hasDateInFilepart = !!(matches.range(filepart.start, filepart.end,
      (m: Match) => m.name === 'date', 0) as Match | undefined);
    const hasSxxExxInFilepart = !!(matches.range(filepart.start, filepart.end,
      (m: Match) => m.tags?.includes('SxxExx') && !m.private, 0) as Match | undefined);
    const holesResult = matches.holes(filepart.start, filepart.end, {
      formatter: formatters(cleanup, reorderTitle),
      ignore: (m: Match) => {
        if (this.isIgnored(m)) return true;
        if (
          (m.tags?.includes('weak-episode') || m.tags?.includes('weak-duplicate'))
        ) {
          // Check if this match OR its chain initiator starts at the filepart boundary.
          // Chain children (e.g. season=1 at [0,1) and episode=23 at [1,3) from "123")
          // share the same initiator — ignore ALL of them when the chain starts at filepart.start.
          const initiator = m.initiator;
          const startsAtFilepart = m.start === filepart.start || initiator.start === filepart.start;
          if (startsAtFilepart) {
            if (hasYearInFilepart || hasDateInFilepart || hasSxxExxInFilepart) return true;
          }
          // Also ignore weak-episode fragments within the first 4 characters of the filepart
          // when a year exists (handles "2001..." where "001" at [1,4) is a fragment).
          if (hasYearInFilepart && m.start >= filepart.start && m.start < filepart.start + 4 && m.end <= filepart.start + 4) {
            return true;
          }
          // Ignore weak-episode/weak-duplicate matches that appear BEFORE the first year
          // in the filepart. These numbers are typically part of the title, not episode numbers.
          // (e.g. "Paris 2054, Renaissance (2005)" → "2054" is part of the title).
          if (firstYearInFilepart && m.end <= firstYearInFilepart.start) {
            return true;
          }
        }
        return false;
      },
      predicate: (m) => m.value ? true : false,
    });

    const holeArray = Array.isArray(holesResult) ? holesResult : holesResult ? [holesResult] : [];

    // Process holes through holesProcess
    let processedHoles = this.holesProcess(holeArray, matches, filepart);

    // For each hole, find ignored matches inside and trim boundaries
    for (const hole of processedHoles) {
      if (!this.holeFilter(hole)) continue;
      if (process.env.DEBUG_TITLE_TRIM) {
        const inp = (matches as any).inputString ?? '';
        console.log(`[trim] hole="${inp.slice(hole.start, hole.end)}" [${hole.start},${hole.end})`);
      }

      // Find ignored matches inside this hole
      const ignoredInHole = matches.range(hole.start, hole.end, (m) =>
        this.isIgnored(m),
      ) as Match[] | Match | undefined;
      const ignoredArray = Array.isArray(ignoredInHole)
        ? ignoredInHole
        : ignoredInHole
          ? [ignoredInHole]
          : [];

      let trimmedHole = hole;
      // Pre-strip leading/trailing seps from the hole boundaries so that language-match
      // positions (which don't include surrounding seps) align with the trimmed boundaries.
      const inp: string = (matches as any).inputString ?? '';
      while (trimmedHole.start < trimmedHole.end && seps.includes(inp[trimmedHole.start])) {
        trimmedHole.start++;
      }
      while (trimmedHole.end > trimmedHole.start && seps.includes(inp[trimmedHole.end - 1])) {
        const pos = trimmedHole.end - 1;
        // Don't strip '.' if it's part of an abbreviation pattern (e.g. S.H.I.E.L.D., 0.8.4.)
        // Check: inp[pos]='.' AND inp[pos-1] is a letter/digit AND inp[pos-2] is '.'
        if (inp[pos] === '.' && pos >= 2 && /[a-zA-Z0-9]/.test(inp[pos - 1]) && inp[pos - 2] === '.') {
          break;
        }
        trimmedHole.end--;
      }
      if (process.env.DEBUG_TITLE_TRIM) {
        const ignoredNames = ignoredArray.map((m: Match) => `${m.name}="${inp.slice(m.start, m.end)}"@[${m.start},${m.end})`).join(', ');
        console.log(`  after pre-strip hole=[${trimmedHole.start},${trimmedHole.end}) ignoredArray=[${ignoredNames}]`);
      }

      // Trim leading ignored matches
      while (ignoredArray.length > 0) {
        const firstIgnored = ignoredArray[0];
        if (firstIgnored.start === trimmedHole.start) {
          // Country codes at the leading edge should always be stripped (e.g. "US Presidential Debates").
          // Languages at the leading edge are kept when there's more content (e.g. "French Maid Services").
          const keep = firstIgnored.name === 'country'
            ? false
            : this.shouldKeep(trimmedHole, ignoredArray, true);
          if (process.env.DEBUG_TITLE_TRIM) {
            console.log(`  leading trim: shouldKeep=${keep} for "${inp.slice(firstIgnored.start, firstIgnored.end)}"`);
          }
          if (keep) {
            // Even when shouldKeep says true, strip the ignored match if what follows
            // is a title separator (e.g. "Fr - Paris 2054" → strip "Fr" because it's
            // a language/country before a title separator, not part of the actual title).
            let hasTitleSep = false;
            for (let pp = firstIgnored.end; pp < trimmedHole.end; pp++) {
              const ch = inp[pp];
              if (titleSeps.includes(ch)) { hasTitleSep = true; break; }
              if (!seps.includes(ch)) break; // hit non-sep content → stop
            }
            if (hasTitleSep) {
              // Fall through to strip
            } else {
              break;
            }
          }
          trimmedHole.start = firstIgnored.end;
          // Also skip any seps after the leading ignored match
          while (trimmedHole.start < trimmedHole.end && seps.includes(inp[trimmedHole.start])) {
            trimmedHole.start++;
          }
          ignoredArray.shift();
        } else {
          break;
        }
      }

      // Trim trailing ignored matches
      while (ignoredArray.length > 0) {
        const lastIgnored = ignoredArray[ignoredArray.length - 1];
        if (lastIgnored.end === trimmedHole.end) {
          // Don't trim episode_details "Special" when followed directly by a year
          // (e.g. "A.Common.Title.Special.2014" → "Special" is part of the title)
          if (lastIgnored.name === 'episode_details' && lastIgnored.value === 'Special') {
            const nextMatch = matches.range(lastIgnored.end, lastIgnored.end + 10,
              (m: Match) => m.name === 'year' && !m.private, 0) as Match | undefined;
            if (nextMatch) {
              const between = inp.slice(lastIgnored.end, nextMatch.start);
              if ([...between].every(c => seps.includes(c))) {
                // "Special" is right before a year — keep it in the title
                break;
              }
            }
          }
          // If the same language value appears again after this hole, it's part of the title name
          // (e.g. "Immersion French ... FRENCH ENGLISH" → keep "French" in title).
          // We also remove the language match so it doesn't appear as both language AND title.
          if (this.languageDuplicatedAfterHole(lastIgnored, trimmedHole.end, matches)) {
            toRemove.push(lastIgnored);
            ignoredArray.pop();
            break;
          }
          if (this.shouldKeep(trimmedHole, ignoredArray, false)) {
            // Check if ALL remaining ignored matches form a contiguous block at the
            // trailing edge (only seps between them). If so, they are ALL language/country
            // tags and should be trimmed despite shouldKeep returning true.
            // e.g. "Die.Schluempfe.2.German.DL" → "German" and "DL" are contiguous languages.
            let allContiguousAtEnd = true;
            let checkEnd = trimmedHole.end;
            for (let k = ignoredArray.length - 1; k >= 0; k--) {
              const ig = ignoredArray[k];
              const between = inp.slice(ig.end, checkEnd);
              if (![...between].every(c => seps.includes(c))) {
                allContiguousAtEnd = false;
                break;
              }
              checkEnd = ig.start;
            }
            // Only skip the trim if the languages are NOT all contiguous at the end
            if (!allContiguousAtEnd) break;
          }
          trimmedHole.end = lastIgnored.start;
          // Also strip any trailing seps before the ignored match
          while (trimmedHole.end > trimmedHole.start && seps.includes(inp[trimmedHole.end - 1])) {
            trimmedHole.end--;
          }
          ignoredArray.pop();
        } else {
          break;
        }
      }

      if (process.env.DEBUG_TITLE_TRIM) {
        console.log(`  result: hole=[${trimmedHole.start},${trimmedHole.end}) length=${trimmedHole.length} value="${trimmedHole.value}"`);
      }
      if (trimmedHole.length > 0 && !this.shouldRemove(trimmedHole) && trimmedHole.value) {
        // Split title at titleSeps (- / | + \) to create title + alternative_title
        const splitResult = this.splitTitleAlternative(trimmedHole, inp);
        if (splitResult) {
          splitResult.title.name = this.matchName;
          toAppend.push(splitResult.title);
          for (const alt of splitResult.alternatives) {
            alt.name = this.alternativePropertyName;
            toAppend.push(alt);
          }
        } else {
          trimmedHole.name = this.matchName;
          toAppend.push(trimmedHole);
        }
      }
    }

    return { toAppend, toRemove };
  }

  /**
   * Find the "series name" filepart: the directory immediately preceding a season-only directory.
   * e.g. in Series/Californication/Season 2/..., returns the Californication filepart.
   * Mirrors Python's TitleBaseRule._serie_name_filepart().
   */
  protected _serieNameFilepart(matches: Matches, fileparts: Match[]): Match | null {
    for (let index = 0; index < fileparts.length - 1; index++) {
      if (index === 0) continue; // Skip most-informative filepart (the filename)
      const filepart = fileparts[index];
      const fpMatches = (matches.range(filepart.start, filepart.end) as Match[]).filter((m) => !m.private);
      if (process.env.DEBUG_TITLE) {
        const inp = (matches as any).inputString ?? '';
        console.log(`[_serieNameFilepart] index=${index} fp="${inp.slice(filepart.start, filepart.end)}" fpMatches=${fpMatches.map((m: Match) => `${m.name}="${m.value}"@[${m.start},${m.end})`).join(',')}`);
        if (fpMatches[0]) {
          const parent = (fpMatches[0] as any).parent;
          console.log(`  season span=[${fpMatches[0].start},${fpMatches[0].end}), filepart=[${filepart.start},${filepart.end}), parent span=${parent ? `[${parent.start},${parent.end})` : 'null'}`);
        }
      }
      if (
        fpMatches.length === 1 &&
        fpMatches[0].name === 'season' &&
        (
          (fpMatches[0].start === filepart.start && fpMatches[0].end === filepart.end) ||
          ((fpMatches[0] as any).parent &&
            (fpMatches[0] as any).parent.start === filepart.start &&
            (fpMatches[0] as any).parent.end === filepart.end)
        )
      ) {
        // This filepart contains only a season match — the NEXT one (less informative) is the series name
        return fileparts[index + 1] ?? null;
      }
    }
    return null;
  }

  /**
   * Get the title match from the series name filepart.
   * Mirrors Python's TitleBaseRule._serie_name_filepart_match().
   *
   * First looks for an existing title match in the filepart (added by Filepart3EpisodeTitle
   * or Filepart2EpisodeTitle which run before TitleFromPosition). If not found, attempts
   * to create one from holes in the filepart.
   */
  protected _serieNameFilepartMatch(
    matches: Matches,
    serieNameFilepart: Match,
    toAppend: Match[],
    toRemove: Match[],
  ): Match | null {
    // First check for an existing title match in the filepart (from Filepart3/2EpisodeTitle)
    const existingTitle = matches.range(
      serieNameFilepart.start, serieNameFilepart.end,
      (m: Match) => m.name === 'title', 0,
    ) as Match | undefined;

    if (existingTitle) {
      if (process.env.DEBUG_TITLE) {
        const inp = (matches as any).inputString ?? '';
        console.log(`[_serieNameFilepartMatch] fp="${inp.slice(serieNameFilepart.start, serieNameFilepart.end)}" found existing title="${existingTitle.value}"`);
      }
      return existingTitle;
    }

    // No existing title: try to create one from holes
    const weakIgnored = (m: Match) =>
      m.tags ? m.tags.some((t: string) => t === 'weak' || t.startsWith('weak-')) : false;

    const savedIsIgnored = this.isIgnored.bind(this);
    const combinedIgnore = (m: Match) => savedIsIgnored(m) || weakIgnored(m);

    const holesResult = matches.holes(serieNameFilepart.start, serieNameFilepart.end, {
      formatter: formatters(cleanup, reorderTitle),
      ignore: combinedIgnore,
      predicate: (m: Match) => m.value ? true : false,
    });
    const holeArray = Array.isArray(holesResult) ? holesResult : holesResult ? [holesResult] : [];
    const processedHoles = this.holesProcess(holeArray, matches, serieNameFilepart);
    if (process.env.DEBUG_TITLE) {
      const inp = (matches as any).inputString ?? '';
      console.log(`[_serieNameFilepartMatch] fp="${inp.slice(serieNameFilepart.start, serieNameFilepart.end)}" holeArray=${holeArray.length} processedHoles=${processedHoles.length}`);
      processedHoles.forEach((h, i) => console.log(`  hole[${i}]="${inp.slice(h.start, h.end)}" value="${h.value}"`));
    }

    if (processedHoles.length === 1 && processedHoles[0].value) {
      const serieTitle = processedHoles[0];
      serieTitle.name = this.matchName;
      toAppend.push(serieTitle);
      return serieTitle;
    }
    return null;
  }

  override when(matches: Matches, context: Context): { toAppend: Match[]; toRemove: Match[] } | null {
    // If an expected title already created title match(es), skip position-based title extraction.
    // This mirrors Python guessit behavior where expected_title takes precedence.
    const existingExpected = (matches.tagged('expected') as Match[] | undefined)?.filter(
      (m: Match) => m.name === 'title'
    ) ?? [];
    if (existingExpected.length > 0) {
      return null;
    }

    const toAppend: Match[] = [];
    const toRemove: Match[] = [];

    // Get path markers
    const pathMarkers = matches.markers.named('path') as Match[] | Match | undefined;
    const pathArray = Array.isArray(pathMarkers) ? pathMarkers : pathMarkers ? [pathMarkers] : [];

    // Sort fileparts by value (number of distinct matches inside), rightmost first on tie.
    // This mirrors Python's marker_sorted behavior: process most-info filepart first.
    const sortedFileparts = markerSorted(pathArray, matches);

    // Find the "series name" filepart (the directory before a season-only directory)
    const serieNameFilepart = this._serieNameFilepart(matches, sortedFileparts);
    let serieNameMatch: Match | null = null;
    if (serieNameFilepart) {
      serieNameMatch = this._serieNameFilepartMatch(matches, serieNameFilepart, toAppend, toRemove);
    }
    if (process.env.DEBUG_TITLE) {
      const inp = (matches as any).inputString ?? '';
      console.log(`[when] sortedFileparts: ${sortedFileparts.map((fp: Match) => `"${inp.slice(fp.start, fp.end)}"`).join(', ')}`);
      console.log(`[when] serieNameFilepart: ${serieNameFilepart ? `"${inp.slice(serieNameFilepart.start, serieNameFilepart.end)}"` : 'null'}`);
      console.log(`[when] serieNameMatch: ${serieNameMatch ? `"${serieNameMatch.value}"` : 'null'}`);
    }

    // Identify fileparts that contain a year (process these separately at the end)
    const yearFileparts = new Set<Match>(
      sortedFileparts.filter((fp) =>
        hasmatch(matches.range(fp.start, fp.end, (m: Match) => m.name === 'year', 0)),
      ),
    );

    // Process sorted fileparts — stop at first filepart that yields titles
    for (const filepart of sortedFileparts) {
      yearFileparts.delete(filepart); // Track which year fileparts are processed
      if (!this.filepartFilter(filepart)) continue;

      const result = this.checkTitlesInFilepart(filepart, matches);
      if (result.toAppend.length > 0 || result.toRemove.length > 0) {
        // If we found the series name, rename titles with different values to episode_title
        if (serieNameMatch) {
          // Normalize for comparison: strip apostrophes, trailing dots, and accents
          const normTitle = (s: string) => {
            try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch {}
            return s.replace(/[''`]/g, '').replace(/\.+$/, '').toLowerCase().trim();
          };
          for (const titleMatch of result.toAppend) {
            if (normTitle(String(titleMatch.value)) !== normTitle(String(serieNameMatch.value))) {
              titleMatch.name = 'episode_title';
            }
          }
        }
        toAppend.push(...result.toAppend);
        toRemove.push(...result.toRemove);
        break; // Only process first successful filepart (matches Python behavior)
      }
    }

    // Also process remaining fileparts that contain years (for extra title candidates).
    // When a year-filepart title is an accented/richer version of the filename title,
    // prefer the year-filepart title (e.g., "La Science des Rêves" over "La Science Des Reves").
    for (const filepart of yearFileparts) {
      if (!this.filepartFilter(filepart)) continue;
      const result = this.checkTitlesInFilepart(filepart, matches);
      const filteredAppend: Match[] = [];
      for (const newTitle of result.toAppend) {
        if (newTitle.name !== this.matchName) {
          filteredAppend.push(newTitle);
          continue;
        }
        const newVal = String(newTitle.value ?? '');
        // Check if an existing title in toAppend is an equivalent of the new one
        // (stripping accents, apostrophes, and other punctuation for comparison)
        const norm = (s: string) => {
          try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch {}
          return s.replace(/[''`]/g, '').toLowerCase();
        };
        const existingIdx = toAppend.findIndex((m) => {
          if (m.name !== this.matchName) return false;
          const existingVal = String(m.value ?? '');
          return norm(existingVal) === norm(newVal) && existingVal !== newVal;
        });
        if (existingIdx !== -1) {
          // Update the existing title's value to the richer version (keeping its position
          // in the original filepart so RemoveAmbiguous doesn't discard it).
          toAppend[existingIdx].value = newVal;
          // Don't add the parent dir title separately
          continue;
        }
        // Skip year-filepart titles that are just the existing title + country/language
        // (e.g. "The Office US" when existing is "The Office")
        const isSuperset = toAppend.some((m) => {
          if (m.name !== this.matchName) return false;
          const existingNorm = norm(String(m.value ?? ''));
          const newNorm = norm(newVal);
          return newNorm.startsWith(existingNorm + ' ') || newNorm.endsWith(' ' + existingNorm);
        });
        if (isSuperset) continue;
        filteredAppend.push(newTitle);
      }
      toAppend.push(...filteredAppend);
      toRemove.push(...result.toRemove);
    }

    if (toAppend.length === 0 && toRemove.length === 0) {
      return null;
    }

    return { toAppend, toRemove };
  }

  override then(matches: Matches, whenResponse: unknown, context: Context): void {
    if (!whenResponse || typeof whenResponse !== 'object') return;
    const response = whenResponse as { toAppend: Match[]; toRemove: Match[] };

    // Apply removes first
    const removeConsequence = new RemoveMatch();
    removeConsequence.then(matches, response.toRemove, context);

    // Then appends
    const appendConsequence = new AppendMatch();
    appendConsequence.then(matches, response.toAppend, context);
  }
}

/**
 * Extract title from filepart positions.
 */
class TitleFromPosition extends TitleBaseRule {
  static override priority = 0;
  // Run after DashSeparatedReleaseGroup so it doesn't create title holes
  // where the release group has already been claimed (matches Python behavior)
  static override dependency = ['DashSeparatedReleaseGroup', 'SubtitlePrefixLanguageRule', 'SubtitleSuffixLanguageRule', 'SubtitleExtensionRule'];
  static override properties: Record<string, unknown[]> = { title: [null], alternative_title: [null] };

  constructor() {
    super('title', ['title'], 'alternative_title');
  }
}

/**
 * Prefer title with year: mark titles without year as equivalent-ignore.
 */
class PreferTitleWithYear extends Rule {
  static override priority = 32;
  static override dependency: typeof Rule | typeof Rule[] = [TitleFromPosition];

  override consequence = [RemoveMatch, AppendTags];

  override when(matches: Matches, _context: Context): Match[] {
    const ret: Match[] = [];

    const titleMatches = matches.named('title') as Match[] | Match | undefined;
    const titleArray = Array.isArray(titleMatches) ? titleMatches : titleMatches ? [titleMatches] : [];

    const yearMatches = matches.named('year') as Match[] | Match | undefined;
    const yearArray = Array.isArray(yearMatches) ? yearMatches : yearMatches ? [yearMatches] : [];

    for (const title of titleArray) {
      // Never remove expected titles (from -T / expected_title option)
      if (title.tags?.includes('expected')) continue;

      // Check if there's a year in the same filepart
      const filepart = matches.markers.atMatch(title, (m) => m.name === 'path', 0) as Match | undefined;
      if (!filepart) continue;

      const yearsInPart = matches.range(filepart.start, filepart.end, (m) =>
        m.name === 'year',
      ) as Match[] | Match | undefined;
      const yearsInPartArray = Array.isArray(yearsInPart)
        ? yearsInPart
        : yearsInPart
          ? [yearsInPart]
          : [];

      if (yearsInPartArray.length === 0) {
        ret.push(title);
      }
    }

    return ret;
  }

  override then(matches: Matches, whenResponse: unknown, context: Context): void {
    if (!whenResponse || !Array.isArray(whenResponse)) return;

    // Remove titles without year
    const removeConsequence = new RemoveMatch();
    removeConsequence.then(matches, whenResponse, context);

    // Mark removed ones as equivalent-ignore
    const appendConsequence = new AppendTags(['equivalent-ignore']);
    appendConsequence.then(matches, whenResponse, context);
  }
}

/**
 * Create a rebulk pattern for title detection.
 */
export function title(config: Record<string, unknown>): Rebulk {
  const rebulk = new Rebulk({
    disabled: (context: Context) => isDisabled(context, 'title'),
  });

  rebulk.rules(TitleFromPosition, PreferTitleWithYear);

  // Expected title functional pattern
  const expectedTitle = buildExpectedFunction('expected_title');
  rebulk.functional(expectedTitle, {
    name: 'title',
    tags: ['expected', 'title'],
    validator: sepsSurround,
    formatter: formatters(cleanup, reorderTitle),
    conflictSolver: (match, other) => other,
    disabled: (context: Context) => !(context?.['expected_title'] as boolean | undefined),
  });

  return rebulk;
}
