import { Rebulk } from 'rebulk-js';
import { Rule, RemoveMatch, AppendMatch, RenameMatch } from 'rebulk-js';
import { Match } from 'rebulk-js';
import { POST_PROCESS } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround, sepsAfter, sepsBefore } from '../common/validators.js';
import { dash, seps , sepsPattern } from '../common/index.js';
import { loadConfigPatterns } from '../../config/index.js';
import { buildOrPattern } from '../../reutils.js';
import { rawCleanup } from '../common/formatters.js';

export function other(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'other') });
  rebulk.regexDefaults({ flags: 'i', abbreviations: [dash] }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({ name: 'other', validator: sepsSurround });

  loadConfigPatterns(rebulk, config['other'] as Record<string, unknown>);

  openingEndingCredits(rebulk);

  rebulk.rules(
    AppendCreditless,
    AppendOpedEndingCredits,
    ValidateStereoVRContext,
    RenameAnotherToOther,
    ValidateHasNeighbor,
    ValidateHasNeighborAfter,
    ValidateHasNeighborBefore,
    ValidateScreenerRule,
    ValidateMuxRule,
    ValidateHardcodedSubs,
    ValidateStreamingServiceNeighbor,
    ValidateAtEnd,
    ValidateSubtitleFlag,
    HearingImpairedLanguageToSDH,
    ValidateReal,
    RemoveTitleCaseAmbiguous,
    ImageArtKeywordToOther,
    ProperCountRule,
    FixCountRule
  );

  return rebulk;
}

/**
 * In an image file (a filepart with an image container — .jpg/.png/…), a
 * title/alternative_title/episode_title that is exactly an artwork keyword is the
 * artwork kind, not a title — e.g. "poster.jpg" → other "Poster";
 * "Movie.2020-fanart.jpg" → other "Fanart". Scoped to image fileparts so it can
 * never clobber a real video title that happens to contain such a word. (#273)
 */
const ART_KEYWORDS: Record<string, string> = {
  poster: 'Poster', fanart: 'Fanart', banner: 'Banner', thumb: 'Thumbnail',
  thumbnail: 'Thumbnail', landscape: 'Landscape', cover: 'Cover',
  clearart: 'Clear Art', clearlogo: 'Clear Logo', logo: 'Logo', discart: 'Disc Art',
};
class ImageArtKeywordToOther extends Rule {
  static priority = POST_PROCESS;
  consequence = [RemoveMatch, AppendMatch];

  when(matches: any): [Match[], Match[]] | false {
    const toRemove: Match[] = [];
    const toAppend: Match[] = [];
    for (const fp of matches.markers.named('path') as Match[]) {
      const hasImage = matches.range(fp.start, fp.end,
        (m: Match) => m.name === 'container' && m.tags?.includes('image'), 0);
      if (!hasImage) continue;
      const cands = matches.range(fp.start, fp.end,
        (m: Match) => ['title', 'alternative_title', 'episode_title'].includes(m.name ?? '')) as Match[];
      for (const c of cands) {
        const key = String(c.value ?? '').trim().toLowerCase().replace(/[\s._-]+/g, '');
        const canon = ART_KEYWORDS[key];
        if (!canon) continue;
        toRemove.push(c);
        toAppend.push(new Match(c.start, c.end, { name: 'other', value: canon, inputString: matches.inputString }));
      }
    }
    return toRemove.length ? [toRemove, toAppend] : false;
  }
}

// Ordinal of an opening/ending sequence, e.g. "2" in "OP02" or "4a" in "OP4a".
// Kept as a string because of variant-letter forms. The leading version "v" is
// excluded so "ED2v2" yields number "2", version 2. `[^\W\d_]` (a letter) avoids
// a literal '-' which the dash abbreviation would corrupt. (upstream 4.x)
const CREDITS_NUMBER = `(?P<credits_number>\\d+(?:(?![vV]\\d)[^\\W\\d_])?)?`;
const CREDITS_VERSION = `(?:-?[vV](?P<version>\\d+))?`;
const CREDITS_SUFFIX = CREDITS_NUMBER + CREDITS_VERSION;

function formatCreditsNumber(value: string): string {
  const m = /^(\d+)(\w?)$/.exec(value);
  if (!m) return value;
  return String(parseInt(m[1], 10)) + m[2].toLowerCase();
}

