import { Rebulk } from 'rebulk-js';
import { Rule, AppendMatch, RemoveMatch } from 'rebulk-js';
import { Match } from 'rebulk-js';
import { seps , sepsPattern } from '../common/index.js';
import { buildExpectedFunction } from '../common/expected.js';
import { cleanup, strip } from '../common/formatters.js';
import { isDisabled } from '../common/pattern.js';
import { intCoercable, sepsSurround } from '../common/validators.js';
import { markerSorted } from '../common/comparators.js';

export function releaseGroup(config: Record<string, unknown>) {
  const forbiddenGroupnames = config['forbidden_names'] as string[];
  const groupnameIgnoreSeps = config['ignored_seps'] as string;
  const groupnameSeps = seps
    .split('')
    .filter((c) => !groupnameIgnoreSeps.includes(c))
    .join('');

  function cleanGroupname(str: string): string {
    // Step 1: Strip groupname seps (seps minus ignored bracket-like chars) from both ends.
    // We use groupnameSeps (not full seps) so brackets/parens are preserved inside.
    let result = strip(str, groupnameSeps);

    // Step 2: Only strip ignored_seps from ends if the string doesn't have them
    // as surrounding brackets AND doesn't contain them internally.
    const containsIgnored = groupnameIgnoreSeps.split('').some((c) => result.includes(c));
    const startsWithIgnored = groupnameIgnoreSeps.split('').some((c) => result.startsWith(c));
    const endsWithIgnored = groupnameIgnoreSeps.split('').some((c) => result.endsWith(c));
    if (!(startsWithIgnored && endsWithIgnored) && !containsIgnored) {
      result = strip(result, groupnameIgnoreSeps);
    }

    // Step 3: Strip forbidden names from start/end.
    for (const forbidden of forbiddenGroupnames) {
      if (
        result.toLowerCase().startsWith(forbidden) &&
        result.length > forbidden.length &&
        seps.includes(result[forbidden.length])
      ) {
        result = strip(result.slice(forbidden.length), groupnameSeps);
      }
      if (
        result.toLowerCase().endsWith(forbidden) &&
        result.length > forbidden.length &&
        seps.includes(result[result.length - forbidden.length - 1])
      ) {
        result = strip(result.slice(0, result.length - forbidden.length), groupnameSeps);
      }
    }

    // Step 4: Remove unmatched closing bracket/paren characters at the end.
    // e.g. "tigole)" → "tigole", "TrollHD ]" → "TrollHD"
    result = result.replace(/\s*[)\]]\s*$/, (m) => {
      const closing = m.trim();
      const opening = closing === ')' ? '(' : '[';
      return result.includes(opening) ? m : '';
    }).trim();

    // Step 5: Normalize 'foo) [bar]' patterns → 'foo [bar]'.
    return result.replace(/(.+)\)\s*\[(.+)\]/, '$1 $2').trim();
  }

  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'release_group') });

  const expectedGroup = buildExpectedFunction('expected_group');

  rebulk.functional(expectedGroup, {
    name: 'release_group',
    tags: ['expected'],
    validator: sepsSurround,
    conflictSolver: () => null as any,
    disabled: (context) => !context?.['expected_group'],
  });

  return rebulk.rules(
    new DashSeparatedReleaseGroup(cleanGroupname),
    new SceneReleaseGroup(cleanGroupname),
    AnimeReleaseGroup
  );
}

class DashSeparatedReleaseGroup extends Rule {
  consequence = [RemoveMatch, AppendMatch];
  valueFormatter: (s: string) => string;

  constructor(valueFormatter: (s: string) => string) {
    super();
    this.valueFormatter = valueFormatter;
  }

  isValid(
    matches: any,
    candidate: Match,
    start: number,
    end: number,
    atEnd: boolean
  ): boolean {
    if (!atEnd) {
      if (String(candidate.value).length <= 1) {
        return false;
      }

      if (matches.markers.atMatch(candidate, (m: Match) => m.name === 'group', 0)) {
        return false;
      }

      // Fix: pass predicate correctly in opts object
      const firstHole = matches.holes(
        candidate.end,
        end,
        { predicate: (m: Match) => m.start === candidate.end, index: 0 }
      );
      if (!firstHole) {
        return false;
      }

      const rawValue = firstHole.raw;
      return (
        rawValue[0] === '-' &&
        !rawValue.slice(1).includes('-') &&
        rawValue.includes('.') &&
        !rawValue.includes(' ')
      );
    }

    const group = matches.markers.atMatch(
      candidate,
      (m: Match) => m.name === 'group',
      0
    );
    if (group && matches.atMatch(group, (m: Match) => !m.private && m.span !== candidate.span)) {
      return false;
    }

    let count = 0;
    let match: Match | null = candidate;
    while (match) {
      // Fix: correct arg order - predicate is 3rd, index is 4th
      const current = matches.range(
        start,
        match.start,
        (m: Match) => !m.private && !m.tags.includes('expected'),
        -1
      ) as Match | undefined;
      if (!current) {
        break;
      }

      // Fix: use inputString (camelCase)
      const inputStr: string = matches.inputString ?? '';
      let separator = inputStr.slice(current.end, match.start);
      if (!separator && (match.raw ?? '')[0] === '-') {
        separator = '-';
      }

      match = current;

      if (count === 0) {
        if (separator !== '-') {
          break;
        }
        count++;
        continue;
      }

      if (separator === '.') {
        return true;
      }
    }

    return false;
  }

