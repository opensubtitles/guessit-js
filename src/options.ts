/**
 * Options handling — port of guessit/options.py
 */
import defaultOptions from './config/options.json' assert { type: 'json' };

export interface GuessItOptions {
  type?: 'movie' | 'episode';
  nameOnly?: boolean;
  dateYearFirst?: boolean;
  dateDayFirst?: boolean;
  allowedLanguages?: string[];
  allowedCountries?: string[];
  episodePreferNumber?: boolean;
  expectedTitle?: string[];
  expectedGroup?: string[];
  includes?: string[];
  excludes?: string[];
  advanced?: boolean;
  singleValue?: boolean;
  enforceList?: boolean;
  outputInputString?: boolean;
  noUserConfig?: boolean;
  noDefaultConfig?: boolean;
  advancedConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

export type RawOptions = string | string[] | GuessItOptions | null | undefined;

/**
 * Parse raw options into a normalized options dict.
 * In the JS version we don't support CLI args, only dict/null.
 */
export function parseOptions(options?: RawOptions, _api = false): GuessItOptions {
  if (!options) return {};
  if (typeof options === 'object' && !Array.isArray(options)) return options as GuessItOptions;
  // String or array: return empty (CLI not supported in JS)
  return {};
}

/**
 * Load and merge configuration from the default options JSON.
 */
export function loadConfig(options: GuessItOptions = {}): Record<string, unknown> {
  const configurations: Record<string, unknown>[] = [];

  if (!options.noDefaultConfig) {
    configurations.push(defaultOptions as Record<string, unknown>);
  }

  const config: Record<string, unknown> = configurations.length > 0
    ? mergeOptions(...configurations)
    : {};

  // Always ensure advanced_config is present
  if (!('advanced_config' in config)) {
    config['advanced_config'] = (defaultOptions as Record<string, unknown>)['advanced_config'];
  }

  return config;
}

/**
 * Deep merge multiple options objects into one.
 */
export function mergeOptions(...optionsList: Record<string, unknown>[]): Record<string, unknown> {
  let merged: Record<string, unknown> = {};

  if (optionsList.length === 0) return merged;

  if (optionsList[0]) {
    merged = deepCopy(optionsList[0]);
  }

  for (const opts of optionsList.slice(1)) {
    if (!opts) continue;
    const pristine = opts['pristine'];
    if (pristine === true) {
      merged = {};
    } else if (Array.isArray(pristine)) {
      for (const key of pristine) {
        delete merged[key];
      }
    }

    for (const [option, value] of Object.entries(opts)) {
      mergeOptionValue(option, value, merged);
    }
  }

  return merged;
}

function mergeOptionValue(
  option: string,
  value: unknown,
  merged: Record<string, unknown>,
): void {
  if (value !== null && value !== undefined && option !== 'pristine') {
    const existing = merged[option];
    if (Array.isArray(existing) && Array.isArray(value)) {
      for (const val of value) {
        if (!existing.includes(val) && val !== null) {
          existing.push(val);
        }
      }
    } else if (existing !== null && typeof existing === 'object' && !Array.isArray(existing) &&
               value !== null && typeof value === 'object' && !Array.isArray(value)) {
      merged[option] = mergeOptions(existing as Record<string, unknown>, value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      merged[option] = [...value];
    } else {
      merged[option] = value;
    }
  }
}

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