/**
 * Match anime opening/ending credit sequences (OP/ED, NCOP/NCED, creditless…).
 * Emits other: "Opening Credits"/"Ending Credits" plus credits_number ("4a") and
 * version. Bare OP/ED tokens are uppercase-only so the name "Ed" is never captured.
 */
function openingEndingCredits(rebulk: Rebulk) {
  const add = (pattern: string, value: string, ignoreCase: boolean) => {
    rebulk.regex(
      `(?P<other>` + pattern + `)` + CREDITS_SUFFIX,
      {
        flags: ignoreCase ? 'i' : '',
        name: 'other',
        children: true,
        privateParent: true,
        validateAll: true,
        validator: { __parent__: sepsSurround },
        formatter: {
          other: () => value,
          credits_number: formatCreditsNumber,
          version: (v: string) => parseInt(v, 10),
        },
        disabled: (context: any) => isDisabled(context, 'other'),
      } as any,
    );
  };
  // NC*/creditless forms are unambiguous — case-insensitive.
  add(`NC-?OP|creditless-?op(?:ening)?`, 'Opening Credits', true);
  add(`NC-?ED|creditless-?(?:ed|ending)`, 'Ending Credits', true);
  // Bare uppercase tokens. OPED is the combined opening+ending sequence.
  add(`OPED|OP`, 'Opening Credits', false);
  add(`ED`, 'Ending Credits', false);
}

/**
 * Surface a `Creditless` other value for creditless opening/ending tokens
 * (the NC-/creditless- forms). OPED is opening+ending, not creditless. (upstream 4.x)
 */
class AppendCreditless extends Rule {
  static override priority = POST_PROCESS;
  override priority = POST_PROCESS;
  override consequence = AppendMatch;
  static properties = { other: ['Creditless'] };

  when(matches: any, _context: any): any {
    const toAppend: any[] = [];
    for (const match of matches.named('other', (m: Match) =>
      m.value === 'Opening Credits' || m.value === 'Ending Credits') ?? []) {
      const raw = (match.raw ?? '').toLowerCase().replace(/[\s._-]+/g, '');
      if (raw.startsWith('nc') || raw.includes('creditless')) {
        toAppend.push(new Match(match.start, match.end, {
          name: 'other', value: 'Creditless', inputString: matches.inputString,
        }));
      }
    }
    return toAppend.length ? toAppend : false;
  }
}

/**
 * OPED is the combined opening AND ending sequence — add the missing
 * `Ending Credits` value over the same span. (upstream 4.x)
 */
class AppendOpedEndingCredits extends Rule {
  static override priority = POST_PROCESS;
  override priority = POST_PROCESS;
  override consequence = AppendMatch;
  static properties = { other: ['Ending Credits'] };

  when(matches: any, _context: any): any {
    const toAppend: any[] = [];
    for (const match of matches.named('other', (m: Match) => m.value === 'Opening Credits') ?? []) {
      if ((match.raw ?? '').toLowerCase().replace(/[\s._-]+/g, '') === 'oped') {
        toAppend.push(new Match(match.start, match.end, {
          name: 'other', value: 'Ending Credits', inputString: matches.inputString,
        }));
      }
    }
    return toAppend.length ? toAppend : false;
  }
}

const STEREO_VR_CONTEXT_TAG = 'stereo-vr-context';
const VR_CONTEXT_VALUES = new Set(['Virtual Reality', '3D']);

/**
 * A stereoscopic abbreviation (SBS/LR/TB/OU) is ambiguous on its own (SBS is
 * also a broadcaster). Keep it only when its filepart carries a VR/3D signal —
 * and then let it win its span over a colliding streaming_service. (upstream 4.x)
 */
class ValidateStereoVRContext extends Rule {
  static override priority = 64;
  override priority = 64;
  override consequence = RemoveMatch;

  when(matches: any, _context: any): any {
    const toRemove: any[] = [];
    const fileparts = matches.markers.named('path') as Match[];
    for (const filepart of Array.isArray(fileparts) ? fileparts : fileparts ? [fileparts] : []) {
      const gated = matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'other' && m.tags.includes(STEREO_VR_CONTEXT_TAG)) as Match[];
      if (!gated?.length) continue;
      const hasVrContext = (matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'other' && VR_CONTEXT_VALUES.has(String(m.value))) as Match[])?.length > 0;
      if (hasVrContext) {
        for (const stereo of gated) {
          toRemove.push(...(matches.range(stereo.start, stereo.end,
            (m: Match) => m.name === 'streaming_service') as Match[] ?? []));
        }
      } else {
        toRemove.push(...gated);
      }
    }
    return toRemove.length ? toRemove : false;
  }
}

