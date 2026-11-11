import { Rebulk } from 'rebulk-js';
import { Rule } from 'rebulk-js';
import { Match } from 'rebulk-js';
import { POST_PROCESS } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';
import type { Matches } from 'rebulk-js';
import type { Context } from 'rebulk-js';

// Simple mimetype mapping
const MIMETYPE_MAP: Record<string, string> = {
  'mkv': 'video/x-matroska',
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'flv': 'video/x-flv',
  'wmv': 'video/x-ms-wmv',
  'webm': 'video/webm',
  'mp3': 'audio/mpeg',
  'flac': 'audio/flac',
  'aac': 'audio/aac',
  'ogg': 'audio/ogg',
  'wma': 'audio/x-ms-wma',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  'pdf': 'application/pdf',
  // The rest mirror what Python's mimetypes module reports for the same
  // extension (measured against guessit 4.5.1 on Python 3.13), so a caller
  // switching between the two parsers sees one answer. Extensions where Python
  // has no entry at all (wmv, mpeg, ogm, flv, mp3, flac…) keep the correct type
  // here rather than reporting nothing to match a gap in its table.
  'srt': 'application/x-subrip',
  'vtt': 'text/vtt',
  'nfo': 'text/x-nfo',
  'ts': 'video/mp2t',
  'mk3d': 'video/x-matroska',
  'iso': 'application/x-iso9660-image',
  'torrent': 'application/x-bittorrent',
  'nzb': 'application/x-nzb',
  '7z': 'application/x-7z-compressed',
  'ace': 'application/x-ace-compressed',
  'tar': 'application/x-tar',
  'tgz': 'application/x-tar',
  'cbr': 'application/x-cbr',
  'cbz': 'application/x-cbr',
  'cb7': 'application/x-cbr',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
};

export function mimetype(_config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'mimetype') });
  rebulk.rules(Mimetype);
  return rebulk;
}

class Mimetype extends Rule {
  static override priority = POST_PROCESS;
  // No dependency, so this sorts by registration order and lands ahead of
  // TypeProcessor — Python emits mimetype before type, and the rule only reads
  // the extension off the input string, never other matches.
  static override dependency = undefined;
  static override properties = { mimetype: [null] };

  when(matches: Matches, _context: Context): string | null {
    const input = matches.inputString ?? '';
    const ext = input.split('.').pop()?.toLowerCase() || '';
    return MIMETYPE_MAP[ext] || null;
  }

  then(matches: Matches, whenResponse: unknown, _context: Context): void {
    if (whenResponse && typeof whenResponse === 'string') {
      const len = matches.inputString?.length ?? 0;
      const match = new Match(len, len, {
        name: 'mimetype',
        value: whenResponse,
        inputString: matches.inputString,
      });
      matches.append(match);
    }
  }
}
