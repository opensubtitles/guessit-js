/**
 * Episodes property — port of guessit/rules/properties/episodes.py
 * Detects season/episode patterns, absolute episodes, and episode details
 */
import { Rebulk, Rule, RemoveMatch, AppendMatch, RenameMatch } from 'rebulk-js';
import { Match } from 'rebulk-js';
import { buildOrPattern } from '../../reutils.js';
import { parseNumber, numericFunction } from '../common/numeral.js';
import { intCoercable, and_, sepsSurround } from '../common/validators.js';
import { cleanup } from '../common/formatters.js';
import { isDisabled } from '../common/pattern.js';
import { seps, altDash } from '../common/index.js';

interface EpisodesConfig {
  season_max_range: number;
  episode_max_range: number;
  max_range_gap: number;
  season_markers: string[];
  season_ep_markers: string[];
  disc_markers: string[];
  episode_markers: string[];
  range_separators: string[];
  discrete_separators: string[];
  season_words: string[];
  episode_words: string[];
  of_words: string[];
  all_words: string[];
}

/**
 * Chain breaker for episode/season chains
 */
function episodesSeasonChainBreaker(
  matches: any,
  config: EpisodesConfig,
): boolean {
  const episodes = matches.named('episode') || [];
  if (
    episodes.length > 1 &&
    Math.abs(episodes[episodes.length - 1].value - episodes[episodes.length - 2].value) >
      config.episode_max_range
  ) {
    return true;
  }

  const seasons = matches.named('season') || [];
  if (seasons.length > 1) {
    const last = seasons[seasons.length - 1].value;
    const prev = seasons[seasons.length - 2].value;
    if (Math.abs(last - prev) > config.season_max_range) {
      return true;
    }
    if (last < prev) {
      return true;
    }
  }

  return false;
}

/**
 * Conflict solver for season/episode patterns
 */
function seasonEpisodeConflictSolver(match: any, other: any): any {
  if (match.name !== other.name) {
    if (match.name === 'episode' && other.name === 'year') {
      return match;
    }
    if (['season', 'episode'].includes(match.name)) {
      if (
        [
          'video_codec',
          'audio_codec',
          'container',
          'date',
        ].includes(other.name)
      ) {
        return match;
      }
      if (
        (other.name === 'audio_channels' &&
          !other.tags?.includes('weak-audio_channels') &&
          !match.initiator?.children?.named(match.name + 'Marker')?.length) ||
        (other.name === 'screen_size' && !intCoercable(other.raw))
      ) {
        return match;
      }
    }
  }
  // Handle cross-chain conflicts between season/episode matches (same or different names).
  // This covers episode vs episode and season vs season where one is from a strong
  // SxxExx chain and the other is from a weak-episode/weak-duplicate chain.
  if (
    ['season', 'episode'].includes(match.name) &&
    ['season', 'episode'].includes(other.name) &&
    match.initiator !== other.initiator
  ) {
    const matchIsWeak = !!(match.tags?.includes('weak-episode') ||
      ['weak_episode', 'weak_duplicate'].includes(match.initiator?.name));
    const otherIsWeak = !!(other.tags?.includes('weak-episode') ||
      ['weak_episode', 'weak_duplicate'].includes(other.initiator?.name));

    // Both weak: don't resolve here — let WeakConflictSolverRule handle disambiguation.
    // WeakConflictSolverRule distinguishes anime (keep weak_episode) from non-anime (keep weak_duplicate).
    if (matchIsWeak && otherIsWeak) {
      return '__default__';
    }
    // Only one is weak: remove it
    if (matchIsWeak) return match;
    if (otherIsWeak) return other;
    // Prefer SxxExx-tagged matches over non-SxxExx when they conflict
    // (e.g. "Ep 2x03": episode-word "Ep 2" vs SxxExx "2x03" → keep SxxExx)
    const matchIsSxxExx = !!match.tags?.includes('SxxExx');
    const otherIsSxxExx = !!other.tags?.includes('SxxExx');
    if (matchIsSxxExx && !otherIsSxxExx) return other;
    if (otherIsSxxExx && !matchIsSxxExx) return match;
    // Neither weak but initiator raw contains 'x' (e.g. spurious season from "x264")
    // Don't remove SxxExx-tagged matches even if they contain 'x' (e.g. "2x03" is valid)
    const matchHasX = match.initiator?.raw?.toLowerCase().includes('x') && !matchIsSxxExx;
    const otherHasX = other.initiator?.raw?.toLowerCase().includes('x') && !otherIsSxxExx;
    if (matchHasX && !otherHasX) return match;
    if (otherHasX && !matchHasX) return other;
  }
  return '__default__';
}

/**
 * Validate ordering of season/episode lists
 */
function orderingValidator(match: any): boolean {
  const values = match.children?.to_dict?.() || {};

  if (values.season && Array.isArray(values.season)) {
    const sorted = [...values.season].sort((a, b) => a - b);
    if (JSON.stringify(sorted) !== JSON.stringify(values.season)) {
      return false;
    }
  }

  if (values.episode && Array.isArray(values.episode)) {
    const sorted = [...values.episode].sort((a, b) => a - b);
    if (JSON.stringify(sorted) !== JSON.stringify(values.episode)) {
      return false;
    }
  }

  return true;
}