const TOKEN_START = `(?<![^\\W_])`;

export function completeWords(
  rebulk: Rebulk,
  opts: {
    completeMarkerWords: string[];
    seasonWords: string[];
    completeArticleWords: string[];
    completePrefixWords: string[];
    seasonNumberSeparators: string[];
  },
) {
  const completeMarkerPattern = buildOrPattern(opts.completeMarkerWords);
  const seasonWordsPattern = buildOrPattern(opts.seasonWords);
  const completeArticleWordsPattern = buildOrPattern(opts.completeArticleWords);
  // The season numbers listed between the season word and the marker: "1", "1 & 2", "1 and 2".
  const seasonNumbersPattern =
    `(?:-+(?:\\d+|` + buildOrPattern(opts.seasonNumberSeparators, undefined, true) + `))+-+`;

  function validateComplete(match: Match) {
    const children = match.children;
    if (!children.named('completeWordsBefore') && !children.named('completeWordsAfter')) {
      return false;
    }
    return true;
  }

  rebulk.regex(
    TOKEN_START +
    `(?P<completeArticle>${completeArticleWordsPattern}-)?` +
    `(?P<completeWordsBefore>${seasonWordsPattern}-)?` +
    completeMarkerPattern +
    `(?P<completeWordsAfter>-${seasonWordsPattern})?`,
    {
      privateNames: ['completeArticle', 'completeWordsBefore', 'completeWordsAfter'],
      value: { other: 'Complete' },
      tags: ['release-group-prefix'],
      validator: {
        __parent__: (m: Match) => sepsSurround(m) && validateComplete(m),
      },
    }
  );

  // "Season 1 Complete", "Seasons 1 & 2 - Complete": the season numbers sit between the
  // season word and the marker, so the adjacency pattern above cannot see the word.
  rebulk.regex(
    seasonWordsPattern + seasonNumbersPattern + `(?P<other>` + completeMarkerPattern + `)`,
    {
      children: true,
      privateParent: true,
      validateAll: true,
      value: { other: 'Complete' },
      tags: ['release-group-prefix'],
      validator: { __parent__: sepsSurround },
    }
  );

  // "L'Intégrale", "Coffret Intégrale": the prefix carries the completeness with no season
  // word to anchor on. The separator is optional because the French elided article glues to
  // the marker ("L'Intégrale" is a single token).
  rebulk.regex(
    TOKEN_START +
    `(?P<completePrefix>` + buildOrPattern(opts.completePrefixWords) + `-?)` +
    completeMarkerPattern,
    {
      privateNames: ['completePrefix'],
      value: { other: 'Complete' },
      tags: ['release-group-prefix'],
      validator: { __parent__: sepsSurround },
    }
  );
}

class ProperCountRule extends Rule {
  static priority = POST_PROCESS;
  static consequence = AppendMatch;
  static properties = { proper_count: [null] };

  when(matches: any, context: Record<string, unknown>) {
    const propers = matches.named('other', (m: Match) => m.value === 'Proper');
    if (!propers || propers.length === 0) {
      return;
    }

    const raws: Record<string, Match> = {};
    for (const proper of propers) {
      raws[rawCleanup(proper.raw)] = proper;
    }

    let value = 0;
    let start: number | null = null;
    let end: number | null = null;

    for (const proper of Object.values(raws)) {
      if (!start || start > proper.start) {
        start = proper.start;
      }
      if (!end || end < proper.end) {
        end = proper.end;
      }
      const properCount = proper.children.named('proper_count', null, 0) as Match | undefined;
      if (properCount) {
        value += parseInt(String((properCount as Match).value), 10);
      } else if (proper.tags.includes('real')) {
        value += 2;
      } else {
        value += 1;
      }
    }

    const properCountMatch = new Match(start!, end!, {
      name: 'proper_count',
    });
    properCountMatch.value = value;

    return [properCountMatch];
  }
}

class FixCountRule extends Rule {
  static priority = POST_PROCESS;
  static consequence = AppendMatch;
  static properties = { proper_count: [null] };

