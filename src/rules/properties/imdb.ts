/**
 * imdb_id property — extracts an IMDb id (e.g. tt1234567) from the filename.
 *
 * Not present in Python guessit; this is a guessit-js enhancement (upstream
 * feature request guessit-io/guessit#622). IMDb ids are `tt` followed by 7–8
 * digits and appear in release names like "Movie.2020.tt1234567.1080p…" or
 * "[tt12345678]".
 */
import { Rebulk } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';

export function imdb(_config: Record<string, unknown>): Rebulk {
  const rebulk = new Rebulk({ disabled: (context: Record<string, unknown>) => isDisabled(context, 'imdb_id') });
  rebulk.regexDefaults({ flags: 'i' });
  rebulk.defaults({ validator: sepsSurround });

  rebulk.regex('tt\\d{7,8}', {
    name: 'imdb_id',
    formatter: (value: string) => value.toLowerCase(),
  } as any);

  return rebulk;
}
