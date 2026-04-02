import { Rebulk } from 'rebulk-js';
import { Rule, AppendMatch, RemoveMatch } from 'rebulk-js';
import type { Match, Matches } from 'rebulk-js';
import { POST_PROCESS } from 'rebulk-js';
import { seps, titleSeps, sepsPattern } from '../common/index.js';
import { cleanup, reorderTitle } from '../common/formatters.js';
import { isDisabled } from '../common/pattern.js';
import { or_ } from '../common/validators.js';
import { formatters } from 'rebulk-js';

/** Helper: truthy check for match result (handles empty arrays correctly) */
function hasmatch(result: Match[] | Match | undefined): boolean {
  if (result === null || result === undefined) return false;
  if (Array.isArray(result)) return result.length > 0;
  return true;
}

/** Strip leading articles for title comparison */
const LEADING_ARTICLES_RE = /^(the|a|an|le|la|les|l'|el|los|las|der|die|das)\s+/i;
function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(LEADING_ARTICLES_RE, '').trim();
}

export function episodeTitle(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'episode_title') });
  rebulk.rules(
    RemoveConflictsWithEpisodeTitle,
    TitleToEpisodeTitle,
    ExtendEpisodeTitleWithDetails,
    EpisodeTitleFromPosition,
    AlternativeTitleReplace,
    TrimLanguageFromEpisodeTitle,
    Filepart3EpisodeTitle,
    Filepart2EpisodeTitle,
    RenameEpisodeTitleWhenMovieType
  );

  return rebulk;
}

class RemoveConflictsWithEpisodeTitle extends Rule {
  static override priority = 64;
  override consequence = RemoveMatch;

  previousNames = ['episode', 'episode_count', 'season', 'season_count', 'date', 'title', 'year'];
  nextNames = ['streaming_service', 'screen_size', 'source', 'video_codec', 'audio_codec', 'other', 'container'];
  affectedIfHolesAfter = ['part'];
  affectedNames = ['part', 'year'];

  override when(matches: Matches, _context: any): Match[] {
    const toRemove: Match[] = [];
    const fileparts = matches.markers.named('path') as Match[];
    for (const filepart of fileparts) {
      const affectedMatches = matches.range(filepart.start, filepart.end,
        (m: Match) => this.affectedNames.includes(m.name ?? '')) as Match[];
      for (const match of affectedMatches) {
        const before = matches.range(filepart.start, match.start,
          (m: Match) => !m.private, -1) as Match | undefined;
        if (!before || !this.previousNames.includes(before.name ?? '')) {
          continue;
        }
        // Don't remove year when the preceding match is only a weak episode
        // (e.g. "12.Angry.Men.1957.mkv" — the "12" is a weak episode, 1957 is a real year).
        if ((before as any).tags?.includes('weak-episode') || (before as any).tags?.includes('weak-duplicate')) {
          continue;
        }

        // Don't remove year when it's inside a group (parentheses/brackets)
        // e.g. "(the.oscars.of.1963)" — the year is significant, not part of episode title
        if (match.name === 'year') {
          const yearGroup = matches.markers.atMatch(match,
            (m: Match) => m.name === 'group', 0) as Match | undefined;
          if (yearGroup) continue;
        }

        const after = matches.range(match.end, filepart.end,
          (m: Match) => !m.private, 0) as Match | undefined;
        if (!after || !this.nextNames.includes(after.name ?? '')) {
          continue;
        }

        const group = matches.markers.atMatch(match,
          (m: Match) => m.name === 'group', 0) as Match | undefined;

        const hasValueInSameGroup = (m: Match) =>
          !!(m.value && String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')) &&
          group === matches.markers.atMatch(m, (mm: Match) => mm.name === 'group', 0);

        const holesBefore = matches.holes(before.end, match.start, { predicate: hasValueInSameGroup });
        const holesAfter = matches.holes(match.end, after.start, { predicate: hasValueInSameGroup });

        const hasHolesBefore = hasmatch(holesBefore);
        const hasHolesAfter = hasmatch(holesAfter);

        if (!hasHolesBefore && !hasHolesAfter) {
          continue;
        }

        if (this.affectedIfHolesAfter.includes(match.name ?? '') && !hasHolesAfter) {
          continue;
        }

        toRemove.push(match);
        if ((match as any).parent) {
          toRemove.push((match as any).parent);
        }
      }
    }

    return toRemove;
  }
}

class TitleToEpisodeTitle extends Rule {
  static override dependency = ['TitleFromPosition'];