  when(matches: any) {
    const fixes = (matches.named('other', (m: Match) => m.value === 'Fix') as Match[])
      .filter((m: Match) => {
        // Only standalone Fix/Fixed should generate proper_count.
        // Compound fixes like Dirfix, Nfofix, Prooffix should not.
        const raw = rawCleanup(m.raw ?? '').toLowerCase();
        return raw === 'fix' || raw === 'fixed';
      });
    if (!fixes || fixes.length === 0) return;

    // Check if proper_count already set
    const existing = matches.named('proper_count');
    if (existing && (Array.isArray(existing) ? existing.length > 0 : true)) return;

    let start: number | null = null;
    let end: number | null = null;
    for (const fix of fixes) {
      if (start === null || fix.start < start) start = fix.start;
      if (end === null || fix.end > end) end = fix.end;
    }

    const m = new Match(start!, end!, { name: 'proper_count' });
    m.value = -1;
    return [m];
  }
}

/**
 * SDH / Forced / CC describe a subtitle track, so they only mean anything in a
 * subtitle file. Without that guard the tail of a dash-joined release group is
 * read as a flag — the group "SC-SDH" ("…H.264-SC-SDH") would lose its name, and
 * "CC" is also the Criterion edition.
 */
class ValidateSubtitleFlag extends Rule {
  static override priority = 64;
  override priority = 64;
  override consequence = RemoveMatch;

  when(matches: any, _context: any): any {
    const flags = matches.named('other',
      (m: Match) => m.tags?.includes('subtitle-flag')) as Match[] | undefined;
    if (!flags?.length) return false;
    const out: Match[] = [];
    for (const flag of flags) {
      const filepart = matches.markers.atMatch(flag, (m: Match) => m.name === 'path', 0);
      if (!filepart) { out.push(flag); continue; }
      const subtitleContainer = matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'container' && m.tags?.includes('subtitle'), 0);
      if (!subtitleContainer) out.push(flag);
    }
    return out.length ? out : false;
  }
}

/**
 * "Movie…eng.hi.srt" is an English subtitle for the hearing-impaired, not an
 * English *and* Hindi one. A trailing "hi" only reads as Hindi when it is the
 * file's only language — behind another subtitle language in a subtitle file it
 * is the same flag SDH spells out.
 */
class HearingImpairedLanguageToSDH extends Rule {
  static override priority = POST_PROCESS;
  override priority = POST_PROCESS;
  override consequence = [RemoveMatch, AppendMatch];

  when(matches: any, _context: any): any {
    const toRemove: Match[] = [];
    const toAppend: Match[] = [];
    for (const filepart of (matches.markers.named('path') as Match[]) ?? []) {
      const subtitleContainer = matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'container' && m.tags?.includes('subtitle'), 0);
      if (!subtitleContainer) continue;
      const langs = (matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'subtitle_language' && !m.private) as Match[] ?? [])
        .slice().sort((a, b) => a.start - b.start);
      if (langs.length < 2) continue;
      const last = langs[langs.length - 1];
      if (String(last.raw ?? '').trim().toLowerCase() !== 'hi') continue;
      toRemove.push(last);
      toAppend.push(new Match(last.start, last.end, {
        name: 'other', value: 'SDH', inputString: matches.inputString,
      }));
    }
    return toRemove.length ? [toRemove, toAppend] : false;
  }
}

class RenameAnotherToOther extends Rule {
  static priority = 32;
  static consequence = new RenameMatch('other');

  when(matches: any) {
    return matches.named('another');
  }
}

class ValidateHasNeighbor extends Rule {
  static consequence = RemoveMatch;
  static priority = 64;

  when(matches: any) {
    const ret = [];
    for (const toCheck of matches.range(0, undefined, (m: Match) => m.tags.includes('has-neighbor'))) {
      let previousMatch = matches.previous(toCheck, (m: Match) => true, 0);
      let previousGroup = matches.markers.previous(
        toCheck,
        (m: Match) => m.name === 'group',
        0
      );
      if (previousGroup && (!previousMatch || previousGroup.end > previousMatch.end)) {
        previousMatch = previousGroup;
      }
      if (
        previousMatch &&
        !matches.inputString
          .slice(previousMatch.end, toCheck.start)
          .replace(new RegExp(`[${sepsPattern}]`, 'g'), '')
      ) {
        continue;
      }
      let nextMatch = matches.next(toCheck, (m: Match) => true, 0);
      let nextGroup = matches.markers.next(toCheck, (m: Match) => m.name === 'group', 0);
      if (nextGroup && (!nextMatch || nextGroup.start < nextMatch.start)) {
        nextMatch = nextGroup;
      }
      if (
        nextMatch &&
        !matches.inputString
          .slice(toCheck.end, nextMatch.start)
          .replace(new RegExp(`[${sepsPattern}]`, 'g'), '')
      ) {
        continue;
      }
      ret.push(toCheck);
    }
    return ret;
  }
}

