/**
 * Source property patterns and rules — port of guessit/rules/properties/source.py
 */
import { Rebulk, Rule, RemoveMatch, AppendMatch } from 'rebulk-js';
import { Match } from 'rebulk-js';
import type { Matches } from 'rebulk-js';
import type { Context } from 'rebulk-js';
import { dash, seps, sepsPattern, optional } from '../common/index.js';
import { isDisabled } from '../common/pattern.js';
import { sepsBefore, sepsAfter, or_ } from '../common/validators.js';

export function source(config: Record<string, unknown>): Rebulk {
  const ripPrefix = (config['rip_prefix'] as string) ?? '(?P<other>Rip)-?';
  const ripSuffix = (config['rip_suffix'] as string) ?? '-?(?P<other>Rip)';

  function buildSourcePattern(patterns: string[], prefix = '', suffix = ''): string[] {
    return patterns.map((p) => `${prefix}(${p})${suffix}`);
  }

  function demoteOther(match: Match, other: Match): Match | '__default__' {
    return ['other', 'release_group'].includes(other.name ?? '') ? other : '__default__';
  }

  const rebulk = new Rebulk({ disabled: (context: Context) => isDisabled(context, 'source') });

  rebulk.regexDefaults({
    flags: 'i',
    abbreviations: [dash],
    privateParent: true,
    children: true,
  });

  rebulk.defaults({
    name: 'source',
    tags: ['video-codec-prefix', 'streaming_service.suffix'],
    validateAll: true,
    validator: { __parent__: or_(sepsBefore, sepsAfter) },
  });

  // VHS
  rebulk.regex(...buildSourcePattern(['VHS'], '', optional(ripSuffix)),
    { value: { source: 'VHS', other: 'Rip' } });

  // Camera
  rebulk.regex(...buildSourcePattern(['CAM'], '', optional(ripSuffix)),
    { value: { source: 'Camera', other: 'Rip' } });

  // HD Camera
  rebulk.regex(...buildSourcePattern(['HD-?CAM'], '', optional(ripSuffix)),
    { value: { source: 'HD Camera', other: 'Rip' } });

  // Telesync (TS is too common, avoid 'streaming_service.suffix' tag)
  rebulk.regex(...buildSourcePattern(['TELESYNC', 'TS'], '', optional(ripSuffix)),
    { value: { source: 'Telesync', other: 'Rip' }, tags: ['video-codec-prefix'], overrides: ['tags'] });

  // HD Telesync
  rebulk.regex(...buildSourcePattern(['HD-?TELESYNC', 'HD-?TS'], '', optional(ripSuffix)),
    { value: { source: 'HD Telesync', other: 'Rip' } });

  // Workprint
  rebulk.regex(...buildSourcePattern(['WORKPRINT', 'WP']),
    { value: 'Workprint' });

  // Telecine
  rebulk.regex(...buildSourcePattern(['TELECINE', 'TC'], '', optional(ripSuffix)),
    { value: { source: 'Telecine', other: 'Rip' } });

  // HD Telecine
  rebulk.regex(...buildSourcePattern(['HD-?TELECINE', 'HD-?TC'], '', optional(ripSuffix)),
    { value: { source: 'HD Telecine', other: 'Rip' } });

  // Pay-per-view
  rebulk.regex(...buildSourcePattern(['PPV'], '', optional(ripSuffix)),
    { value: { source: 'Pay-per-view', other: 'Rip' } });

  // TV
  rebulk.regex(...buildSourcePattern(['SD-?TV'], '', optional(ripSuffix)),
    { value: { source: 'TV', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['TV'], '', ripSuffix),
    { value: { source: 'TV', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['TV', 'SD-?TV'], ripPrefix),
    { value: { source: 'TV', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['TV-?(?=Dub)']),
    { value: 'TV' });

  // Digital TV
  rebulk.regex(...buildSourcePattern(['DVB', 'PD-?TV'], '', optional(ripSuffix)),
    { value: { source: 'Digital TV', other: 'Rip' } });

  // DVD
  rebulk.regex(...buildSourcePattern(['DVD'], '', optional(ripSuffix)),
    { value: { source: 'DVD', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['DM'], '', optional(ripSuffix)),
    { value: { source: 'Digital Master', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['VIDEO-?TS', 'DVD-?R(?:$|(?!E))', 'DVD-?9', 'DVD-?5']),
    { value: 'DVD' });

  // HDTV
  rebulk.regex(...buildSourcePattern(['HD-?TV'], '', optional(ripSuffix)),
    { conflictSolver: demoteOther, value: { source: 'HDTV', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['TV-?HD'], '', ripSuffix),
    { conflictSolver: demoteOther, value: { source: 'HDTV', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['TV'], '', '-?(?P<other>Rip-?HD)'),
    { conflictSolver: demoteOther, value: { source: 'HDTV', other: 'Rip' } });

  // Video on Demand
  rebulk.regex(...buildSourcePattern(['VOD'], '', optional(ripSuffix)),
    { value: { source: 'Video on Demand', other: 'Rip' } });

  // Web
  rebulk.regex(...buildSourcePattern(['WEB', 'WEB-?DL'], '', ripSuffix),
    { value: { source: 'Web', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['WEB-?(?P<another>Cap)'], '', optional(ripSuffix)),
    { value: { source: 'Web', other: 'Rip', another: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['WEB-?DL', 'WEB-?U?HD', 'DL-?WEB', 'DL(?=-?Mux)']),
    { value: { source: 'Web' } });
  rebulk.regex('(WEB)', { value: 'Web', tags: 'weak.source' });

  // HD-DVD
  rebulk.regex(...buildSourcePattern(['HD-?DVD'], '', optional(ripSuffix)),
    { value: { source: 'HD-DVD', other: 'Rip' } });

  // Blu-ray
  rebulk.regex(...buildSourcePattern(['Blu-?ray', 'BD', 'BD[59]', 'BD25', 'BD50'], '', optional(ripSuffix)),
    { value: { source: 'Blu-ray', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['(?P<another>BR)-?(?=Scr(?:eener)?)', '(?P<another>BR)-?(?=Mux)']),
    { value: { source: 'Blu-ray', another: 'Reencoded' } });
  rebulk.regex(...buildSourcePattern(['(?P<another>BR)'], '', ripSuffix),
    { value: { source: 'Blu-ray', other: 'Rip', another: 'Reencoded' } });

  // Ultra HD Blu-ray
  rebulk.regex(...buildSourcePattern(['Ultra-?Blu-?ray', 'Blu-?ray-?Ultra']),
    { value: 'Ultra HD Blu-ray' });

  // Analog HDTV
  rebulk.regex(...buildSourcePattern(['AHDTV']),
    { value: 'Analog HDTV' });

  // Ultra HDTV
  rebulk.regex(...buildSourcePattern(['UHD-?TV'], '', optional(ripSuffix)),
    { conflictSolver: demoteOther, value: { source: 'Ultra HDTV', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['UHD'], '', ripSuffix),
    { conflictSolver: demoteOther, value: { source: 'Ultra HDTV', other: 'Rip' } });

  // Satellite
  rebulk.regex(...buildSourcePattern(['DSR', 'DTH'], '', optional(ripSuffix)),
    { value: { source: 'Satellite', other: 'Rip' } });
  rebulk.regex(...buildSourcePattern(['DSR?', 'SAT'], '', ripSuffix),
    { value: { source: 'Satellite', other: 'Rip' } });

  rebulk.rules(ValidateSourcePrefixSuffix, ValidateWeakSource, UltraHdBlurayRule);

  return rebulk;
}

class ValidateSourcePrefixSuffix extends Rule {
  static override priority = 64;
  override consequence = RemoveMatch;

  override enabled(context: Context): boolean {
    return !isDisabled(context, 'source');
  }

  override when(matches: Matches, _context: Context): Match[] {
    const ret: Match[] = [];

    for (const filepart of (matches.markers.named('path') as Match[] | Match | undefined ? [matches.markers.named('path')].flat() : [])) {
      const fp = filepart as Match;
      const sources = matches.range(fp.start, fp.end, (m) => m.name === 'source') as Match[];
      for (const match of (Array.isArray(sources) ? sources : sources ? [sources] : [])) {
        const initiator = (match as any).initiator ?? match;
        const hasPrefixSep = sepsBefore(initiator);
        const hasPrefixTag = matches.range(initiator.start - 1, initiator.start,
          (m) => m.tags?.includes('source-prefix')) as Match[];
        if (!hasPrefixSep && !(Array.isArray(hasPrefixTag) ? hasPrefixTag.length > 0 : !!hasPrefixTag)) {
          if (initiator.children?.length > 0) ret.push(...initiator.children.toArray());
          ret.push(initiator);
          continue;
        }
        const hasSuffixSep = sepsAfter(initiator);
        const hasSuffixTag = matches.range(initiator.end, initiator.end + 1,
          (m) => m.tags?.includes('source-suffix')) as Match[];
        if (!hasSuffixSep && !(Array.isArray(hasSuffixTag) ? hasSuffixTag.length > 0 : !!hasSuffixTag)) {
          if (initiator.children?.length > 0) ret.push(...initiator.children.toArray());
          ret.push(initiator);
        }
      }
    }

    return ret;
  }
}

class ValidateWeakSource extends Rule {
  static override priority = 64;
  override consequence = RemoveMatch;

  override enabled(context: Context): boolean {
    return !isDisabled(context, 'source');
  }

  override when(matches: Matches, _context: Context): Match[] {
    const ret: Match[] = [];

    for (const filepart of [matches.markers.named('path')].flat().filter(Boolean) as Match[]) {
      const sources = matches.range(filepart.start, filepart.end, (m) => m.name === 'source');
      for (const match of (Array.isArray(sources) ? sources : sources ? [sources] : []) as Match[]) {
        if (!match.tags?.includes('weak.source')) continue;

        // If another source exists after this match
        const nextSource = matches.range(match.end, filepart.end, (m) => m.name === 'source');
        const hasNextSource = Array.isArray(nextSource) ? nextSource.length > 0 : !!nextSource;

        // And there's a title-like hole before this match
        const holeBeforeMatch = matches.holes(filepart.start, match.start, {
          predicate: (m: Match) => !!(m.value && String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')),
        });
        const hasHoleBefore = Array.isArray(holeBeforeMatch) ? holeBeforeMatch.length > 0 : !!holeBeforeMatch;

        if (hasNextSource && hasHoleBefore) {
          if ((match as any).children?.length > 0) ret.push(...(match as any).children.toArray());
          ret.push(match);
        }
      }
    }

    return ret;
  }
}

class UltraHdBlurayRule extends Rule {
  override consequence = [RemoveMatch, AppendMatch];

  override enabled(context: Context): boolean {
    return !isDisabled(context, 'source');
  }

  override when(matches: Matches, _context: Context): [Match[], Match[]] | false {
    const toRemove: Match[] = [];
    const toAppend: Match[] = [];

    for (const filepart of [matches.markers.named('path')].flat().filter(Boolean) as Match[]) {
      const bluRaySources = matches.range(filepart.start, filepart.end,
        (m) => !m.private && m.name === 'source' && m.value === 'Blu-ray') as Match[];

      for (const match of (Array.isArray(bluRaySources) ? bluRaySources : bluRaySources ? [bluRaySources] : [])) {
        // Look for Ultra HD match before or after
        const findUltraHd = (start: number, end: number) =>
          (matches.range(start, end, (m) => !m.private && m.name === 'other' && m.value === 'Ultra HD') as Match[])?.[0];

        let other = findUltraHd(filepart.start, match.start);
        if (other) {
          const hasHoles = matches.holes(other.end, match.start,
            { predicate: (m: Match) => !!(m.value && String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')) });
          const hasInvalidMatches = matches.range(other.end, match.start,
            (m) => !m.private && !['screen_size', 'color_depth'].includes(m.name ?? '') &&
              !(m.name === 'other' && m.tags?.includes('uhdbluray-neighbor')));
          if ((Array.isArray(hasHoles) ? hasHoles.length : hasHoles ? 1 : 0) > 0 ||
              (Array.isArray(hasInvalidMatches) ? hasInvalidMatches.length : hasInvalidMatches ? 1 : 0) > 0) {
            other = undefined as any;
          }
        }

        if (!other) {
          other = findUltraHd(match.end, filepart.end);
          if (other) {
            const hasHoles = matches.holes(match.end, other.start,
              { predicate: (m: Match) => !!(m.value && String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')) });
            const hasInvalidMatches = matches.range(match.end, other.start,
              (m) => !m.private && !['screen_size', 'color_depth'].includes(m.name ?? '') &&
                !(m.name === 'other' && m.tags?.includes('uhdbluray-neighbor')));
            if ((Array.isArray(hasHoles) ? hasHoles.length : hasHoles ? 1 : 0) > 0 ||
                (Array.isArray(hasInvalidMatches) ? hasInvalidMatches.length : hasInvalidMatches ? 1 : 0) > 0) {
              other = undefined as any;
            }
          }
        }

        if (!other) {
          // Also accept 2160p screen_size as indicator of Ultra HD
          const has2160 = matches.range(filepart.start, filepart.end,
            (m) => m.name === 'screen_size' && m.value === '2160p');
          if (!(Array.isArray(has2160) ? has2160.length : has2160 ? 1 : 0)) continue;
        }

        if (other) other.private = true;

        // Create a new proper Match instance with Ultra HD Blu-ray value
        const newSource = new Match(match.start, match.end, {
          name: match.name,
          inputString: matches.inputString,
          tags: [...(match.tags ?? [])],
          private: match.private,
          value: 'Ultra HD Blu-ray',
        });
        toRemove.push(match);
        toAppend.push(newSource);
      }
    }

    if (toRemove.length || toAppend.length) return [toRemove, toAppend];
    return false;
  }
}
