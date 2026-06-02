/**
 * Main API — port of guessit/api.py
 */
import type { Rebulk } from 'rebulk-js';
import { rebulkBuilder, type AdvancedConfig } from './rules/index.js';
import { parseOptions, loadConfig, mergeOptions, type GuessItOptions, type RawOptions } from './options.js';
import { GUESSIT_SCHEMA } from './schema.js';
export type { GuessItResult, GuessitLanguage, PropertySchema } from './schema.js';
export { GUESSIT_SCHEMA } from './schema.js';
import type { GuessItResult } from './schema.js';

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

      // Dedup language / subtitle_language VALUES at render time. Python never
      // lists the same language twice (e.g. "VFF+VFQ" -> a single fra, two "eng"
      // tags -> one). We dedup here rather than removing matches, because those
      // duplicate matches are load-bearing — they suppress their text from
      // adjacent title/episode_title holes. Distinct languages are preserved.
      for (const key of ['language', 'subtitle_language']) {
        const v = result[key];
        if (!Array.isArray(v)) continue;
        const seen = new Set<string>();
        const deduped = v.filter((lang) => {
          const id = lang && typeof lang === 'object' && 'alpha3' in lang
            ? `${(lang as any).alpha3}:${(lang as any).country ?? ''}`
            : String(lang);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        result[key] = deduped.length === 1 ? deduped[0] : deduped;
      }
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

    let ordered: Record<string, unknown[]> = {};
    for (const k of Object.keys(props).sort()) {
      ordered[k] = [...props[k]].sort((a, b) => String(a).localeCompare(String(b)));
    }

    const rb = this._rebulk as unknown as { customizeProperties?: (p: Record<string, unknown>) => Record<string, unknown> };
    if (rb.customizeProperties) {
      ordered = rb.customizeProperties(ordered) as Record<string, unknown[]>;
    }

    // Final step: complete the (incomplete) pattern-derived map with the
    // declarative GUESSIT_SCHEMA so every emittable property is advertised with
    // its possible values — like Python's guessit.api.properties(). Done AFTER
    // customizeProperties (which otherwise blanks count properties). Value-
    // constrained properties get their enum; free/computed ones (title, episode,
    // year, …) get [null], matching Python's convention.
    for (const [name, def] of Object.entries(GUESSIT_SCHEMA)) {
      const cur = Array.isArray(ordered[name]) ? ordered[name] : [];
      if (def.enum) {
        const merged = new Set([...cur, ...def.enum]);
        ordered[name] = [...merged].sort((a, b) => String(a).localeCompare(String(b)));
      } else if (cur.length === 0) {
        ordered[name] = [null];
      }
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