  override when(matches: Matches, _context: any): Match[] {
    const titles = matches.named('title') as Match[];
    const titleGroups: Record<string, Match[]> = {};
    for (const title of titles) {
      const key = String(title.value);
      titleGroups[key] = titleGroups[key] || [];
      titleGroups[key].push(title);
    }

    const episodeTitles: Match[] = [];
    if (Object.keys(titleGroups).length < 2) {
      return episodeTitles;
    }

    // Work around rebulk-js previous() bug: use range() to find
    // preceding episode/season/date/year matches within the same filepart.
    const epNames = new Set(['episode', 'season', 'date', 'year']);
    const findPrevEpisode = (title: Match): Match | undefined => {
      const filepart = matches.markers.atMatch(title, (m: Match) => m.name === 'path', 0) as Match | undefined;
      if (!filepart) return undefined;
      const prevMatches = matches.range(filepart.start, title.start,
        (m: Match) => !m.private && epNames.has(m.name ?? '')) as Match[];
      const arr = Array.isArray(prevMatches) ? prevMatches : prevMatches ? [prevMatches] : [];
      return arr.length > 0 ? arr[arr.length - 1] : undefined;
    };

    // Determine which titles are "series titles" (no previous episode match)
    // so we can avoid converting article variants of them to episode_title.
    const seriesTitleKeys = new Set<string>();
    for (const title of titles) {
      const prevEpisode = findPrevEpisode(title);
      if (!prevEpisode) {
        seriesTitleKeys.add(normalizeTitle(String(title.value)));
      }
    }

    for (const title of titles) {
      const prevEpisode = findPrevEpisode(title);
      if (prevEpisode) {
        // Only convert to episode_title if this title's normalized value
        // differs from all series titles (handles "The Simpsons" vs "Simpsons")
        const norm = normalizeTitle(String(title.value));
        if (!seriesTitleKeys.has(norm)) {
          episodeTitles.push(title);
        }
      }
    }

    return episodeTitles;
  }

  override then(matches: Matches, whenResponse: unknown, _context: any): void {
    const episodeTitles = whenResponse as Match[];
    for (const title of episodeTitles) {
      matches.remove(title);
      title.name = 'episode_title';
      matches.append(title);
    }
  }
}

/**
 * Extend episode_title to include adjacent episode_details matches (e.g., "Special").
 * When "Special" appears right after an episode_title like "Head To Tail",
 * the title trimming logic strips it. This rule re-attaches it.
 */
class ExtendEpisodeTitleWithDetails extends Rule {
  static override dependency = ['TitleToEpisodeTitle'];

  override when(matches: Matches, _context: any): Array<{ et: Match; detail: Match }> | undefined {
    const episodeTitles = matches.named('episode_title') as Match[];
    if (!episodeTitles || episodeTitles.length === 0) return undefined;

    const updates: Array<{ et: Match; detail: Match }> = [];

    for (const et of episodeTitles) {
      const inp: string = (matches as any).inputString ?? '';
      // Look for episode_details immediately after the episode_title (with only seps between)
      const detailMatches = matches.range(et.end, et.end + 20,
        (m: Match) => m.name === 'episode_details') as Match[];
      if (!detailMatches || detailMatches.length === 0) continue;

      for (const detail of detailMatches) {
        const between = inp.slice(et.end, detail.start);
        if ([...between].every(c => seps.includes(c))) {
          updates.push({ et, detail });
          break;
        }
      }
    }

    return updates.length > 0 ? updates : undefined;
  }

  override then(matches: Matches, whenResponse: unknown, _context: any): void {
    const updates = whenResponse as Array<{ et: Match; detail: Match }>;
    if (!updates) return;

    for (const { et, detail } of updates) {
      matches.remove(et);
      et.end = detail.end;
      // Reset cached value so it recomputes
      et.value = undefined as any;
      const _ = et.value; // trigger recompute
      matches.append(et);
    }
  }
}

class EpisodeTitleFromPosition extends Rule {
  static override dependency = ['ExtendEpisodeTitleWithDetails'];

  previousNames = ['episode', 'episode_count', 'season', 'season_count', 'date', 'title', 'year'];

  protected isIgnored(match: Match): boolean {
    return match.name === 'language' || match.name === 'country' || match.name === 'episode_details';
  }

