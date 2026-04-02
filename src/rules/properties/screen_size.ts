/**
 * screen_size property — port of guessit/rules/properties/screen_size.py
 */
import { Rebulk } from 'rebulk-js';
import { Rule, RemoveMatch, AppendMatch } from 'rebulk-js';
import { Match } from 'rebulk-js';
import type { Matches } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import { dash, seps , sepsPattern } from '../common/index.js';
import { buildOrPattern } from '../../reutils.js';
import { FrameRate } from '../common/quantity.js';

export interface ScreenSizeConfig {
  frame_rates: string[];
  interlaced: string[];
  progressive: string[];
  min_ar: number;
  max_ar: number;
}

export function screenSize(config: ScreenSizeConfig): Rebulk {
  const interlaced = new Set(config.interlaced);
  const progressive = new Set(config.progressive);
  const standardHeights = progressive;
  const frameRates = config.frame_rates;
  const minAr = config.min_ar;
  const maxAr = config.max_ar;

  const rebulk = new Rebulk();
  rebulk.stringDefaults({ ignoreCase: true });
  rebulk.regexDefaults({ flags: 'i' });

  rebulk.defaults({
    name: 'screen_size',
    validator: sepsSurround,
    abbreviations: [dash],
    disabled: (context: Record<string, unknown>) => isDisabled(context, 'screen_size'),
  });

  const frameRatePattern = buildOrPattern(frameRates, 'frame_rate');
  const interlacedPattern = buildOrPattern([...interlaced], 'height');
  const progressivePattern = buildOrPattern([...progressive], 'height');
  const resPattern = `(?:(?<width>\\d{3,4})(?:x|\\*))?`;

  rebulk.regex(resPattern + interlacedPattern + `(?<scan_type>i)` + frameRatePattern + `?`);
  rebulk.regex(resPattern + progressivePattern + `(?<scan_type>p)` + frameRatePattern + `?`);
  rebulk.regex(resPattern + progressivePattern + `(?<scan_type>p)?(?:hd)`);
  rebulk.regex(resPattern + progressivePattern + `(?<scan_type>p)?x?`);
  rebulk.string('4k', {
    value: '2160p',
    conflictSolver: (match: Match, other: Match) =>
      other.name === 'screen_size' ? '__default__' : match,
  });
  rebulk.regex(`(?<width>\\d{3,4})-?(?:x|\\*)-?(?<height>\\d{3,4})`, {
    conflictSolver: (match: Match, other: Match) =>
      other.name === 'screen_size' ? '__default__' : other,
  });

  rebulk.regex(frameRatePattern + `-?(?:p|fps)`, {
    name: 'frame_rate',
    formatter: (s: string) => FrameRate.fromstring(s).toString(),
    disabled: (context: Record<string, unknown>) => isDisabled(context, 'frame_rate'),
  });

  rebulk.rules(
    new PostProcessScreenSize(standardHeights, minAr, maxAr),
    ScreenSizeOnlyOne,
    ResolveScreenSizeConflicts,
  );

  return rebulk;
}

class PostProcessScreenSize extends Rule {
  static consequence = AppendMatch;

  private standardHeights: Set<string>;
  private minAr: number;
  private maxAr: number;

  constructor(standardHeights: Set<string>, minAr: number, maxAr: number) {
    super();
    this.standardHeights = standardHeights;
    this.minAr = minAr;
    this.maxAr = maxAr;
  }

