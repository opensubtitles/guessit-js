import { Match } from 'rebulk-js';

export declare const sepsBefore: (match: Match) => boolean;
export declare const sepsAfter: (match: Match) => boolean;
export declare const sepsSurround: (match: Match) => boolean;
export declare function intCoercable(string: string): boolean;
export declare function and_(...validators: ((m: Match) => boolean)[]): (m: Match) => boolean;
export declare function or_(...validators: ((m: Match) => boolean)[]): (m: Match) => boolean;