class ValidateHasNeighborBefore extends Rule {
  static consequence = RemoveMatch;
  static priority = 64;

  when(matches: any) {
    const ret = [];
    for (const toCheck of matches.range(0, undefined, (m: Match) => m.tags.includes('has-neighbor-before'))) {
      let previousMatch = matches.previous(toCheck, (m: Match) => true, 0);
      let previousGroup = matches.markers.previous(
        toCheck,
        (m: Match) => m.name === 'group',
        0
      );
      if (previousGroup && (!previousMatch || previousGroup.end > previousMatch.end)) {
        previousMatch = previousGroup;
      }
      if (
        previousMatch &&
        !matches.inputString
          .slice(previousMatch.end, toCheck.start)
          .replace(new RegExp(`[${sepsPattern}]`, 'g'), '')
      ) {
        continue;
      }
      ret.push(toCheck);
    }
    return ret;
  }
}

class ValidateHasNeighborAfter extends Rule {
  static consequence = RemoveMatch;
  static priority = 64;

  when(matches: any) {
    const ret = [];
    for (const toCheck of matches.range(0, undefined, (m: Match) =>
      m.tags.includes('has-neighbor-after')
    )) {
      let nextMatch = matches.next(toCheck, (m: Match) => true, 0);
      let nextGroup = matches.markers.next(toCheck, (m: Match) => m.name === 'group', 0);
      if (nextGroup && (!nextMatch || nextGroup.start < nextMatch.start)) {
        nextMatch = nextGroup;
      }
      if (
        nextMatch &&
        !matches.inputString
          .slice(toCheck.end, nextMatch.start)
          .replace(new RegExp(`[${sepsPattern}]`, 'g'), '')
      ) {
        continue;
      }
      ret.push(toCheck);
    }
    return ret;
  }
}

class ValidateScreenerRule extends Rule {
  static consequence = RemoveMatch;
  static priority = 64;

  when(matches: any) {
    const ret = [];
    for (const screener of matches.named(
      'other',
      (m: Match) => m.tags.includes('other.validate.screener')
    )) {
      const sourceMatch = matches.previous(
        screener,
        (m: Match) => m.initiator?.name === 'source',
        0
      );
      if (!sourceMatch || matches.inputString
        .slice(sourceMatch.end, screener.start)
        .replace(new RegExp(`[${sepsPattern}]`, 'g'), '')) {
        ret.push(screener);
      }
    }
    return ret;
  }
}

class ValidateMuxRule extends Rule {
  static consequence = RemoveMatch;
  static priority = 64;

  when(matches: any) {
    const ret = [];
    for (const mux of matches.named(
      'other',
      (m: Match) => m.tags.includes('other.validate.mux')
    )) {
      const sourceMatch = matches.previous(
        mux,
        (m: Match) => m.initiator?.name === 'source',
        0
      );
      if (!sourceMatch) {
        ret.push(mux);
      }
    }
    return ret;
  }
}

class ValidateHardcodedSubs extends Rule {
  static priority = 32;
  static consequence = RemoveMatch;

  when(matches: any) {
    // In Python guessit, standalone HC (no adjacent subtitle_language) is kept in other.
    // Only remove HC when a subtitle_language is present elsewhere in the filepart but
    // is NOT directly adjacent (with no holes between) — this prevents false HC tagging.
    // For practical purposes: keep all HC matches (never remove standalone HC).
    // HC adjacent to subtitle_language is also kept (it strengthens the subtitle info).
    return [];
  }
}

class ValidateStreamingServiceNeighbor extends Rule {
  static priority = 32;
  static consequence = RemoveMatch;

