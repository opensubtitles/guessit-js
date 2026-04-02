import { Rebulk, Rule, CustomRule, AppendMatch, RemoveMatch, Match, Matches, Context } from 'rebulk-js';

/** Enlarge matches that start/end a group to include bracket characters. */
export declare class EnlargeGroupMatches extends CustomRule {
    static priority: number;
    when(matches: Matches, _context: Context): [Match[], Match[]] | false;
    then(matches: Matches, whenResponse: unknown, _context: Context): void;
}
/** Creates equivalent matches for holes that have the same value as an existing match. */
export declare class EquivalentHoles extends Rule {
    static priority: number;
    static consequence: typeof AppendMatch;
    when(matches: Matches, _context: Record<string, unknown>): Match[];
}
/**
 * If multiple matches with same name and different values exist, keep the one
 * in the most valuable filepart and mark others for removal.
 */
export declare class RemoveAmbiguous extends Rule {
    static priority: number;
    static consequence: typeof RemoveMatch;
    protected sortFunction: (markers: Match[], matches: Matches) => Match[];
    protected predicate: ((m: Match) => boolean) | null;
    constructor(sortFn?: (markers: Match[], matches: Matches) => Match[], predicate?: (m: Match) => boolean);
    when(matches: Matches, _context: Record<string, unknown>): Match[];
}
export declare class RemoveLessSpecificSeasonEpisode extends RemoveAmbiguous {
    constructor(name: string);
}
/** If a season is a valid year and no year found, create a year match. */
export declare class SeasonYear extends Rule {
    static priority: number;
    static consequence: typeof AppendMatch;
    when(matches: Matches, _context: Record<string, unknown>): Match[];
}
/** If year found, no season found, and episode found, create a season match. */
export declare class YearSeason extends Rule {
    static priority: number;
    static consequence: typeof AppendMatch;
    when(matches: Matches, _context: Record<string, unknown>): Match[];
}
/** Empty rule for ordering post-processing. */
export declare class Processors extends Rule {
    static priority: number;
    when(_matches: Matches, _context: Record<string, unknown>): false;
}
/** Strip separator characters from match boundaries. */
export declare class StripSeparators extends CustomRule {
    static priority: number;
    when(matches: Matches, _context: Context): Matches;
    then(matches: Matches, _whenResponse: unknown, _context: Context): void;
}
export declare function processors(_config: Record<string, unknown>): Rebulk;