  override when(matches: Matches, _context: any): Match[] {
    const toAppend: Match[] = [];
    const fileparts = matches.markers.named('path') as Match[];

    for (const filepart of fileparts) {
      // Skip fileparts that already have an episode_title
      const hasEpTitleInPart = hasmatch(matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'episode_title', 0));
      if (hasEpTitleInPart) continue;

      // Only look at fileparts that have a title or episode (for multi-part paths
      // where the title may have been de-duped into a parent directory)
      const hasTitleInPart = hasmatch(matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'title', 0));
      const hasEpisodeInPart = hasmatch(matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'episode' && !m.private, 0));
      if (!hasTitleInPart && !hasEpisodeInPart) continue;

      // Find holes (gaps) in filepart
      const holesResult = matches.holes(filepart.start, filepart.end, {
        formatter: formatters(cleanup, reorderTitle),
        ignore: (m: Match) => this.isIgnored(m),
        predicate: (m: Match) => !!(m.value),
      });
      const holeArray = Array.isArray(holesResult) ? holesResult : holesResult ? [holesResult] : [];

      for (const hole of holeArray) {
        // Check there's an episode/crc32/etc. BEFORE this hole in the same filepart
        // Work around rebulk-js previous() bug by using range()
        const prevPred = (m: Match) => !m.private && this.previousNames.includes(m.name ?? '');
        const prevMatches = matches.range(filepart.start, hole.start, prevPred) as Match[];
        const prevArr = Array.isArray(prevMatches) ? prevMatches : prevMatches ? [prevMatches] : [];
        const prevEpisode = prevArr.length > 0 ? prevArr[prevArr.length - 1] : undefined;

        let prevCrc32: Match | undefined;
        if (!prevEpisode) {
          const crc32Matches = matches.range(filepart.start, hole.start,
            (m: Match) => !m.private && m.name === 'crc32') as Match[];
          const crc32Arr = Array.isArray(crc32Matches) ? crc32Matches : crc32Matches ? [crc32Matches] : [];
          prevCrc32 = crc32Arr.length > 0 ? crc32Arr[crc32Arr.length - 1] : undefined;
        }
        if (!prevEpisode && !prevCrc32) continue;

        hole.name = 'episode_title';
        toAppend.push(hole);
      }
    }

    return toAppend;
  }

  override then(matches: Matches, whenResponse: unknown, _context: any): void {
    const holes = whenResponse as Match[];
    for (const hole of holes) {
      if (!matches.includes(hole)) {
        matches.append(hole);
      }
    }
  }
}

class AlternativeTitleReplace extends Rule {
  static override dependency = ['EpisodeTitleFromPosition'];

  previousNames = ['episode', 'episode_count', 'season', 'season_count', 'date', 'title', 'year'];

  override when(matches: Matches, _context: any): Match | undefined {
    // Skip if episode_title already found
    if (hasmatch(matches.named('episode_title', null, 0))) {
      return undefined;
    }

    // range with proper args: start=0, end=undefined, predicate, index
    const alternativeTitle = matches.range(0, undefined,
      (m: Match) => m.name === 'alternative_title', 0) as Match | undefined;
    if (alternativeTitle) {
      const mainTitle = (matches as any).chainBefore(
        alternativeTitle.start,
        seps,
        0,
        (m: Match) => m.name === 'title',
        0
      ) as Match | undefined;
      if (mainTitle) {
        // Work around rebulk-js previous() bug: use range() to search
        // within the same filepart for a preceding episode/season/date/year/title
        const filepart = matches.markers.atMatch(mainTitle, (m: Match) => m.name === 'path', 0) as Match | undefined;
        const searchStart = filepart?.start ?? 0;
        const prevPred = (m: Match) => !m.private && this.previousNames.includes(m.name ?? '');
        const prevMatches = matches.range(searchStart, mainTitle.start, prevPred) as Match[];
        const prevArr = Array.isArray(prevMatches) ? prevMatches : prevMatches ? [prevMatches] : [];
        const episode = prevArr.length > 0 ? prevArr[prevArr.length - 1] : undefined;

        // Check crc32 anywhere in the same filepart (not just before the title)
        const searchEnd = filepart?.end ?? (matches.inputString?.length ?? mainTitle.end + 100);
        const crc32Matches = !episode ? (matches.range(searchStart, searchEnd,
          (m: Match) => !m.private && m.name === 'crc32') as Match[]) : undefined;
        const crc32Arr = Array.isArray(crc32Matches) ? crc32Matches : crc32Matches ? [crc32Matches] : [];
        const crc32 = crc32Arr.length > 0 ? crc32Arr[0] : undefined;

        if (episode || crc32) {
          return alternativeTitle;
        }
      }
    }
    return undefined;
  }

