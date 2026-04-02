import { Rebulk } from 'rebulk-js';
import { Match } from 'rebulk-js';
import { seps, reEscape, sepsPattern } from '../common/index.js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import { buildOrPattern } from '../../reutils.js';

export function container(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'container') });
  rebulk.regexDefaults({ flags: 'i' }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({
    name: 'container',
    formatter: (value: string) => value.replace(new RegExp(`[${reEscape(seps)}]`, 'g'), ''),
    tags: ['extension'],
    conflictSolver: (match: Match, other: Match) =>
      other.name === 'source' || other.name === 'video_codec' || (other.name === 'container' && !other.tags.includes('extension'))
        ? other
        : '__default__',
  });

  const subtitles = (config['subtitles'] as string[]) || [];
  const info = (config['info'] as string[]) || [];
  const videos = (config['videos'] as string[]) || [];
  const torrent = (config['torrent'] as string[]) || [];
  const nzb = (config['nzb'] as string[]) || [];

  if (subtitles.length) rebulk.regex('\\.' + buildOrPattern(subtitles, undefined, true) + '$', {
    exts: subtitles,
    tags: ['extension', 'subtitle'],
  });
  if (info.length) rebulk.regex('\\.' + buildOrPattern(info, undefined, true) + '$', {
    exts: info,
    tags: ['extension', 'info'],
  });
  if (videos.length) rebulk.regex('\\.' + buildOrPattern(videos, undefined, true) + '$', {
    exts: videos,
    tags: ['extension', 'video'],
  });
  if (torrent.length) rebulk.regex('\\.' + buildOrPattern(torrent, undefined, true) + '$', {
    exts: torrent,
    tags: ['extension', 'torrent'],
  });
  if (nzb.length) rebulk.regex('\\.' + buildOrPattern(nzb, undefined, true) + '$', {
    exts: nzb,
    tags: ['extension', 'nzb'],
  });

  rebulk.defaults({
    clear: true,
    name: 'container',
    validator: sepsSurround,
    formatter: (s: string) => s.toLowerCase(),
    conflictSolver: (match: Match, other: Match) =>
      other.name === 'source' || other.name === 'video_codec' || (other.name === 'container' && other.tags.includes('extension'))
        ? match
        : '__default__',
  });

  const nonStdSubtitles = subtitles.filter((s) => !['sub', 'ass'].includes(s));
  rebulk.string(...nonStdSubtitles, { tags: ['subtitle'] });
  rebulk.string(...videos, { tags: ['video'] });
  rebulk.string(...torrent, { tags: ['torrent'] });
  rebulk.string(...nzb, { tags: ['nzb'] });

  return rebulk;
}
