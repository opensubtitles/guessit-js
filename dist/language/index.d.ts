export declare class Language {
    alpha3: string;
    country?: string;
    script?: string;
    constructor(alpha3: string, country?: string, script?: string);
    /**
     * Convert to string representation: "eng" or "eng-US"
     */
    toString(): string;
    /**
     * Get the language name
     */
    getName(): string;
    /**
     * Get the alpha2 code if available
     */
    getAlpha2(): string | undefined;
    /**
     * Get the OpenSubtitles code if available
     */
    getOpenSubtitles(): string | undefined;
    /**
     * Create a Language from a string (main lookup method)
     * Tries multiple formats: alpha3, alpha2, name, IETF, OpenSubtitles, synonyms
     */
    static fromString(value: string): Language | undefined;
    /**
     * Create a Language from alpha3 code
     */
    static fromAlpha3(code: string): Language | undefined;
    /**
     * Create a Language from alpha2 code
     */
    static fromAlpha2(code: string): Language | undefined;
    /**
     * Create a Language from language name
     */
    static fromName(name: string): Language | undefined;
    /**
     * Create a Language from OpenSubtitles code
     */
    static fromOpenSubtitles(code: string): Language | undefined;
    /**
     * Create a Language from IETF language tag (e.g., "en-US", "pt-BR")
     */
    static fromIetf(tag: string): Language | undefined;
    /**
     * Create a Language from a guessit synonym
     */
    static fromSynonym(value: string): Language | undefined;
    /**
     * Check equality
     */
    equals(other: Language): boolean;
}
/**
 * Special language instances
 */
export declare const UNDETERMINED: Language;
export declare const MULTIPLE: Language;
/**
 * Non-specific languages set
 */
export declare const NON_SPECIFIC_LANGUAGES: Set<Language>;
/**
 * Check if a language is non-specific
 */
export declare function isNonSpecific(lang: Language): boolean;
