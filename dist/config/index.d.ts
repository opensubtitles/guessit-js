import { Rebulk } from 'rebulk-js';

export declare function registerFunction(name: string, fn: unknown): void;
export declare function loadPatterns(rebulk: Rebulk, patternType: 'regex' | 'string', patterns: string[], options?: Record<string | symbol, unknown>): void;
/**
 * Load patterns defined in the given config dict into the rebulk builder.
 * Mirrors Python's load_config_patterns().
 */
export declare function loadConfigPatterns(rebulk: Rebulk, config: Record<string, unknown> | undefined, options?: Record<string | symbol, unknown>): void;
