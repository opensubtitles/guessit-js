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

  rebulk.rules(
    RenameAnotherToOther,
    ValidateHasNeighbor,
    ValidateHasNeighborAfter,
    ValidateHasNeighborBefore,
    ValidateScreenerRule,
    ValidateMuxRule,
    ValidateHardcodedSubs,
    ValidateStreamingServiceNeighbor,
    ValidateAtEnd,
    ValidateReal,
    ProperCountRule,
    FixCountRule
  );

  return rebulk;
}

export function completeWords(
  rebulk: Rebulk,
  seasonWords: string[],
  completeArticleWords: string[]
) {
  const seasonWordsPattern = buildOrPattern(seasonWords);
  const completeArticleWordsPattern = buildOrPattern(completeArticleWords);

  function validateComplete(match: Match) {
    const children = match.children;
    if (!children.named('completeWordsBefore') && !children.named('completeWordsAfter')) {
      return false;
    }
    return true;
  }

  rebulk.regex(
    `(?P<completeArticle>${completeArticleWordsPattern}-)?` +
    `(?P<completeWordsBefore>${seasonWordsPattern}-)?` +
    'Complete' +
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
        const raw = rawCleanup(m.raw).toLowerCase();
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
