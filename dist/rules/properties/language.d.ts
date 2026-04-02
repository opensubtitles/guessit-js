import { Rebulk } from 'rebulk-js';

interface LanguageConfig {
    subtitle_affixes: string[];
    subtitle_prefixes: string[];
    subtitle_suffixes: string[];
    language_affixes: string[];
    language_prefixes: string[];
    language_suffixes: string[];
    weak_affixes: string[];
    synonyms: Record<string, string[]>;
}
/**
 * Main language property builder
 */
export declare function language(config: LanguageConfig, commonWords: Set<string>): Rebulk;
export {};
