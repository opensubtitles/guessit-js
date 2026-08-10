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
  // Fansub variants: "Vol. 1v2" (version), "Vol.1&2" (pair) — consume the whole
  // token so nothing leaks into the weak-episode chains or the title.
  rebulk.regex('vol(?:\\d{1,3}|(?:ume)?[-. ]{1,2}\\d{1,3})(?:v\\d)?(?:[&+]\\d{1,3})?', {
    name: 'volume',
    validator: sepsSurround,
    formatter: (value: string) => parseInt(String(value).replace(/^vol(?:ume)?[-. ]*/i, '').replace(/[v&+].*$/i, ''), 10),
    conflictSolver: (match: any, other: any) =>
      (other.name === 'episode' || other.name === 'season') ? other : '__default__',
  } as any);

  return rebulk;
}