  when(matches: Matches, context: Record<string, unknown>): Match[] {
    const toAppend: Match[] = [];

    for (const match of matches.named('screen_size')) {
      if (!isDisabled(context, 'frame_rate')) {
        for (const frameRate of match.children.named('frame_rate')) {
          (frameRate as unknown as { formatter: (s: string) => string }).formatter = (s: string) => FrameRate.fromstring(s).toString();
          toAppend.push(frameRate);
        }
      }

      // Try to get height/width/scan_type from children (when children:true is set)
      // or fall back to parsing the raw string directly.
      let values = match.children.toDict() as unknown as Record<string, unknown>;
      if (!('height' in values)) {
        // Parse raw string. Handle these formats:
        //   "WxH"  / "WXH"  → width W, height H (no scan type)
        //   "Hx"   (pattern consumed trailing x but no second number) → height H only
        //   "Hp"   / "Hi"   → height H, scan type p/i
        //   "H"              → height H only (defaults to 'p')
        const raw = String(match.raw ?? '');
        // Full WxH form (both dimensions present), allow optional separators around x/*
        const rxWxH = /^(\d{3,4})\s*[xX*]\s*(\d{3,4})$/i;
        const mWxH = rxWxH.exec(raw);
        if (mWxH) {
          values = { width: mWxH[1], height: mWxH[2], scan_type: undefined };
        } else {
          // Height-only or height+scan_type form (strip any trailing separator chars)
          const rxH = /^(\d{3,4})([ip])?/i;
          const mH = rxH.exec(raw);
          if (mH && mH[1]) {
            values = { height: mH[1], scan_type: mH[2] };
          } else {
            continue;
          }
        }
      }

      const scanType = ((values['scan_type'] as string) || 'p').toLowerCase();
      const height = String(values['height'] ?? '');

      if (!('width' in values) || values['width'] === undefined) {
        (match as unknown as { value: unknown }).value = `${height}${scanType}`;
        continue;
      }

      const width = String(values['width'] ?? '');
      const calculatedAr = parseFloat(width) / parseFloat(height);

      if (this.standardHeights.has(height) && this.minAr < calculatedAr && calculatedAr < this.maxAr) {
        (match as unknown as { value: unknown }).value = `${height}${scanType}`;
      } else {
        (match as unknown as { value: unknown }).value = `${width}x${height}`;
      }

      // Add aspect_ratio when width is present and within valid range
      if (!isDisabled(context, 'aspect_ratio') && width && this.minAr < calculatedAr && calculatedAr < this.maxAr) {
        const arMatch = new Match(match.start, match.end, {
          name: 'aspect_ratio',
          value: Math.round(calculatedAr * 1000) / 1000,
          inputString: match.inputString,
        });
        toAppend.push(arMatch);
      }
    }

    return toAppend;
  }
}

class ScreenSizeOnlyOne extends Rule {
  static consequence = RemoveMatch;

  when(matches: Matches, _context: Record<string, unknown>): Match[] {
    const toRemove: Match[] = [];
    for (const filepart of matches.markers.named('path')) {
      const screenSizes = (matches.range(filepart.start, filepart.end, (m: Match) => m.name === 'screen_size') as Match[]).reverse();
      const uniqueValues = new Set(screenSizes.map((m: Match) => m.value));
      if (screenSizes.length > 1 && uniqueValues.size > 1) {
        toRemove.push(...screenSizes.slice(1));
      }
    }
    return toRemove;
  }
}

class ResolveScreenSizeConflicts extends Rule {
  static consequence = RemoveMatch;

  when(matches: Matches, _context: Record<string, unknown>): Match[] {
    const toRemove: Match[] = [];
    for (const filepart of matches.markers.named('path')) {
      const screenSizeMatch = matches.range(filepart.start, filepart.end, (m: Match) => m.name === 'screen_size', 0) as Match | undefined;
      if (!screenSizeMatch) continue;

      const conflicts = (matches.conflicting(screenSizeMatch, (m: Match) => ['season', 'episode'].includes(m.name ?? '')) as Match[]) ?? [];
      if (conflicts.length === 0) continue;

      let hasNeighbor = false;

      const videoProfile = matches.range(screenSizeMatch.end, filepart.end, (m: Match) => m.name === 'video_profile', 0) as Match | undefined;
      if (videoProfile && (matches.holes(screenSizeMatch.end, videoProfile.start, { predicate: (h: Match) => !!(h.value && String(h.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')) }) as Match[]).length === 0) {
        toRemove.push(...conflicts);
        hasNeighbor = true;
      }

      const previous = matches.previous(screenSizeMatch, (m: Match) =>
        ['date', 'source', 'other', 'streaming_service'].includes(m.name ?? ''), 0) as Match | undefined;
      if (previous && (matches.holes(previous.end, screenSizeMatch.start, { predicate: (h: Match) => !!(h.value && String(h.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')) }) as Match[]).length === 0) {
        toRemove.push(...conflicts);
        hasNeighbor = true;
      }

      if (!hasNeighbor) {
        toRemove.push(screenSizeMatch);
      }
    }
    return toRemove;
  }
}