/**
 * Validate roman numerals and integer-coercable strings with separators
 */
function validateRoman(match: any): boolean {
  if (intCoercable(match.raw)) {
    return true;
  }
  return sepsSurround(match);
}

/**
 * Build the episodes rebulk
 */
export function episodes(config: EpisodesConfig): Rebulk {
  const subtitleBoth = config.range_separators;
  const discreteSeparators = config.discrete_separators;
  const weakDiscreteSeparators = seps
    .split('')
    .filter(s => !config.range_separators.includes(s));
  const allSeparators = [
    ...config.range_separators,
    ...discreteSeparators,
  ];

  // Word numerals for season word patterns (e.g. "Saison sept")
  const wordNumerals = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
    'un', 'deux', 'trois', 'quatre', 'cinq', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'vingt',
  ];
  const wordNumeralsPat = wordNumerals.join('|');
  const numeralWithWords = `(?:\\d+|[ivxlcdm]+|${wordNumeralsPat})`;
  const numeral = `(?:\\d+|[ivxlcdm]+)`;

  function isSeasonEpisodeDisabled(context: any): boolean {
    return isDisabled(context, 'episode') || isDisabled(context, 'season');
  }

  const rebulk = new Rebulk()
    .regexDefaults({ flags: 'i' })
    .stringDefaults({ ignoreCase: true })
    .defaults({
      privateNames: ['episodeSeparator', 'seasonSeparator', 'episodeMarker', 'seasonMarker'],
      formatter: { season: (v: any) => parseInt(v, 10), episode: (v: any) => parseInt(v, 10), version: (v: any) => parseInt(v, 10) },
      children: true,
      privateParent: true,
      conflictSolver: seasonEpisodeConflictSolver,
      abbreviations: [altDash],
    });

  // Main SxxExx patterns
  const seasonMarkerPattern = buildOrPattern(config.season_markers, 'seasonMarker');
  const episodeMarkerPattern = buildOrPattern(
    [...config.episode_markers, ...config.disc_markers],
    'episodeMarker',
  );
  const allSeparatorsPattern = buildOrPattern(
    [...config.episode_markers, ...config.disc_markers, ...allSeparators],
    'episodeSeparator',
    true,
  );

  // S01E02, S01E02E03, S01E02-E03, etc
  rebulk.chain({
    tags: ['SxxExx'],
    validateAll: true,
    validator: {
      __parent__: and_(sepsSurround, orderingValidator),
    },
    chainBreaker: (matches: any) => episodesSeasonChainBreaker(matches, config),
    disabled: isSeasonEpisodeDisabled,
  })
    .defaults({ tags: ['SxxExx'] })
    .regex(
      seasonMarkerPattern +
        `(?<season>\\d+)@?` +
        episodeMarkerPattern +
        `@?(?<episode>\\d+)`,
    )
    .repeater('+')
    .regex(
      allSeparatorsPattern + `@?(?<episode>\\d+)`,
    )
    .repeater('*');

  // 1x02, 1x02x03 patterns
  const seasonEpMarkerPattern = buildOrPattern(config.season_ep_markers, 'episodeMarker');
  rebulk.chain({
    tags: ['SxxExx'],
    validateAll: true,
    validator: {
      __parent__: and_(sepsSurround, orderingValidator),
    },
    disabled: isSeasonEpisodeDisabled,
  })
    .defaults({ tags: ['SxxExx'] })
    .regex(
      `(?<season>\\d+)@?` + seasonEpMarkerPattern + `@?(?<episode>\\d+)`,
    )
    .repeater('+');

  // 1x02 with additional episodes (1x02x03, 1x02-03)
  rebulk.chain({
    tags: ['SxxExx'],
    validateAll: true,
    validator: {
      __parent__: and_(sepsSurround, orderingValidator),
    },
    disabled: isSeasonEpisodeDisabled,
  })
    .defaults({ tags: ['SxxExx'] })
    .regex(`(?<season>\\d+)@?` + seasonEpMarkerPattern + `@?(?<episode>\\d+)`)
    .regex(
      buildOrPattern(
        [...config.season_ep_markers, ...discreteSeparators, ...config.range_separators],
        'episodeSeparator',
        true,
      ) + `(?<episode>\\d+)`,
    )
    .repeater('*');

  // Season-only: S01, S01S02S03
  const seasonOnlySepPattern = buildOrPattern(
    [...config.season_markers, ...discreteSeparators, ...config.range_separators],
    'seasonSeparator',
    true,
  );
  rebulk.chain({
    tags: ['SxxExx'],
    validateAll: true,
    validator: {
      __parent__: and_(sepsSurround, orderingValidator),
    },
    disabled: isSeasonEpisodeDisabled,
  })
    .defaults({ tags: ['SxxExx'] })
    .regex(seasonMarkerPattern + `(?<season>\\d+)`)
    .regex(`(?<other>Extras)`, { name: 'other', value: 'Extras', tags: ['no-release-group-prefix'] } as any)
    .repeater('?')
    .regex(seasonOnlySepPattern + `(?<season>\\d+)`)
    .repeater('*');

  // Episode details
  for (const detail of ['Special', 'Pilot', 'Unaired', 'Final']) {
    rebulk.string(detail, {
      name: 'episode_details',
      value: detail,
      children: false,
      privateParent: false,
      disabled: (context: any) => isDisabled(context, 'episode_details'),
    });
  }

  // Season-of patterns
  const seasonWordPattern = buildOrPattern(config.season_words, 'seasonMarker');
  const ofWordPattern = buildOrPattern(config.of_words);

  rebulk.chain({
    validateAll: true,
    conflictSolver: seasonEpisodeConflictSolver,
    formatter: { season: parseNumber, season_count: parseNumber },
    validator: {
      __parent__: and_(sepsSurround, orderingValidator),
      season: validateRoman,
      season_count: validateRoman,
    },
    chainBreaker: (matches: any) => episodesSeasonChainBreaker(matches, config),
    disabled: (context: any) =>
      context?.type === 'movie' || isDisabled(context, 'season'),
  })
    .defaults({
      formatter: { season: parseNumber, season_count: parseNumber },
      validator: { season: validateRoman, season_count: validateRoman },
      conflictSolver: seasonEpisodeConflictSolver,
    })
    .regex(seasonWordPattern + `@?(?P<season>${numeralWithWords})`)
    .regex(ofWordPattern + `@?(?P<season_count>${numeral})`)
    .repeater('?')
    .regex(
      `@?` +
        buildOrPattern(
          [...config.range_separators, ...discreteSeparators, '@'],
          'seasonSeparator',
          true,
        ) +
        `@?(?P<season>\\d+)`,
    )
    .repeater('*');

  // Episode patterns
  const episodeWordPattern = buildOrPattern(config.episode_words, 'episodeMarker');

  rebulk.regex(
    `(?<![a-zA-Z])` + episodeWordPattern + `@?(?<episode>\\d+)` +
      `(?:v(?<version>\\d+))?` +
      `(?:@?` + ofWordPattern + `@?(?<count>\\d+))?`,
    {
      disabled: (context: any) =>
        context?.type === 'episode' || isDisabled(context, 'episode'),
    },
  );

  rebulk.regex(
    `(?<![a-zA-Z])` + episodeWordPattern + `@?(?<episode>${numeral})` +
      `(?:v(?<version>\\d+))?` +
      `(?:@?` + ofWordPattern + `@?(?<count>\\d+))?`,
    {
      validator: { episode: validateRoman },
      formatter: { episode: parseNumber },
      disabled: (context: any) =>
        context?.type !== 'episode' || isDisabled(context, 'episode'),
    },
  );

  // S?01-xE/Ex/E/x-All patterns
  rebulk.regex(
    `S?(?<season>\\d+)-?(?:xE|Ex|E|x)-?(?<other>` +
      buildOrPattern(config.all_words) + ')',
    {
      tags: ['SxxExx'],
      formatter: { other: () => 'Complete' },
      disabled: (context: any) => isDisabled(context, 'season'),
    },
  );

  // Weak episode patterns: 12, 13
  rebulk.chain({
    tags: ['weak-episode'],
    disabled: (context: any) =>
      context?.type === 'movie' || isDisabled(context, 'episode'),
  })
    .defaults({ validator: null, tags: ['weak-episode'] })
    .regex(`(?<episode>\\d{2})(?!(?:st|nd|rd|th)\\b)`)
    .regex(`v(?<version>\\d+)`)
    .repeater('?')
    .regex(`(?<episodeSeparator>[x-])(?<episode>\\d{2})`, {
      abbreviations: null,
    } as any)
    .repeater('*');

  // Weak episode patterns: 012, 013
  rebulk.chain({
    tags: ['weak-episode'],
    disabled: (context: any) =>
      context?.type === 'movie' || isDisabled(context, 'episode'),
  })
    .defaults({ validator: null, tags: ['weak-episode'] })
    .regex(`0(?<episode>\\d{1,2})`)
    .regex(`v(?<version>\\d+)`)
    .repeater('?')
    .regex(`(?<episodeSeparator>[x-])0(?<episode>\\d{1,2})`, {
      abbreviations: null,
    } as any)
    .repeater('*');

  // Weak episode patterns: 112, 113
  rebulk.chain({
    tags: ['weak-episode'],
    name: 'weak_episode',
    disabled: (context: any) =>
      context?.type === 'movie' || isDisabled(context, 'episode'),
  })
    .defaults({
      validator: null,
      tags: ['weak-episode'],
      name: 'weak_episode',
    })
    .regex(`(?<episode>\\d{3,4})`)
    .regex(`v(?<version>\\d+)`)
    .repeater('?')
    .regex(`(?<episodeSeparator>[x-])(?<episode>\\d{3,4})`, {
      abbreviations: null,
    } as any)
    .repeater('*');

  // Single digit episodes
  rebulk.chain({
    tags: ['weak-episode'],
    disabled: (context: any) =>
      context?.type !== 'episode' || isDisabled(context, 'episode'),
  })
    .defaults({ validator: null, tags: ['weak-episode'] })
    .regex(`(?<episode>\\d)`)
    .regex(`v(?<version>\\d+)`)
    .repeater('?')
    .regex(`(?<episodeSeparator>[x-])(?<episode>\\d{1,2})`, {
      abbreviations: null,
    } as any)
    .repeater('*');

  // e112, e113, 1e18, 3e19
  rebulk.chain({
    validateAll: true,
    validator: { __parent__: sepsSurround },
    disabled: (context: any) => isDisabled(context, 'episode'),
  })
    .defaults({ validator: null })
    .regex(`(?<season>\\d{1,2})?(?<episodeMarker>e)(?<episode>\\d{1,4})`)
    .regex(`v(?<version>\\d+)`)
    .repeater('?')
    .regex(`(?<episodeSeparator>e|x|-)(?<episode>\\d{1,4})`, {
      abbreviations: null,
    } as any)
    .repeater('*');

  // ep112, ep113
  rebulk.chain({
    disabled: (context: any) => isDisabled(context, 'episode'),
  })
    .defaults({ validator: null })
    .regex(`(?<![a-zA-Z])ep-?(?<episode>\\d{1,4})`)
    .regex(`v(?<version>\\d+)`)
    .repeater('?')
    .regex(`(?<episodeSeparator>ep|e|x|-)(?<episode>\\d{1,4})`, {
     abbreviations: null,
   } as any)
    .repeater('*');

  // cap patterns
  rebulk.chain({
    tags: ['see-pattern'],
    disabled: isSeasonEpisodeDisabled,
  })
    .defaults({ validator: null, tags: ['see-pattern'] })
    .regex(`(?<seasonMarker>cap)@?(?<season>\\d{1,2})(?<episode>\\d{2})(?!\\d)`)
    .regex(`(?<episodeSeparator>[_-])(?<season>\\d{1,2})(?<episode>\\d{2})(?!\\d)`)
    .repeater('?');

  // 102, 0102 (weak duplicate)
  rebulk.chain({
    tags: ['weak-episode', 'weak-duplicate'],
    name: 'weak_duplicate',
    conflictSolver: seasonEpisodeConflictSolver,
    disabled: (context: any) =>
      context?.episode_prefer_number === true ||
      context?.type === 'movie' ||
      isSeasonEpisodeDisabled(context),
  })
    .defaults({
      tags: ['weak-episode', 'weak-duplicate'],
      name: 'weak_duplicate',
      validator: null,
      conflictSolver: seasonEpisodeConflictSolver,
    })
    .regex(`(?<season>\\d{1,2})(?<episode>\\d{2})`)
    .regex(`v(?<version>\\d+)`)
    .repeater('?')
    .regex(`(?<episodeSeparator>x|-)(?<episode>\\d{2})`, {
      abbreviations: null,
    } as any)
    .repeater('*');

  // Version pattern
  rebulk.regex(`v(?<version>\\d+)`, {
    formatter: { version: (v: string) => parseInt(v, 10) },
    disabled: (context: any) => isDisabled(context, 'version'),
  });

  // Detached of X count (e.g. "14 of 21", "14.of.21", "1-of-6")
  // Use @? (altDash abbreviation) so separators like '.' and ' ' are also matched.
  rebulk.regex(
    `(?<episode>\\d+)@?` +
      ofWordPattern +
      `@?(?<episode_count>\\d+)@?` +
      episodeWordPattern + '?',
    {
      formatter: { episode: (v: string) => parseInt(v, 10), episode_count: (v: string) => parseInt(v, 10) },
      preMatchProcessor: (match: any) => {
        match.value = cleanup(match.value);
        return match;
      },
      disabled: (context: any) => isDisabled(context, 'episode'),
    },
  );

  // Minisodes
  rebulk.regex(`Minisodes?`, {
    children: false,
    privateParent: false,
    name: 'episode_format',
    value: 'Minisode',
    disabled: (context: any) => isDisabled(context, 'episode_format'),
  });

  // Add rules for validation and cleanup
  rebulk.rules(
    new DiscMarkerRule(config),
    FixCorruptedGroupBoundaryValues,
    new RangeExpansionRule(config),
    WeakConflictSolverRule,
    RemoveWeakDuplicateRule,
    RemoveWeakIfSxxExxRule,
    AbsoluteEpisodeInGroupRule,
    RemoveInvalidSeasonRule,
    RemoveInvalidEpisodeRule,
    RemoveUndeterminedLanguagesRule,
  );

  return rebulk;
}

