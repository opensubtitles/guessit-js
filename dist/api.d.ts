import { Rebulk } from 'rebulk-js';
import { AdvancedConfig } from './rules/index.js';
import { RawOptions } from './options.js';

export declare class GuessItException extends Error {
    string: string;
    options: Record<string, unknown>;
    constructor(string: string, options: Record<string, unknown>, cause?: unknown);
}
export interface GuessItResult {
    [key: string]: unknown;
}
export declare class GuessItApi {
    private _rebulk;
    private _config;
    private _loadConfigOptions;
    private _advancedConfig;
    reset(): void;
    configure(options?: RawOptions, rulesBuilder?: (config: AdvancedConfig) => Rebulk, force?: boolean, sanitizeOptions?: boolean): Record<string, unknown>;
    guessit(string: string, options?: RawOptions): GuessItResult;
    properties(options?: RawOptions): Record<string, unknown[]>;
    suggestedExpected(titles: string[], options?: RawOptions): string[];
}
/** Default singleton API instance */
export declare const defaultApi: GuessItApi;
/**
 * Guess metadata from a filename or release name.
 */
export declare function guessit(string: string, options?: RawOptions): GuessItResult;
/**
 * Get all properties that can be detected.
 */
export declare function properties(options?: RawOptions): Record<string, unknown[]>;
/**
 * Configure the default API instance.
 */
export declare function configure(options?: RawOptions, rulesBuilder?: (config: AdvancedConfig) => Rebulk, force?: boolean): void;
/**
 * Reset the default API instance.
 */
export declare function reset(): void;
