/**
 * Type property — port of guessit/rules/properties/type.py
 */
import { Rebulk } from 'rebulk-js';
import { Rule, AppendMatch } from 'rebulk-js';
import { POST_PROCESS } from 'rebulk-js';
import { Match } from 'rebulk-js';
import type { Matches } from 'rebulk-js';
import type { Context } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';

/**
 * Append a type match to the matches collection.
 */
function addType(matches: Matches, value: string): void {
  matches.append(
    new Match(matches.inputString?.length ?? 0, matches.inputString?.length ?? 0, {
      name: 'type',
      value,
    }),
  );
}

/**
 * TypeProcessor — determines file type as 'episode' or 'movie'.
 */
class TypeProcessor extends Rule {
  static override priority = POST_PROCESS;
  static override dependency = undefined;
  static override properties = { type: ['episode', 'movie'] };

  override priority = POST_PROCESS;
  override consequence = AppendMatch;

  override when(matches: Matches, context: Context): { type: string; removeWeak?: boolean } | string | null {
    // If context provides an explicit type, use it
    const optionType = context?.['type'] as string | undefined;
    if (optionType) return optionType;

    // Check for episode indicators
    const episode = matches.named('episode') as Match[] | Match | undefined;
    const season = matches.named('season') as Match[] | Match | undefined;
    const absoluteEpisode = matches.named('absolute_episode') as Match[] | Match | undefined;
    const episodeDetails = matches.named('episode_details') as Match[] | Match | undefined;
    const year = matches.named('year') as Match[] | Match | undefined;

    const episodeArr = Array.isArray(episode) ? episode : episode ? [episode as Match] : [];
    const seasonArr = Array.isArray(season) ? season : season ? [season as Match] : [];
    const hasYear = !!(year && (Array.isArray(year) ? (year as Match[]).length > 0 : true));

    const hasAbsoluteEpisode = !!(absoluteEpisode &&
      (Array.isArray(absoluteEpisode) ? absoluteEpisode.length > 0 : true));
    const hasEpisodeDetails = !!(episodeDetails &&
      (Array.isArray(episodeDetails) ? episodeDetails.length > 0 : true));

    if (
      episodeArr.length > 0 ||
      seasonArr.length > 0 ||
      hasEpisodeDetails ||
      hasAbsoluteEpisode
    ) {
      // If ALL episode matches are weak (no explicit marker) AND a year is present AND
      // no season/absoluteEpisode/episodeDetails exist, the number is likely a movie title
      // component (e.g. "12 Angry Men (1957)", "21 (2008)") rather than an episode number.
      const allEpisodesWeak =
        episodeArr.length > 0 &&
        episodeArr.every((m) => m.tags.includes('weak-episode') || m.tags.includes('weak-duplicate'));
      // Seasons from weak_duplicate are also "weak" only if they appear BEFORE the year.
      // A season from weak_duplicate that appears AFTER a year is a real episode indicator
      // (e.g. "Flash.2014.208" — season=2, ep=8 after year=2014 is real).
      // But "123.Angry.Men.1957" — season=1 from "123" appears BEFORE year=1957 → weak.
      const yearArr2 = Array.isArray(year) ? (year as Match[]) : year ? [year as Match] : [];
      const firstYearStart = yearArr2.length > 0 ? yearArr2[0].start : Infinity;
      const allSeasonsWeak =
        seasonArr.every((m) =>
          (m.tags.includes('weak-duplicate') || m.tags.includes('weak-episode')) &&
          m.start < firstYearStart
        );
      const noStrongEpisodeIndicators =
        (seasonArr.length === 0 || allSeasonsWeak) &&
        !hasAbsoluteEpisode &&
        !hasEpisodeDetails;

      // Check if weak episodes form a range (e.g. "476-479" or "2.-.10") which is a
      // strong indicator of real episode numbers even without SxxExx markers.
      let hasEpisodeRange = false;
      const weakEpisodes = episodeArr.filter((m) =>
        m.tags.includes('weak-episode') || m.tags.includes('weak-duplicate'));
      if (weakEpisodes.length >= 3) {
        hasEpisodeRange = true;
      } else if (weakEpisodes.length === 2) {
        const sorted = [...weakEpisodes].sort((a, b) => a.start - b.start);
        const between = (matches.inputString ?? '').slice(sorted[0].end, sorted[1].start);
        const betweenClean = between.replace(/[\s._]/g, '');
        if (betweenClean === '-' || betweenClean === '~' || betweenClean.toLowerCase() === 'to') {
          hasEpisodeRange = true;
        }
      }

      const allEpisodesWeakNoRange =
        episodeArr.length > 0 &&
        !hasEpisodeRange &&
        episodeArr.every((m) => m.tags.includes('weak-episode') || m.tags.includes('weak-duplicate'));

      // Also check if weak seasons have embedded digits (e.g. "BT709")
      const allSeasonsWeakExtended =
        seasonArr.every((m) => {
          if (!(m.tags.includes('weak-duplicate') || m.tags.includes('weak-episode'))) return false;
          if (m.start < firstYearStart) return true;
          const inputStr = matches.inputString ?? '';
          const initiator = m.initiator;
          if (initiator) {
            const iStart = initiator.start ?? m.start;
            const iEnd = initiator.end ?? m.end;
            const charBefore = iStart > 0 ? inputStr[iStart - 1] : '';
            const charAfter = iEnd < inputStr.length ? inputStr[iEnd] : '';
            if (charBefore && /[a-zA-Z]/.test(charBefore)) return true;
            if (charAfter && /[a-zA-Z]/.test(charAfter)) return true;
          }
          return false;
        });

      const noStrongIndicatorsExtended =
        (seasonArr.length === 0 || allSeasonsWeakExtended) &&
        !hasAbsoluteEpisode &&
        !hasEpisodeDetails;

      // Exception: anime-style bracket release group (e.g. [HorribleSubs]) with weak episodes
      // indicates a real episode even when year is present
      const releaseGroup = matches.named('release_group') as Match[] | Match | undefined;
      const rgArr = Array.isArray(releaseGroup) ? releaseGroup : releaseGroup ? [releaseGroup] : [];
      const inputStr2 = matches.inputString ?? '';
      const hasAnimeStyleRG = rgArr.some((rg) => {
        const charBefore = rg.start > 0 ? inputStr2[rg.start - 1] : '';
        return charBefore === '[';
      });

      // Case 1: all episodes weak + year + no strong indicators → movie
      // e.g. "12 Angry Men (1957)", "21 (2008)" — the number is part of the movie title.
      // But not if there's an anime-style bracket release group.
      if (allEpisodesWeakNoRange && noStrongIndicatorsExtended && hasYear && !hasAnimeStyleRG) {
        return { type: 'movie', removeWeak: true };
      }
      // Case 2: episodeDetails only (no episode/season/absolute) + year → movie
      // e.g. "Special.Correspondents.2016" (ep_details="Special"), "Final.Fantasy.XV.2016" (ep_details="Final")
      // But only if episodeDetails appears BEFORE the year (it's part of the title, not a post-year episode
      // marker). If episodeDetails comes AFTER the year (e.g. "Downton.Abbey.2013.Christmas.Special"),
      // it's a genuine special episode indicator → return 'episode'.
      else if (
        episodeArr.length === 0 &&
        seasonArr.length === 0 &&
        !hasAbsoluteEpisode &&
        hasEpisodeDetails &&
        hasYear
      ) {
        // Get positions to determine if episodeDetails comes before the year
        const epDetailsArr = Array.isArray(episodeDetails)
          ? (episodeDetails as Match[])
          : episodeDetails
            ? [episodeDetails as Match]
            : [];
        const yearArr = Array.isArray(year) ? (year as Match[]) : year ? [year as Match] : [];
        const yearStart = yearArr.length > 0 ? yearArr[0].start : Infinity;
        // If any episodeDetails match starts AFTER the year → real episode marker
        const epDetailsAfterYear = epDetailsArr.some((m) => m.start > yearStart);
        if (epDetailsAfterYear) {
          return 'episode';
        }
        // episodeDetails precedes the year → likely a title word → fall through to movie
      } else {
        return 'episode';
      }
    }

    // Check for film indicator
    const film = matches.named('film') as Match[] | Match | undefined;
    if (film && (Array.isArray(film) ? film.length > 0 : true)) {
      return 'movie';
    }

    // Check for date/year patterns
    const date = matches.named('date') as Match[] | Match | undefined;

    if (date && (Array.isArray(date) ? date.length > 0 : true)) {
      if (!year || (Array.isArray(year) ? year.length === 0 : false)) {
        return 'episode';
      }
    }

    // Check for bonus indicator
    const bonus = matches.named('bonus') as Match[] | Match | undefined;
    if (bonus && (Array.isArray(bonus) ? bonus.length > 0 : true)) {
      if (!year || (Array.isArray(year) ? year.length === 0 : false)) {
        return 'episode';
      }
    }

    // Check for CRC32 + anime release group
    const crc32 = matches.named('crc32') as Match[] | Match | undefined;
    const animeReleaseGroup = matches.named(
      'release_group',
      (m) => m.tags.includes('anime'),
    ) as Match[] | Match | undefined;

    if (
      crc32 &&
      (Array.isArray(crc32) ? crc32.length > 0 : true) &&
      animeReleaseGroup &&
      (Array.isArray(animeReleaseGroup) ? animeReleaseGroup.length > 0 : true)
    ) {
      return 'episode';
    }


    // Default to movie
    return 'movie';
  }