/**
 * DiscMarkerRule — when the episode marker is a disc marker (e.g. "D"),
 * rename the episode matches to disc.
 */
class DiscMarkerRule extends Rule {
  static override priority = 128;
  override priority = 128;
  private config: EpisodesConfig;

  constructor(config: EpisodesConfig) {
    super();
    this.config = config;
  }

  when(matches: any, _context: any): any {
    const discMarkers = new Set((this.config.disc_markers || []).map((s: string) => s.toLowerCase()));
    if (discMarkers.size === 0) return false;

    const toRename: any[] = [];
    const episodes: any[] = matches.named('episode', (m: any) => !m.private) || [];
    for (const ep of episodes) {
      const initiator = ep.initiator;
      if (!initiator) continue;
      const children = initiator.children;
      if (!children) continue;
      const markers: any[] = (typeof children.named === 'function'
        ? children.named('episodeMarker')
        : []) || [];
      for (const marker of markers) {
        const markerText = (marker.rawString || marker.raw || marker.value || '').toString().toLowerCase();
        if (discMarkers.has(markerText)) {
          toRename.push(ep);
          break;
        }
      }
    }
    return toRename.length > 0 ? toRename : false;
  }

  then(matches: any, toRename: any, _context: any): void {
    for (const ep of toRename) {
      matches.remove(ep);
      ep.name = 'disc';
      matches.append(ep);
    }
  }
}

