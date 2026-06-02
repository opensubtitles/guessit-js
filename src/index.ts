/**
 * guessit-js — TypeScript port of the Python guessit library.
 * Extracts metadata from media filenames.
 *
 * @example
 * import { guessit } from 'guessit-js';
 * guessit('The.Dark.Knight.2008.1080p.BluRay.x264-GROUP.mkv');
 * // => { title: 'The Dark Knight', year: 2008, screen_size: '1080p', source: 'Blu-ray', video_codec: 'H.264', release_group: 'GROUP', container: 'mkv', mimetype: 'video/x-matroska', type: 'movie' }
 */

export { guessit, properties, configure, reset, defaultApi, GuessItApi, GuessItException } from './api.js';
export { GUESSIT_SCHEMA } from './schema.js';
export type { GuessItResult, GuessitLanguage, PropertySchema } from './schema.js';
export { parseOptions, loadConfig, mergeOptions } from './options.js';
export type { GuessItOptions, RawOptions } from './options.js';
export { rebulkBuilder } from './rules/index.js';
export type { AdvancedConfig } from './rules/index.js';