  detect(matches: any, start: number, end: number, atEnd: boolean): Match | null {
    let candidate: Match | null = null;
    if (atEnd) {
      const container = matches.ending(end, (m: Match) => m.name === 'container', 0);
      if (container) {
        end = container.start;
      }

      // Fix: correct arg order - predicate is 2nd, index is 3rd
      candidate = matches.ending(
        end,
        (m: Match) =>
          !m.private &&
          !(m.name === 'other' && m.tags.includes('not-a-release-group')) &&
          !(m.raw ?? '').includes('-') &&
          (m.raw ?? '').trim() === m.raw,
        0
      );
    }

    if (!candidate) {
      // Ignore weak-episode matches when computing holes for release groups,
      // so that trailing numbers like "45" in "Scarface45" aren't consumed.
      const ignoreWeak = (m: Match) =>
        !!(m.tags?.includes('weak-episode') || m.tags?.includes('weak-duplicate'));
      if (atEnd) {
        // Fix: pass options as object with seps, index, predicate
        candidate = matches.holes(
          start,
          end,
          {
            seps,
            index: -1,
            ignore: ignoreWeak,
            predicate: (m: Match) => m.end === end && !!(m.raw ?? '').trim() && (m.raw ?? '')[0] === '-',
          }
        );
      } else {
        candidate = matches.holes(
          start,
          end,
          {
            seps,
            index: 0,
            ignore: ignoreWeak,
            predicate: (m: Match) => m.start === start && !!(m.raw ?? '').trim(),
          }
        );
      }
    }

    if (candidate && this.isValid(matches, candidate, start, end, atEnd)) {
      return candidate;
    }

    return null;
  }

  when(matches: any) {
    // Fix: JS truthiness - named() returns [] (truthy), use .length check
    if ((matches.named('release_group') as Match[]).length > 0) {
      return;
    }

    const toRemove = [];
    const toAppend = [];
    for (const filepart of matches.markers.named('path')) {
      let candidate = this.detect(matches, filepart.start, filepart.end, true);
      if (candidate) {
        toRemove.push(...matches.atMatch(candidate));
      } else {
        candidate = this.detect(matches, filepart.start, filepart.end, false);
      }

      if (candidate) {
        const releasegroup = new Match(candidate.start, candidate.end, {
          name: 'release_group',
          inputString: matches.inputString,
        });
        releasegroup.formatter = this.valueFormatter;

        if (releasegroup.value) {
          toAppend.push(releasegroup);
        }
        if (toRemove.length || toAppend.length) {
          return [toRemove, toAppend];
        }
      }
    }
  }
}

class SceneReleaseGroup extends Rule {
  static dependency = ['TitleFromPosition'];
  static consequence = AppendMatch;
  static properties = { release_group: [null] };

  valueFormatter: (s: string) => string;

  constructor(valueFormatter: (s: string) => string) {
    super();
    this.valueFormatter = valueFormatter;
  }

  isPreviousMatch(match: Match): boolean {
    const sceneNames = [
      'video_codec',
      'source',
      'video_api',
      'audio_codec',
      'audio_profile',
      'video_profile',
      'audio_channels',
      'screen_size',
      'other',
      'container',
      'language',
      'subtitle_language',
      'subtitle_language.suffix',
      'subtitle_language.prefix',
      'language.suffix',
    ];
    const scenePrefixTags = ['release-group-prefix'];
    const sceneNoPrefixTags = ['no-release-group-prefix'];

    return sceneNames.includes(match.name ?? '')
      ? !match.tags.some((t) => sceneNoPrefixTags.includes(t))
      : match.tags.some((t) => scenePrefixTags.includes(t));
  }