/**
 * Fix numeric episode/season values that were corrupted by EnlargeGroupMatches.
 * When a match ends at a group bracket boundary, EnlargeGroupMatches extends the
 * span to include the bracket and shrinks rawEnd by 1. For regex chain children,
 * this can truncate the captured value (e.g. "04" → "0"). This rule detects
 * such cases and re-parses the value from the original input text.
 */
class FixCorruptedGroupBoundaryValues extends Rule {
  when(matches: any, _context: any): any {
    const toFix: Array<{ match: any; correctValue: number }> = [];
    const groups = matches.markers?.named('group') || [];
    const groupArr: any[] = Array.isArray(groups) ? groups : groups ? [groups] : [];

    for (const match of matches) {
      if (match.name !== 'episode' && match.name !== 'season') continue;
      if (typeof match.value !== 'number') continue;

      // Check if this match ends at a group boundary
      const atGroupEnd = groupArr.some((g: any) => match.end === g.end);
      if (!atGroupEnd) continue;

      // Re-read the digits from the original input before the bracket
      const inputStr = matches.inputString || '';
      // Find the digits just before the group boundary (match.end - 1 is the bracket)
      let digitEnd = match.end - 1; // position of the bracket
      let digitStart = digitEnd;
      while (digitStart > match.start && /\d/.test(inputStr[digitStart - 1])) {
        digitStart--;
      }
      if (digitStart >= digitEnd) continue;

      const correctStr = inputStr.slice(digitStart, digitEnd);
      const correctValue = parseInt(correctStr, 10);
      if (isNaN(correctValue) || correctValue === match.value) continue;

      toFix.push({ match, correctValue });
    }

    return toFix.length > 0 ? toFix : false;
  }

