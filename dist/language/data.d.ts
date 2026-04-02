/**
 * Language data lookup table — port of babelfish with custom additions
 */
export interface LanguageData {
    alpha3: string;
    alpha2?: string;
    name: string;
    opensubtitles?: string;
    country?: string;
    script?: string;
}
export declare const LANGUAGES: LanguageData[];
export declare const ALPHA3_MAP: Map<string, LanguageData>;
export declare const ALPHA2_MAP: Map<string, LanguageData>;
export declare const NAME_MAP: Map<string, LanguageData>;
export declare const OPENSUBTITLES_MAP: Map<string, LanguageData>;
/**
 * Guessit synonym mappings from config
 */
export declare const GUESSIT_SYNONYMS: Record<string, string[]>;
/**
 * Countries data
 */
export declare const COUNTRIES: Record<string, string>;
