import { Rebulk } from 'rebulk-js';
import { Rule, RemoveMatch, RenameMatch } from 'rebulk-js';
import { Match } from 'rebulk-js';
import { dash, seps , sepsPattern } from '../common/index.js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import { loadConfigPatterns, registerFunction } from '../../config/index.js';
import { BitRate } from '../common/quantity.js';

// Register the BitRate formatter so config's import:guessit.rules.common.quantity:BitRate.fromstring resolves.
// We return a string directly so the final result is serialized correctly.
registerFunction(
  'guessit.rules.common.quantity:BitRate.fromstring',
  (s: string) => BitRate.fromstring(s).toString(),
);

export function bitRate(config: Record<string, unknown>) {
  const rebulk = new Rebulk({
    disabled: (context) =>
      isDisabled(context, 'audio_bit_rate') && isDisabled(context, 'video_bit_rate'),
  });
  rebulk.regexDefaults({ flags: 'i', abbreviations: [dash] });
  rebulk.defaults({ name: 'audio_bit_rate', validator: sepsSurround });

  loadConfigPatterns(rebulk, config['bit_rate'] as Record<string, unknown>);

  rebulk.rules(BitRateTypeRule);

  return rebulk;
}

class BitRateTypeRule extends Rule {
  static consequence = [new RenameMatch('video_bit_rate'), RemoveMatch];

  when(matches: any, context: Record<string, unknown>) {
    const toRename = [];
    const toRemove = [];

    if (isDisabled(context, 'audio_bit_rate')) {
      // Excluding a property must not turn its text into a different one. Removing
      // the match reopens the span as a hole, and "448kbps" of
      // "Hotel.Hell.S01E01.720p.DD5.1.448kbps-ALANiS" came back as the episode
      // title under `--exclude audio_bit_rate`. Marking it private keeps the text
      // claimed and keeps it out of the result, which is what Python reports.
      for (const match of matches.named('audio_bit_rate')) {
        (match as unknown as { private: boolean }).private = true;
      }
    } else {
      const videoBitRateDisabled = isDisabled(context, 'video_bit_rate');
      for (const match of matches.named('audio_bit_rate')) {
        const previous = matches.previous(
          match,
          (m: Match) => ['source', 'screen_size', 'video_codec'].includes(m.name ?? ''),
          0
        );
        // Check for only-separator text between previous and current match
        const inputStr = matches.inputString ?? '';
        const onlySepsBetween = (a: number, b: number) =>
          inputStr.slice(a, b).replace(new RegExp(`[${sepsPattern}]`, 'g'), '') === '';

        const noHolesBefore = previous ? onlySepsBetween(previous.end, match.start) : false;

        if (previous && noHolesBefore) {
          const bitrate = String(match.value);
          const lc = bitrate.toLowerCase();
          const isKbps = /kbps$|kbits?$/.test(lc);

          // Path A: audio_codec follows immediately (only seps between) → rename if not audio rate
          const after = matches.next(
            match,
            (m: Match) => m.name === 'audio_codec',
            0
          );
          if (after && onlySepsBetween(match.end, after.start)) {
            if (!isKbps) {
              if (videoBitRateDisabled) {
                toRemove.push(match);
              } else {
                toRename.push(match);
              }
            }
            continue;
          }

          // Path B: no audio_codec after, but Mbps bit_rate after video-related match → video
          if (!isKbps) {
            if (videoBitRateDisabled) {
              toRemove.push(match);
            } else {
              toRename.push(match);
            }
          }
        }
      }
    }

    if (toRename.length || toRemove.length) {
      return [toRename, toRemove];
    }
    return false;
  }
}