  then(matches: any, whenResponse: any, _context: any): void {
    for (const { match, correctValue } of whenResponse) {
      (match as any).value = correctValue;
      // Also fix rawEnd to include the full digit sequence
      const inputStr = matches.inputString || '';
      let digitEnd = match.end - 1;
      if (match.rawEnd < digitEnd) {
        (match as any).rawEnd = digitEnd;
      }
    }
  }
}

/**
 * Expand ranges: when two season/episode values are connected by a range separator,
 * fill in the intermediate values (e.g., S01-S03 -> [1,2,3], E01-04 -> [1,2,3,4]).
 */
class RangeExpansionRule extends Rule {
  consequence = AppendMatch;
  private config: EpisodesConfig;

  constructor(config: EpisodesConfig) {
    super();
    this.config = config;
  }

  when(matches: any, _context: any): any {
    const toAppend: any[] = [];
    const rangeSeps = new Set(this.config.range_separators || ['-', '~', 'to', 'a']);

    // Get filepart markers to restrict range expansion to within the same filepart
    const fileparts = matches.markers?.named('path') || [];
    const filepartArr: any[] = Array.isArray(fileparts) ? fileparts : fileparts ? [fileparts] : [];

    // Helper: find which filepart a match belongs to
    const getFilepart = (m: any): any => {
      for (const fp of filepartArr) {
        if (m.start >= fp.start && m.end <= fp.end) return fp;
      }
      return null;
    };

    for (const name of ['season', 'episode', 'absolute_episode', 'disc']) {
      const maxRange = name === 'season' ? this.config.season_max_range : this.config.episode_max_range;
      const all: any[] = matches.named(name, (m: any) => !m.private) || [];
      if (all.length < 2) continue;

      // Sort by position
      const sorted = [...all].sort((a: any, b: any) => a.start - b.start);

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // Only expand ranges within the same filepart
        const currentFp = getFilepart(current);
        const nextFp = getFilepart(next);
        if (currentFp !== nextFp || !currentFp) continue;

        const curVal = typeof current.value === 'number' ? current.value : parseInt(current.value, 10);
        const nextVal = typeof next.value === 'number' ? next.value : parseInt(next.value, 10);

        if (isNaN(curVal) || isNaN(nextVal)) continue;
        if (nextVal <= curVal) continue;
        const gap = nextVal - curVal;
        if (gap <= 1 || gap > maxRange) continue;

        // Check if connected by a range separator (look at text between them)
        const between = matches.inputString?.slice(current.end, next.start) || '';
        // Strip separator chars and private match text (like season/episode markers) to isolate the range separator
        const betweenClean = between.replace(/[\s._]/g, '').toLowerCase();
        // Also check after stripping known marker letters (s, e, x, etc.)
        const betweenStripMarkers = betweenClean.replace(/[sex]/gi, '');
        const isRange = rangeSeps.has(betweenClean) || rangeSeps.has(betweenStripMarkers);

        // Also check if they share the same initiator (part of same chain)
        const sameChain = current.initiator && current.initiator === next.initiator;
        const discreteSeps = new Set((this.config.discrete_separators || ['+', '&', 'and', 'et']).map((s: string) => s.toLowerCase()));
        const isDiscrete = discreteSeps.has(betweenClean);

        if (isRange || (sameChain && !isDiscrete)) {
          // Fill intermediate values
          for (let v = curVal + 1; v < nextVal; v++) {
            const m = new Match(current.start, next.end, {
              name,
              value: v,
              inputString: matches.inputString,
              tags: current.tags ? [...current.tags] : [],
            });
            toAppend.push(m);
          }
        }
      }
    }

