/**
 * Main API — port of guessit/api.py
 */
import type { Rebulk } from 'rebulk-js';
import { rebulkBuilder, type AdvancedConfig } from './rules/index.js';
import { parseOptions, loadConfig, mergeOptions, type GuessItOptions, type RawOptions } from './options.js';

export class GuessItException extends Error {
  string: string;
  options: Record<string, unknown>;

  constructor(string: string, options: Record<string, unknown>, cause?: unknown) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(
      `An internal error has occurred in guessit.\n` +
      `string=${string}\n` +
      `options=${JSON.stringify(options)}\n` +
      causeMsg,
    );
    this.name = 'GuessItException';
    this.string = string;
    this.options = options;
    if (cause instanceof Error) (this as unknown as { cause: unknown }).cause = cause;
  }
}

export interface GuessItResult {
  [key: string]: unknown;
}

export class GuessItApi {
  private _rebulk: Rebulk | null = null;
  private _config: Record<string, unknown> | null = null;
  private _loadConfigOptions: GuessItOptions | null = null;
  private _advancedConfig: unknown = null;

  reset(): void {
    this._rebulk = null;
    this._config = null;
    this._loadConfigOptions = null;
    this._advancedConfig = null;
  }

  configure(
    options?: RawOptions,
    rulesBuilder?: (config: AdvancedConfig) => Rebulk,
    force = false,
    sanitizeOptions = true,
  ): Record<string, unknown> {
    const builder = rulesBuilder ?? rebulkBuilder;

    let parsedOptions = sanitizeOptions ? parseOptions(options, true) : (options as GuessItOptions ?? {});

    const hasSameConfigProps = (a: GuessItOptions, b: GuessItOptions) =>
      a['config'] === b['config'] &&
      a.noUserConfig === b.noUserConfig &&
      a.noDefaultConfig === b.noDefaultConfig;

    let config: Record<string, unknown>;
    if (this._config === null || this._loadConfigOptions === null || force ||
        !hasSameConfigProps(this._loadConfigOptions, parsedOptions)) {
      config = loadConfig(parsedOptions);
      this._loadConfigOptions = parsedOptions;
    } else {
      config = this._config;
    }

    const advancedConfig = mergeOptions(
      (config['advanced_config'] as Record<string, unknown>) ?? {},
      (parsedOptions['advancedConfig'] as Record<string, unknown>) ?? {},
    );

    const shouldBuild = force || !this._rebulk || !this._advancedConfig ||
      JSON.stringify(this._advancedConfig) !== JSON.stringify(advancedConfig);

    if (shouldBuild) {
      this._advancedConfig = JSON.parse(JSON.stringify(advancedConfig));
      this._rebulk = builder(advancedConfig as AdvancedConfig);
    }

    this._config = config;
    return config;
  }

  guessit(string: string, options?: RawOptions): GuessItResult {
    try {
      const parsedOptions = parseOptions(options, true);
      const config = this.configure(parsedOptions, undefined, false, false);
      const mergedOptions = mergeOptions(config, parsedOptions);

      if (!this._rebulk) {
        throw new Error('Rebulk not initialized');
      }

      const matches = this._rebulk.matches(string, mergedOptions);
      const matchesDict = matches.toDict(
        !!(mergedOptions['advanced'] as boolean),
        !!(mergedOptions['singleValue'] as boolean) || !!(mergedOptions['single_value'] as boolean),
        !!(mergedOptions['enforceList'] as boolean) || !!(mergedOptions['enforce_list'] as boolean),
      );

      // Convert Map → plain object so callers can do result[key]
      const result: GuessItResult = Object.fromEntries(matchesDict);
      if (mergedOptions['outputInputString'] || mergedOptions['output_input_string']) {
        result['input_string'] = matches.inputString;
      }

      return result;
    } catch (err) {
      if (err instanceof GuessItException) throw err;
      throw new GuessItException(
        string,
        typeof options === 'object' && options !== null ? options as Record<string, unknown> : {},
        err,
      );
    }
  }

  properties(options?: RawOptions): Record<string, unknown[]> {
    const parsedOptions = parseOptions(options, true);
    const config = this.configure(parsedOptions, undefined, false, false);
    const mergedOptions = mergeOptions(config, parsedOptions);

    if (!this._rebulk) return {};

    // Collect properties from all patterns
    const props: Record<string, Set<unknown>> = {};
    for (const pattern of (this._rebulk as unknown as { effectivePatterns(): Array<{ name?: string; properties?: Record<string, unknown[]> }> }).effectivePatterns()) {
      if (pattern.properties) {
        for (const [k, vals] of Object.entries(pattern.properties)) {
          if (!props[k]) props[k] = new Set();
          for (const v of vals) props[k].add(v);
        }
      }
    }

    const ordered: Record<string, unknown[]> = {};
    for (const k of Object.keys(props).sort()) {
      ordered[k] = [...props[k]].sort((a, b) => String(a).localeCompare(String(b)));
    }

    const rb = this._rebulk as unknown as { customizeProperties?: (p: Record<string, unknown>) => Record<string, unknown> };
    if (rb.customizeProperties) {
      return rb.customizeProperties(ordered) as Record<string, unknown[]>;
    }
    return ordered;
  }

  suggestedExpected(titles: string[], options?: RawOptions): string[] {
    const suggested: string[] = [];
    for (const title of titles) {
      const guess = this.guessit(title, options);
      if (Object.keys(guess).length !== 2 || !('title' in guess)) {
        suggested.push(title);
      }
    }
    return suggested;
  }
}

/** Default singleton API instance */
export const defaultApi = new GuessItApi();

/**
 * Guess metadata from a filename or release name.
 */
export function guessit(string: string, options?: RawOptions): GuessItResult {
  return defaultApi.guessit(string, options);
}

/**
 * Get all properties that can be detected.
 */
export function properties(options?: RawOptions): Record<string, unknown[]> {
  return defaultApi.properties(options);
}

/**
 * Configure the default API instance.
 */
export function configure(
  options?: RawOptions,
  rulesBuilder?: (config: AdvancedConfig) => Rebulk,
  force = false,
): void {
  defaultApi.configure(options, rulesBuilder, force);
}

/**
 * Reset the default API instance.
 */
export function reset(): void {
  defaultApi.reset();
}