  when(matches: any) {
    const toRemove = [];
    for (const match of matches.named(
      'other',
      (m: Match) =>
        m.initiator?.name !== 'source' &&
        (m.tags.includes('streaming_service.prefix') ||
          m.tags.includes('streaming_service.suffix'))
    )) {
      let initiatorMatch = match.initiator;
      if (!sepsAfter(initiatorMatch)) {
        if (initiatorMatch.tags.includes('streaming_service.prefix')) {
          const nextMatch = matches.next(
            initiatorMatch,
            (m: Match) => m.name === 'streaming_service',
            0
          );
          if (
            nextMatch &&
            !(matches.holes(initiatorMatch.end, nextMatch.start, (m: Match) =>
              String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')
            ) as Match[]).length
          ) {
            continue;
          }
        }
        if (initiatorMatch.children) {
          toRemove.push(...initiatorMatch.children);
        }
        toRemove.push(initiatorMatch);
      } else if (!sepsBefore(initiatorMatch)) {
        if (initiatorMatch.tags.includes('streaming_service.suffix')) {
          const previousMatch = matches.previous(
            initiatorMatch,
            (m: Match) => m.name === 'streaming_service',
            0
          );
          if (
            previousMatch &&
            !(matches.holes(previousMatch.end, initiatorMatch.start, (m: Match) =>
              String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')
            ) as Match[]).length
          ) {
            continue;
          }
        }

        if (initiatorMatch.children) {
          toRemove.push(...initiatorMatch.children);
        }
        toRemove.push(initiatorMatch);
      }
    }

    return toRemove;
  }
}

class ValidateAtEnd extends Rule {
  static priority = 32;
  static consequence = RemoveMatch;

  when(matches: any) {
    const toRemove = [];
    for (const filepart of matches.markers.named('path')) {
      for (const match of matches.range(
        filepart.start,
        filepart.end,
        (m: Match) => m.name === 'other' && m.tags.includes('at-end')
      )) {
        if (
          (matches.holes(match.end, filepart.end, (m: Match) =>
            String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')
          ) as Match[]).length ||
          (matches.range(match.end, filepart.end, (m: Match) =>
            !['other', 'container'].includes(m.name ?? '')
          ) as Match[]).length
        ) {
          toRemove.push(match);
        }
      }
    }

    return toRemove;
  }
}

/**
 * Remove ambiguous word-values (Proper←"real", Converted←"convert",
 * Camera←"cam") when their raw text is Title-Case (initial capital, rest
 * lowercase). Scene tags are ALL-CAPS ("REAL", "CAM", "CONVERT") or all-lower;
 * a Title-Case spelling means it's a title word, e.g. "The Cam", "Something
 * Real", "The Convert". Runs before TitleFromPosition so the freed word rejoins
 * the title/episode_title. (Issues #732, #743, #746, #784.)
 */
class RemoveTitleCaseAmbiguous extends Rule {
  static consequence = RemoveMatch;
  static priority = 64;

  // Exact Title-Case spellings of words that double as common title words. The
  // canonical tag spellings ("PROPER", "REAL.PROPER", "CAM", "CONVERT") and
  // lowercase scene spellings are unaffected; only the Title-Case word is removed.
  when(matches: any) {
    const TITLE_WORDS = new Set(['Real', 'Cam', 'Convert']);
    const RELEASE_META = new Set(['screen_size', 'video_codec', 'audio_codec', 'video_profile', 'release_group']);
    const ret: Match[] = [];
    for (const m of matches.range(0, matches.inputString?.length ?? 0) as Match[]) {
      if (m.name !== 'other' && m.name !== 'source') continue;
      if (!TITLE_WORDS.has(m.raw ?? '')) continue;
      // A word surrounded by release metadata is a real scene tag regardless of its
      // case: "Show.S01E01.Cam.720p.x264" is a CAM release. (upstream #732 refinement)
      const filepart = matches.markers.atMatch(m, (marker: Match) => marker.name === 'path', 0) as Match | undefined;
      const searchEnd = filepart?.end ?? (matches.inputString?.length ?? m.end);
      const metaAfter = (matches.range(m.end, searchEnd,
        (o: Match) => !o.private && RELEASE_META.has(o.name ?? '')) as Match[]) ?? [];
      if (metaAfter.length > 0) continue;
      ret.push(m);
    }
    return ret.length ? ret : false;
  }
}

class ValidateReal extends Rule {
  static consequence = RemoveMatch;
  static priority = 64;

  when(matches: any) {
    const ret = [];
    for (const filepart of matches.markers.named('path')) {
      for (const match of matches.range(
        filepart.start,
        filepart.end,
        (m: Match) => m.name === 'other' && m.tags.includes('real')
      )) {
        // Python: `if not matches.range(...)` — empty list is falsy in Python but truthy in JS.
        // Must check .length explicitly.
        const before = matches.range(filepart.start, match.start) as Match[];
        if (!before || before.length === 0) {
          ret.push(match);
        }
      }
    }

    return ret;
  }
}