    return toAppend.length > 0 ? toAppend : false;
  }
}

/**
 * Remove invalid season matches
 */
class RemoveInvalidSeasonRule extends Rule {
  consequence = RemoveMatch;
  static override priority = 64;
  override priority = 64;

  when(matches: any, context: any): any {
    const toRemove: any[] = [];

    for (const filepart of matches.markers?.named('path') || []) {
      const strongSeason = matches.range?.(filepart.start, filepart.end, (m: any) =>
        m.name === 'season' && !m.private && m.tags?.includes('SxxExx'),
      )?.[0];

      if (strongSeason?.initiator?.children?.named('episode')) {
        for (const season of matches.range?.(strongSeason.end, filepart.end, (m: any) =>
          m.name === 'season' && !m.private,
        ) || []) {
          if (
            !season.tags?.includes('SxxExx') ||
            !season.initiator?.children?.named('episode')
          ) {
            if (season.initiator) {
              toRemove.push(season.initiator);
              toRemove.push(...(season.initiator.children || []));
            } else {
              toRemove.push(season);
            }
          }
        }
      }
    }

    return toRemove.length > 0 ? toRemove : false;
  }
}

/**
 * Remove invalid episode matches
 */
class RemoveInvalidEpisodeRule extends Rule {
  consequence = RemoveMatch;
  static override priority = 64;
  override priority = 64;

  when(matches: any, context: any): any {
    const toRemove: any[] = [];

    for (const filepart of matches.markers?.named('path') || []) {
      const strongEpisode = matches.range?.(filepart.start, filepart.end, (m: any) =>
        m.name === 'episode' && !m.private && m.tags?.includes('SxxExx'),
      )?.[0];

      if (strongEpisode) {
        const strongMarker = this.getEpisodePrefix(matches, strongEpisode);

        for (const episode of matches.range?.(strongEpisode.end, filepart.end, (m: any) =>
          m.name === 'episode' && !m.private,
        ) || []) {
          if (episode.tags?.includes('SxxExx')) continue;

          const marker = this.getEpisodePrefix(matches, episode);

          const epMarkers = episode.initiator?.children?.named?.('episodeMarker') || [];
          const epMarkerArr: any[] = Array.isArray(epMarkers) ? epMarkers : [epMarkers];
          const hasShortEMarker = epMarkerArr.some((m: any) => {
            const raw = (m.rawString || m.raw || m.value || '').toString().toLowerCase();
            return raw === 'e' || raw === 'ep';
          });

          const shouldRemove = (strongMarker && marker)
            ? strongMarker.value?.toLowerCase?.() !== marker.value?.toLowerCase?.()
            : (!episode.tags?.includes('SxxExx') && !hasShortEMarker);

          if (shouldRemove) {
            if (episode.initiator) {
              toRemove.push(episode.initiator);
              toRemove.push(...(episode.initiator.children || []));
            } else {
              if (marker) toRemove.push(marker);
              toRemove.push(episode);
            }
          }
        }
      }
    }

    return toRemove.length > 0 ? toRemove : false;
  }

  private getEpisodePrefix(matches: any, episode: any): any {
    // Only look for non-private markers — in Python, private names are invisible
    // to lookup methods, so private episodeMarker/episodeSeparator are not found.
    return matches.previous?.(episode, (m: any) =>
      !m.private && ['episodeMarker', 'episodeSeparator'].includes(m.name),
    )?.[0];
  }
}

/**
 * RemoveWeakDuplicate — mirrors Python's RemoveWeakDuplicate.
 *
 * Remove weak-duplicate tagged matches if duplicate patterns exist.
 * For example: "The 100.109" produces two weak_duplicate matches (100 and 109).
 * Keep the LAST one (109 → season=1, episode=9) and remove the earlier (100).
 */
class RemoveWeakDuplicateRule extends Rule {
  consequence = RemoveMatch;
  static override priority = 64;
  override priority = 64;

