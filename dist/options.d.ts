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
export declare function parseOptions(options?: RawOptions, _api?: boolean): GuessItOptions;
/**
 * Load and merge configuration from the default options JSON.
 */
export declare function loadConfig(options?: GuessItOptions): Record<string, unknown>;
/**
 * Deep merge multiple options objects into one.
 */
export declare function mergeOptions(...optionsList: Record<string, unknown>[]): Record<string, unknown>;
