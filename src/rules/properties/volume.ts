/**
 * volume property — detects "vol. N" / "volume N" (common for manga/anime/music
 * box sets). guessit-js enhancement (upstream feature request
 * guessit-io/guessit#301); not present in Python guessit.
 */
import { Rebulk } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';

export function volume(_config: Record<string, unknown>): Rebulk {
  const rebulk = new Rebulk({ disabled: (context: Record<string, unknown>) => isDisabled(context, 'volume') });
  rebulk.regexDefaults({ flags: 'i' });

  // Match the whole "vol…N" token (so it's excluded from the title) and extract
  // the number. Either the short marker glued to digits ("vol127") or any marker
  // followed by a separator ("vol.3", "vol 3", "volume 12"). "volume1" (full word
  // glued, as in the NAS path "/volume1/") is intentionally NOT matched.
  rebulk.regex('vol(?:\\d{1,3}|(?:ume)?[-. ]\\d{1,3})', {
    name: 'volume',
    validator: sepsSurround,
    formatter: (value: string) => parseInt(value.replace(/\D/g, ''), 10),
  } as any);

  return rebulk;
}
