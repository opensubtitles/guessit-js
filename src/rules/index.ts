/**
 * Main rebulk builder — port of guessit/rules/__init__.py
 */
import { Rebulk } from 'rebulk-js';
import { path } from './markers/path.js';
import { groups } from './markers/groups.js';
import { episodes } from './properties/episodes.js';
import { container } from './properties/container.js';
import { source } from './properties/source.js';
import { videoCodec } from './properties/video_codec.js';
import { audioCodec } from './properties/audio_codec.js';
import { screenSize } from './properties/screen_size.js';
import { website } from './properties/website.js';
import { date } from './properties/date.js';
import { title } from './properties/title.js';
import { episodeTitle } from './properties/episode_title.js';
import { language } from './properties/language.js';
import { country } from './properties/country.js';
import { releaseGroup } from './properties/release_group.js';
import { streamingService } from './properties/streaming_service.js';
import { other, completeWords } from './properties/other.js';
import { size } from './properties/size.js';
import { bitRate } from './properties/bit_rate.js';
import { edition } from './properties/edition.js';
import { cd } from './properties/cd.js';
import { bonus } from './properties/bonus.js';
import { film } from './properties/film.js';
import { part } from './properties/part.js';
import { crc } from './properties/crc.js';
import { mimetype } from './properties/mimetype.js';
import { type_ } from './properties/type.js';
import { processors } from './processors.js';

export interface AdvancedConfig {
  common_words?: string[];
  groups?: { starting: string; ending: string };
  audio_codec?: Record<string, unknown>;
  screen_size?: {
    frame_rates: string[];
    interlaced: string[];
    progressive: string[];
    min_ar: number;
    max_ar: number;
  };
  source?: Record<string, unknown>;
  episodes?: Record<string, unknown>;
  language?: Record<string, unknown>;
  country?: Record<string, unknown>;
  [key: string]: unknown;
}

export function rebulkBuilder(config: AdvancedConfig): Rebulk {
  function cfg(name: string): Record<string, unknown> {
    return (config[name] as Record<string, unknown>) ?? {};
  }

  const rebulk = new Rebulk();
  const commonWords = new Set<string>((config['common_words'] as string[]) ?? []);

  rebulk.rebulk(path(cfg('path')));
  rebulk.rebulk(groups((cfg('groups') as { starting: string; ending: string }) ?? { starting: '([{', ending: ')]}' }));

  rebulk.rebulk(episodes(cfg('episodes') as unknown as any));
  rebulk.rebulk(container(cfg('container')));
  rebulk.rebulk(source(cfg('source')));
  rebulk.rebulk(videoCodec(cfg('video_codec')));
  rebulk.rebulk(audioCodec(cfg('audio_codec')));
  rebulk.rebulk(screenSize(cfg('screen_size') as unknown as any));
  rebulk.rebulk(website(cfg('website')));
  rebulk.rebulk(date(cfg('date')));
  rebulk.rebulk(title(cfg('title')));
  rebulk.rebulk(episodeTitle(cfg('episode_title')));
  rebulk.rebulk(language(cfg('language') as unknown as any, commonWords));
  rebulk.rebulk(country(cfg('country') as unknown as any, commonWords));
  rebulk.rebulk(releaseGroup(cfg('release_group')));
  rebulk.rebulk(streamingService(cfg('streaming_service')));
  const otherRebulk = other(cfg('other'));
  const episodesConfig = cfg('episodes') as any;
  // Complete words use regex patterns for season words (from options.json _complete_words config)
  const completeSeasonWords = ['seasons?', 'series?'];
  const completeArticleWords = ['The'];
  completeWords(otherRebulk, completeSeasonWords, completeArticleWords);
  rebulk.rebulk(otherRebulk);
  rebulk.rebulk(size(cfg('size')));
  rebulk.rebulk(bitRate(cfg('bit_rate')));
  rebulk.rebulk(edition(cfg('edition')));
  rebulk.rebulk(cd(cfg('cd')));
  rebulk.rebulk(bonus(cfg('bonus')));
  rebulk.rebulk(film(cfg('film')));
  rebulk.rebulk(part(cfg('part')));
  rebulk.rebulk(crc(cfg('crc')));
  rebulk.rebulk(processors(cfg('processors')));
  rebulk.rebulk(mimetype(cfg('mimetype')));
  rebulk.rebulk(type_(cfg('type')));

  // Customize properties: rename 'count' to both 'season_count' and 'episode_count'
  (rebulk as unknown as { customizeProperties: (props: Record<string, unknown>) => Record<string, unknown> }).customizeProperties =
    function customizeProperties(properties: Record<string, unknown>) {
      const count = properties['count'];
      delete properties['count'];
      properties['season_count'] = count;
      properties['episode_count'] = count;
      return properties;
    };

  return rebulk;
}