  override then(matches: Matches, whenResponse: unknown, _context: Context): void {
    if (!whenResponse) return;

    let typeValue: string;
    let removeWeak = false;

    if (typeof whenResponse === 'string') {
      typeValue = whenResponse;
    } else if (typeof whenResponse === 'object' && whenResponse !== null && 'type' in whenResponse) {
      const resp = whenResponse as { type: string; removeWeak?: boolean };
      typeValue = resp.type;
      removeWeak = !!resp.removeWeak;
    } else {
      return;
    }

    if (removeWeak) {
      // Remove weak episode/season matches so they don't consume text that should
      // belong to the title or release_group.
      const toRemove: Match[] = [];
      for (const name of ['episode', 'season']) {
        const arr = matches.named(name) as Match[] | Match | undefined;
        const items = Array.isArray(arr) ? arr : arr ? [arr] : [];
        for (const m of items) {
          if (m.tags.includes('weak-episode') || m.tags.includes('weak-duplicate')) {
            toRemove.push(m);
          }
        }
      }
      for (const m of toRemove) {
        matches.remove(m);
      }
    }

    addType(matches, typeValue);
  }
}

/**
 * Create a rebulk pattern for type detection.
 */
export function type_(config: Record<string, unknown>): Rebulk {
  const rebulk = new Rebulk({
    disabled: (context: Context) => isDisabled(context, 'type'),
  });
  rebulk.rules(TypeProcessor);
  return rebulk;
}