  override then(matches: Matches, whenResponse: unknown, _context: any): void {
    const match = whenResponse as Match | undefined;
    if (!match) return;
    matches.remove(match);
    match.name = 'episode_title';
    match.tags = match.tags || [];
    match.tags.push('alternative-replaced');
    matches.append(match);
  }
}

/**
 * Trim language/country/subtitle_language matches that overlap with the
 * trailing (or leading) edge of an episode_title.  When title extraction
 * ignores language matches the resulting hole text includes the language
 * word — this rule shrinks the episode_title span so it no longer covers
 * the language match, then recomputes the cleaned value.
 */
class TrimLanguageFromEpisodeTitle extends Rule {
  static override dependency = ['EpisodeTitleFromPosition', 'AlternativeTitleReplace'];

  private readonly langNames = new Set(['language', 'country', 'subtitle_language']);

  override when(matches: Matches, _context: any): Array<{ match: Match; newStart: number; newEnd: number }> | undefined {
    const episodeTitles = matches.named('episode_title') as Match[];
    if (!episodeTitles || episodeTitles.length === 0) return undefined;

    const updates: Array<{ match: Match; newStart: number; newEnd: number }> = [];

    for (const et of episodeTitles) {
      let newStart = et.start;
      let newEnd = et.end;

      // Find language/country matches overlapping with the episode_title
      const overlapping = matches.range(et.start, et.end,
        (m: Match) => this.langNames.has(m.name ?? '')) as Match[];

      if (!overlapping || overlapping.length === 0) continue;

      // Trim from the end: remove language matches that touch or extend past the trailing edge
      // Sort by start descending to peel from the end
      const sorted = [...overlapping].sort((a, b) => b.start - a.start);
      for (const lang of sorted) {
        // Language match starts within the episode title and reaches (or extends past) the end
        if (lang.start >= newStart && lang.start < newEnd) {
          const inputStr = et.inputString ?? '';
          // Check that between the language match end and the episode title end is only seps (or language extends beyond)
          const between = lang.end >= newEnd ? '' : inputStr.slice(lang.end, newEnd);
          if (between === '' || [...between].every(c => seps.includes(c))) {
            let trimEnd = lang.start;
            while (trimEnd > newStart && seps.includes(inputStr[trimEnd - 1])) {
              trimEnd--;
            }
            if (trimEnd < newEnd) {
              newEnd = trimEnd;
            }
          }
        }
      }

      // Note: we intentionally do NOT trim language matches from the leading
      // edge because short language codes (e.g. "En") frequently appear as
      // legitimate title words.

      if (newStart !== et.start || newEnd !== et.end) {
        if (newEnd > newStart) {
          updates.push({ match: et, newStart, newEnd });
        }
      }
    }

    return updates.length > 0 ? updates : undefined;
  }

  override then(matches: Matches, whenResponse: unknown, _context: any): void {
    const updates = whenResponse as Array<{ match: Match; newStart: number; newEnd: number }>;
    if (!updates) return;

    for (const { match, newStart, newEnd } of updates) {
      matches.remove(match);
      match.start = newStart;
      match.end = newEnd;
      // Reset cached value so it recomputes from formatter + new span
      match.value = undefined as any;
      const val = match.value;
      if (val && String(val).trim()) {
        matches.append(match);
      }
    }
  }
}

class Filepart3EpisodeTitle extends Rule {
  // consequence produces a hole; we rename it to 'title' via matchName
  override consequence = new AppendMatch('title');