  when(matches: any, _context: any): any {
    const toRemove: any[] = [];
    const fileparts = matches.markers?.named('path') || [];
    const filepartArr: any[] = Array.isArray(fileparts) ? fileparts : fileparts ? [fileparts] : [];

    for (const filepart of filepartArr) {
      const weakDups: any[] = (matches.range?.(filepart.start, filepart.end,
        (m: any) => m.tags?.includes('weak-duplicate'),
      ) || []).slice().reverse(); // iterate in reverse (keep last)

      const seen: Record<string, Set<any>> = {};
      for (const match of weakDups) {
        const name = match.name ?? '';
        const pattern = match.initiator?.pattern ?? match.pattern ?? null;
        if (!pattern) continue;
        if (!seen[name]) seen[name] = new Set();
        if (seen[name].has(pattern)) {
          toRemove.push(match);
        } else {
          seen[name].add(pattern);
        }
      }
    }

    return toRemove.length > 0 ? toRemove : false;
  }
}

/**
 * Remove undetermined languages (placeholder)
 */
class RemoveUndeterminedLanguagesRule extends Rule {
  consequence = RemoveMatch;
  static override priority = 32;
  override priority = 32;

  when(matches: any, context: any): any {
    // Placeholder implementation
    return false;
  }
}

/**
 * WeakConflictSolverRule — mirrors Python's WeakConflictSolver.
 *
 * Decides between weak_episode (plain number like 679) and weak_duplicate (season+episode like 6+79):
 * - If anime detected (has version/crc32/screen_size-in-brackets): remove weak_duplicate
 * - Otherwise, if weak_duplicate present with no SxxExx and no range episodes: remove weak_episode
 */
class WeakConflictSolverRule extends Rule {
  consequence = RemoveMatch;
  static override priority = 128;
  override priority = 128;

  enabled(context: any): boolean {
    return context?.type !== 'movie';
  }

  private isAnime(matches: any): boolean {
    if ((matches.named('version') as any[])?.length > 0) return true;
    if ((matches.named('crc32') as any[])?.length > 0) return true;
    const groups = matches.markers?.named('group') || [];
    const groupArr: any[] = Array.isArray(groups) ? groups : groups ? [groups] : [];
    for (const group of groupArr) {
      // screen_size inside a group marker
      const screenSizeInGroup = matches.range?.(group.start, group.end, (m: any) =>
        m.name === 'screen_size',
      );
      const hasScreenSize = Array.isArray(screenSizeInGroup)
        ? screenSizeInGroup.length > 0
        : !!screenSizeInGroup;
      if (hasScreenSize) return true;
      // Empty bracket group with non-numeric text (likely anime release group)
      const innerMatches = matches.range?.(group.start, group.end,
        (m: any) => !m.private && !m.tags?.includes('weak-language')) || [];
      const innerArr: any[] = Array.isArray(innerMatches) ? innerMatches : innerMatches ? [innerMatches] : [];
      const nonRG = innerArr.filter((m: any) => m.name !== 'release_group');
      if (nonRG.length === 0) {
        const groupText = (matches.inputString ?? '').slice(group.start + 1, group.end - 1).trim();
        if (groupText && !/^\d+$/.test(groupText)) return true;
      }
    }
    return false;
  }

  when(matches: any, _context: any): any {
    const toRemove: any[] = [];

    const animeDetected = this.isAnime(matches);

    const fileparts = matches.markers?.named('path') || [];
    const filepartArr: any[] = Array.isArray(fileparts) ? fileparts : fileparts ? [fileparts] : [];

    for (const filepart of filepartArr) {
      const weakMatches: any[] = matches.range?.(filepart.start, filepart.end, (m: any) =>
        m.initiator?.name === 'weak_episode',
      ) || [];

      const weakDupMatches: any[] = matches.range?.(filepart.start, filepart.end, (m: any) =>
        m.initiator?.name === 'weak_duplicate',
      ) || [];

      if (animeDetected) {
        // Anime: remove weak_duplicate, keep weak_episode
        if (weakMatches.length > 0) {
          toRemove.push(...weakDupMatches);
        }
      } else if (weakDupMatches.length > 0) {
        // Check for episodes in range (weak_episode with episodeSeparator child)
        const episodesInRange: any[] = matches.range?.(filepart.start, filepart.end, (m: any) => {
          if (m.name !== 'episode' || m.initiator?.name !== 'weak_episode') return false;
          const children = m.initiator?.children;
          if (!children) return false;
          if (Array.isArray(children)) return children.some((c: any) => c.name === 'episodeSeparator');
          if (typeof children.named === 'function') return (children.named('episodeSeparator') || []).length > 0;
          return false;
        }) || [];

        const hasSxxExx = (matches.range?.(filepart.start, filepart.end, (m: any) =>
          m.tags?.includes('SxxExx') && !m.private,
        ) || []).length > 0;

        if (episodesInRange.length === 0 && !hasSxxExx) {
          // Remove weak_episode matches, keep weak_duplicate
          toRemove.push(...weakMatches);
        } else if (episodesInRange.length > 0) {
          // Remove weak_duplicate, keep weak_episode range
          toRemove.push(...weakDupMatches);
        }
      }
    }

    return toRemove.length > 0 ? toRemove : false;
  }
}

