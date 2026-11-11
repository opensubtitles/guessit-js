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

  // The Plex/Jellyfin spelling carries a prefix — "{imdb-tt1234567}" — which has to
  // be part of the match, or the bare "imdb" is left over and reads as a title.
  rebulk.regex('(?:imdb(?:id)?[-=]?)?(?<imdb_id>tt\\d{7,8})', {
    name: 'imdb_id', privateParent: true, children: true,
    formatter: (value: string) => value.toLowerCase(),
  } as any);

  // TMDb / TVDb ids in Plex/Jellyfin-style naming: {tmdb-12345}, [tvdbid-12345],
  // tmdb=12345, etc. Capture the numeric id.
  // privateParent, not private_parent: the engine reads camelCase, so the
  // snake_case spelling was silently ignored and the "tmdb-" prefix stayed
  // unclaimed — long enough to be picked up as an alternative_title "tmdb".
  rebulk.regex('tmdb(?:id)?[-=]?(?<tmdb_id>\\d{1,9})', {
    name: 'tmdb_id', privateParent: true, children: true,
    formatter: (value: string) => parseInt(value, 10),
  } as any);
  rebulk.regex('tvdb(?:id)?[-=]?(?<tvdb_id>\\d{1,9})', {
    name: 'tvdb_id', privateParent: true, children: true,
    formatter: (value: string) => parseInt(value, 10),
  } as any);

  return rebulk;
}