  override when(matches: Matches, _context: any): Match | undefined {
    if (hasmatch(matches.tagged('filepart-title', null, 0))) {
      return undefined;
    }

    const fileparts = matches.markers.named('path') as Match[];
    if (fileparts.length < 3) {
      return undefined;
    }

    const filename = fileparts[fileparts.length - 1];
    const directory = fileparts[fileparts.length - 2];
    const subdirectory = fileparts[fileparts.length - 3];

    const episodeNumber = matches.range(filename.start, filename.end,
      (m: Match) => m.name === 'episode', 0) as Match | undefined;
    if (episodeNumber) {
      const season = matches.range(directory.start, directory.end,
        (m: Match) => m.name === 'season', 0) as Match | undefined;

      if (season) {
        const hole = matches.holes(subdirectory.start, subdirectory.end, {
          ignore: or_(
            (m: Match) => !!(m.tags?.includes('weak-episode')),
            (m: Match) => m.name === 'language' || m.name === 'country' || m.name === 'episode_details',
          ),
          formatter: cleanup,
          seps: titleSeps,
          predicate: (m: Match) => !!(m.value),
          index: 0,
        }) as Match | undefined;
        if (hole) {
          return hole;
        }
      }
    }
    return undefined;
  }
}

class Filepart2EpisodeTitle extends Rule {
  // consequence produces a hole; we rename it to 'title' via matchName
  override consequence = new AppendMatch('title');

  override when(matches: Matches, _context: any): Match | undefined {
    if (hasmatch(matches.tagged('filepart-title', null, 0))) {
      return undefined;
    }

    const fileparts = matches.markers.named('path') as Match[];
    if (fileparts.length < 2) {
      return undefined;
    }

    const filename = fileparts[fileparts.length - 1];
    const directory = fileparts[fileparts.length - 2];

    const episodeNumber = matches.range(filename.start, filename.end,
      (m: Match) => m.name === 'episode', 0) as Match | undefined;
    if (episodeNumber) {
      const season =
        (matches.range(directory.start, directory.end, (m: Match) => m.name === 'season', 0) as Match | undefined) ||
        (matches.range(filename.start, filename.end, (m: Match) => m.name === 'season', 0) as Match | undefined);

      if (season) {
        const hole = matches.holes(directory.start, directory.end, {
          ignore: or_(
            (m: Match) => !!(m.tags?.includes('weak-episode')),
            (m: Match) => m.name === 'language' || m.name === 'country' || m.name === 'episode_details',
          ),
          formatter: cleanup,
          seps: titleSeps,
          predicate: (m: Match) => !!(m.value),
          index: 0,
        }) as Match | undefined;
        if (hole) {
          // Crop the hole at group marker boundaries so that content inside
          // parentheses (e.g., "(US)") that was ignored (country) doesn't
          // bleed into the title text.
          const groupMarkers = matches.markers.named('group') as Match[] | Match | undefined;
          const groupArray = Array.isArray(groupMarkers) ? groupMarkers : groupMarkers ? [groupMarkers] : [];
          const relevantGroups = groupArray.filter(
            (g) => g.start >= directory.start && g.end <= directory.end &&
                   !(g.start === directory.start && g.end === directory.end),
          );
          if (relevantGroups.length > 0) {
            const cropped = hole.crop(relevantGroups);
            const croppedArr = Array.isArray(cropped) ? cropped : cropped ? [cropped] : [];
            const first = croppedArr.find((c) => c.value);
            if (first) {
              first.tags = first.tags || [];
              first.tags.push('filepart-title');
              return first;
            }
            // If cropping removed all content, fall through
          } else {
            hole.tags = hole.tags || [];
            hole.tags.push('filepart-title');
            return hole;
          }
        }
      }
    }
    return undefined;
  }
}

class RenameEpisodeTitleWhenMovieType extends Rule {
  static override priority = POST_PROCESS;
  static override dependency = ['TypeProcessor'];

  override when(matches: Matches, _context: any): Match[] | undefined {
    // Get episode_title matches (excluding alternative-replaced ones)
    const episodeTitles = (matches.named('episode_title',
      (m: Match) => !m.tags?.includes('alternative-replaced')) as Match[]) || [];

    // Check if type is episode (using index=0 to get single match → undefined if none)
    const episodeType = matches.named('type', (m: Match) => m.value === 'episode', 0) as Match | undefined;

    if (episodeTitles.length > 0 && !episodeType) {
      return episodeTitles;
    }
    return undefined;
  }

  override then(matches: Matches, whenResponse: unknown, _context: any): void {
    const episodeTitles = whenResponse as Match[] | undefined;
    if (!episodeTitles) return;
    for (const match of episodeTitles) {
      matches.remove(match);
      match.name = 'alternative_title';
      matches.append(match);
    }
  }
}
