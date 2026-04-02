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
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  'pdf': 'application/pdf',
};

export function mimetype(_config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'mimetype') });
  rebulk.rules(Mimetype);
  return rebulk;
}

class Mimetype extends Rule {
  static override priority = POST_PROCESS;
  static override dependency = ['Processors'];
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