  when(matches: any) {
    const ret = [];

    for (const filepart of markerSorted(matches.markers.named('path'), matches)) {
      const { start, end } = filepart;
      // Fix: JS truthiness - check .length
      if (
        ((matches.named(
          'release_group',
          (m: Match) => m.start >= start && m.end <= end
        )) as Match[]).length > 0
      ) {
        continue;
      }

      const titles = matches.named(
        'title',
        (m: Match) => m.start >= start && m.end <= end
      ) as Match[];

      // Ignore extra titles AND episode_title matches when computing holes,
      // so these don't prevent release_group detection.
      // Also ignore weak-episode matches so trailing numbers (e.g. "Scarface45")
      // aren't consumed by weak episode patterns.
      const keepOnlyFirstTitle = (match: Match) =>
        titles.slice(1).includes(match) || match.name === 'episode_title' ||
        !!(match.tags?.includes('weak-episode') || match.tags?.includes('weak-duplicate'));

      // Python: ignore=keepOnlyFirstTitle (treat extra titles as unmatched),
      // predicate=lambda hole: cleanup(hole.value) (filter holes with non-empty value)
      const lastHole = matches.holes(
        start,
        end + 1,
        {
          formatter: (s: string) => cleanup(s),
          ignore: keepOnlyFirstTitle,
          predicate: (hole: Match) => Boolean(cleanup(String(hole.value ?? ''))),
          index: -1,
        }
      );

      if (lastHole) {
        const previousMatchFilter = (match: Match) => {
          if (match.start < filepart.start) {
            return false;
          }
          return !match.private || this.isPreviousMatch(match);
        };

        const previousMatch = matches.previous(lastHole, previousMatchFilter, 0);
        // Fix: use inputString (camelCase)
        const inputStr: string = matches.inputString ?? '';
        const holeValue = String(lastHole.value ?? '');
        if (
          previousMatch &&
          this.isPreviousMatch(previousMatch) &&
          !inputStr
            .slice(previousMatch.end, lastHole.start)
            .replace(new RegExp(`[${sepsPattern}]`, 'g'), '') &&
          !intCoercable(holeValue.replace(new RegExp(`[${sepsPattern}]`, 'g'), ''))
        ) {
          lastHole.name = 'release_group';
          lastHole.tags = ['scene'];
          // Use the cleanGroupname formatter so release_group value is properly cleaned.
          lastHole.formatter = this.valueFormatter;

          const group = matches.markers.atMatch(
            lastHole,
            (m: Match) => m.name === 'group',
            0
          );
          if (group) {
            group.formatter = this.valueFormatter;
            if (group.value === lastHole.value) {
              lastHole.start = group.start + 1;
              lastHole.end = group.end - 1;
              lastHole.tags = ['anime'];
            }
          }

          // Remove episode_title and extra-title matches that overlap with the release_group span.
          const ignoredMatches = matches.range(
            lastHole.start,
            lastHole.end,
            keepOnlyFirstTitle
          );

          for (const ignoredMatch of ignoredMatches) {
            matches.remove(ignoredMatch);
          }

          ret.push(lastHole);
        }
      }
    }
    return ret;
  }
}

class AnimeReleaseGroup extends Rule {
  static dependency = ['SceneReleaseGroup', 'TitleFromPosition'];
  static consequence = [RemoveMatch, AppendMatch];
  static properties = { release_group: [null] };

  when(matches: any) {
    const toRemove = [];
    const toAppend = [];

    // Fix: JS truthiness - named() returns [] (truthy), use .length check
    if ((matches.named('release_group') as Match[]).length > 0) {
      return false;
    }

    if (
      !(matches.named('episode') as Match[]).length &&
      !(matches.named('season') as Match[]).length &&
      (matches.named('release_group') as Match[]).length > 0
    ) {
      return false;
    }

    for (const filepart of markerSorted(matches.markers.named('path'), matches)) {
      // A group is a candidate for anime release group if it contains
      // no matches (excluding weak-language), OR if it only contains
      // 'other' matches (like "Fan Subtitled" from "Fansub") which are
      // commonly embedded in release group names.
      const isGroupEmpty = (m: Match): boolean => {
        const innerMatches = (matches.range(
          m.start,
          m.end,
          (mm: Match) => !mm.tags.includes('weak-language')
        ) as Match[]);
        if (innerMatches.length === 0) return true;
        // Also consider "empty" if only 'other' matches are inside
        return innerMatches.every((mm: Match) => mm.name === 'other');
      };

      const emptyGroup = matches.markers.range(
        filepart.start,
        filepart.end,
        (m: Match) =>
          m.name === 'group' &&
          isGroupEmpty(m) &&
          String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '') &&
          !intCoercable(String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')),
        0
      );

      if (emptyGroup) {
        // Create a proper Match instance (not a plain spread) so prototype getters like .span work
        const group = new Match(emptyGroup.start + 1, emptyGroup.end - 1, {
          name: 'release_group',
          inputString: matches.inputString,
          tags: ['anime'],
        });
        toAppend.push(group);
        // Remove weak-language and other matches that were inside the group
        toRemove.push(
          ...matches.range(
            emptyGroup.start,
            emptyGroup.end,
            (m: Match) => m.tags.includes('weak-language') || m.name === 'other'
          )
        );
      }
    }

    if (toRemove.length || toAppend.length) {
      return [toRemove, toAppend];
    }
    return false;
  }
}
