/**
 * Video codec property patterns and rules — port of guessit/rules/properties/video_codec.py
 */
import { Rebulk, Rule, RemoveMatch } from 'rebulk-js';
import type { Match, Matches } from 'rebulk-js';
import type { Context } from 'rebulk-js';
import { dash } from '../common/index.js';
import { isDisabled } from '../common/pattern.js';
import { sepsBefore, sepsAfter, sepsSurround } from '../common/validators.js';

export function videoCodec(config: Record<string, unknown>): Rebulk {
  const rebulk = new Rebulk();

  rebulk.regexDefaults({
    flags: 'i',
    abbreviations: [dash],
  });
  rebulk.stringDefaults({ ignoreCase: true });
  rebulk.defaults({
    name: 'video_codec',
    tags: ['source-suffix', 'streaming_service.suffix'],
    disabled: (context: Context) => isDisabled(context, 'video_codec'),
  });

  rebulk.regex('Rv\\d{2}', { value: 'RealVideo' });
  rebulk.regex('Mpe?g-?2', '[hx]-?262', { value: 'MPEG-2' });
  rebulk.string('DVDivX', 'DivX', { value: 'DivX' });
  rebulk.string('XviD', { value: 'Xvid' });
  rebulk.regex('VC-?1', { value: 'VC-1' });
  rebulk.string('VP7', { value: 'VP7' });
  rebulk.string('VP8', 'VP80', { value: 'VP8' });
  rebulk.string('VP9', { value: 'VP9' });
  rebulk.regex('[hx]-?263', { value: 'H.263' });
  rebulk.regex('[hx]-?264', '(?:MPEG-?4)?AVC(?:HD)?', { value: 'H.264' });
  rebulk.regex('[hx]-?265', 'HEVC', { value: 'H.265' });
  rebulk.regex('(?<video_codec>hevc)(?<color_depth>10)', {
    value: { video_codec: 'H.265', color_depth: '10-bit' },
    tags: ['video-codec-suffix'],
    children: true,
  });

  rebulk.defaults({
    clear: true,
    name: 'video_profile',
    validator: sepsSurround,
    disabled: (context: Context) => isDisabled(context, 'video_profile'),
  });
  rebulk.string('BP', { value: 'Baseline', tags: 'video_profile.rule' });
  rebulk.string('XP', 'EP', { value: 'Extended', tags: 'video_profile.rule' });
  rebulk.string('MP', { value: 'Main', tags: 'video_profile.rule' });
  rebulk.string('HP', 'HiP', { value: 'High', tags: 'video_profile.rule' });
  rebulk.string('SC', 'SVC', { value: 'Scalable Video Coding', tags: 'video_profile.rule' });
  rebulk.regex('AVC(?:HD)?', { value: 'Advanced Video Codec High Definition', tags: 'video_profile.rule' });
  rebulk.string('HEVC', { value: 'High Efficiency Video Coding', tags: 'video_profile.rule' });
  rebulk.regex('Hi422P', { value: 'High 4:2:2' });
  rebulk.regex('Hi444PP', { value: 'High 4:4:4 Predictive' });
  rebulk.regex('Hi10P?', { value: 'High 10' });
  rebulk.string('DXVA', {
    value: 'DXVA',
    name: 'video_api',
    disabled: (context: Context) => isDisabled(context, 'video_api'),
  });

  rebulk.defaults({
    clear: true,
    name: 'color_depth',
    validator: sepsSurround,
    disabled: (context: Context) => isDisabled(context, 'color_depth'),
  });
  rebulk.regex('12.?bits?', { value: '12-bit' });
  rebulk.regex('10.?bits?', 'YUV420P10', 'Hi10P?', { value: '10-bit' });
  rebulk.regex('8.?bits?', { value: '8-bit' });

  rebulk.rules(ValidateVideoCodec, VideoProfileRule);

  return rebulk;
}

class ValidateVideoCodec extends Rule {
  static priority = 64;
  static consequence = RemoveMatch;

  enabled(context: Context): boolean {
    return !isDisabled(context, 'video_codec');
  }

  when(matches: Matches, _context: Context): Match[] {
    const ret: Match[] = [];
    const codecs = matches.named('video_codec');

    for (const codec of codecs) {
      if (!sepsBefore(codec) && !matches.atIndex(codec.start - 1, (m) => m.tags?.includes('video-codec-prefix'))) {
        ret.push(codec);
        continue;
      }
      if (!sepsAfter(codec) && !matches.atIndex(codec.end + 1, (m) => m.tags?.includes('video-codec-suffix'))) {
        ret.push(codec);
        continue;
      }
    }

    return ret;
  }
}

class VideoProfileRule extends Rule {
  static consequence = RemoveMatch;

  enabled(context: Context): boolean {
    return !isDisabled(context, 'video_profile');
  }

  when(matches: Matches, _context: Context): Match[] {
    const profileList = (matches.named('video_profile', (m) => m.tags?.includes('video_profile.rule')) as Match[]) ?? [];
    const ret: Match[] = [];

    for (const profile of profileList) {
      let codec = matches.atSpan(profile.span, (m) => m.name === 'video_codec', 0);
      if (!codec) {
        codec = matches.previous(profile, (m) => m.name === 'video_codec', 0);
      }
      if (!codec) {
        codec = matches.next(profile, (m) => m.name === 'video_codec', 0);
      }
      if (!codec) {
        ret.push(profile);
      }
    }

    return ret;
  }
}
