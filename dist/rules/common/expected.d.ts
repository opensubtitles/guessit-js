import { Context, MatchOptions } from 'rebulk-js';

/**
 * Build a functional pattern function that finds expected titles/groups in the string.
 * Mirrors Python's build_expected_function('expected_title').
 */
export declare function buildExpectedFunction(optionName: string): (inputString: string, context?: Context) => Array<[number, number, Partial<MatchOptions>]>;