/**
 * RemoveWeakIfSxxExxRule — mirrors Python's RemoveWeakIfSxxExx.
 *
 * When an SxxExx match exists in a filepart:
 * - Remove weak-duplicate matches (season+episode combos like 102 → S01E02)
 * - Rename weak_episode matches (3-4 digit absolute numbers like 313) to absolute_episode
 * - Remove 2-digit weak-episode matches (they're just noise when SxxExx is present)
 */
/**
 * AbsoluteEpisodeInGroupRule — when episodes exist both inside and outside a group marker
 * (parentheses), rename the group-interior episodes to absolute_episode.
 * E.g. "Fairy_Tail_2_-_16-20_(191-195)_[720p]" → episodes 16-20, absolute_episode 191-195.
 */
class AbsoluteEpisodeInGroupRule extends Rule {
  static override priority = -1;
  override priority = -1;

  when(matches: any, _context: any): any {
    const toRename: any[] = [];

    const fileparts = matches.markers?.named('path') || [];
    const filepartArr: any[] = Array.isArray(fileparts) ? fileparts : [fileparts];

    for (const filepart of filepartArr) {
      const episodes: any[] = (matches.range?.(filepart.start, filepart.end, (m: any) =>
        m.name === 'episode' && !m.private,
      ) || []);
      if (episodes.length < 2) continue;

      const groups = matches.markers?.named?.('group') || [];
      const groupArr: any[] = Array.isArray(groups) ? groups : groups ? [groups] : [];
      const relevantGroups = groupArr.filter((g: any) => g.start >= filepart.start && g.end <= filepart.end);

      const isInGroup = (m: any) =>
        relevantGroups.some((g: any) => m.start >= g.start && m.end <= g.end);

      const insideGroup = episodes.filter(isInGroup);
      const outsideGroup = episodes.filter((m: any) => !isInGroup(m));

      if (insideGroup.length > 0 && outsideGroup.length > 0) {
        toRename.push(...insideGroup);
      }
    }

    if (toRename.length === 0) return false;
    (this as any)._toRename = toRename;
    return true;
  }

  then(matches: any, _whenResponse: any, _context: any): void {
    const toRename = (this as any)._toRename || [];
    for (const match of toRename) {
      matches.remove(match);
      match.name = 'absolute_episode';
      matches.append(match);
    }
  }
}

class RemoveWeakIfSxxExxRule extends Rule {
  consequence = RemoveMatch;
  static override priority = 64;
  override priority = 64;

  when(matches: any, _context: any): any {
    const toRemove: any[] = [];
    const toRename: any[] = [];

    const fileparts = matches.markers?.named('path') || [];
    const filepartArr = Array.isArray(fileparts) ? fileparts : [fileparts];

    for (const filepart of filepartArr) {
      const sxxexxMatches = matches.range?.(filepart.start, filepart.end, (m: any) =>
        !m.private && m.tags?.includes('SxxExx'),
      ) || [];
      const hasSxxExx = Array.isArray(sxxexxMatches) ? sxxexxMatches.length > 0 : !!sxxexxMatches;

      if (hasSxxExx) {
        const weakEpisodes: any[] = (matches.range?.(filepart.start, filepart.end, (m: any) =>
          m.tags?.includes('weak-episode'),
        ) || []);

        // Collect weak_episode matches and check if any form a range
        const weakEpByInitiator = new Map<any, any[]>();
        for (const match of weakEpisodes) {
          const init = match.initiator;
          if (!weakEpByInitiator.has(init)) weakEpByInitiator.set(init, []);
          weakEpByInitiator.get(init)!.push(match);
        }

        for (const match of weakEpisodes) {
          const initiator = match.initiator;
          const isWeakEpisode = match.name === 'episode' && initiator?.name === 'weak_episode';
          // Check if this weak_episode is part of a range (has episodeSeparator child
          // or multiple episode siblings from the same initiator)
          const siblings = weakEpByInitiator.get(initiator) || [];
          const isRange = siblings.filter((s: any) => s.name === 'episode').length > 1;
          // Check if surrounded by separators (standalone number)
          const inp = matches.inputString || '';
          const mStart = initiator?.start ?? match.start;
          const mEnd = initiator?.end ?? match.end;
          const prevChar = mStart > 0 ? inp[mStart - 1] : '';
          const nextChar = mEnd < inp.length ? inp[mEnd] : '';
          const isSurrounded = (!prevChar || seps.includes(prevChar)) &&
                              (!nextChar || seps.includes(nextChar));
          if (isWeakEpisode && isSurrounded && isRange) {
            toRename.push(match);
          } else {
            toRemove.push(match);
          }
        }
      }
    }

    // Store renames on the rule instance for then() to process
    (this as any)._toRename = toRename;
    return toRemove.length > 0 || toRename.length > 0 ? toRemove : false;
  }

  then(matches: any, toRemove: any, _context: any): void {
    // Remove matches
    if (toRemove && Array.isArray(toRemove)) {
      for (const match of toRemove) {
        matches.remove(match);
      }
    }
    // Rename weak_episode to absolute_episode
    const toRename = (this as any)._toRename || [];
    for (const match of toRename) {
      matches.remove(match);
      match.name = 'absolute_episode';
      matches.append(match);
    }
  }
}
