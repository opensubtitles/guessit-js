/**
 * Language class and lookup functions — port of babelfish
 */
import {
  LANGUAGES,
  ALPHA3_MAP,
  ALPHA2_MAP,
  NAME_MAP,
  OPENSUBTITLES_MAP,
  GUESSIT_SYNONYMS,
  type LanguageData,
} from './data.js';

export class Language {
  alpha3: string;
  country?: string;
  script?: string;

  constructor(alpha3: string, country?: string, script?: string) {
    this.alpha3 = alpha3;
    this.country = country;
    this.script = script;
  }

  /**
   * Convert to string representation: "eng" or "eng-US"
   */
  toString(): string {
    if (this.country) {
      return `${this.alpha3}-${this.country}`;
    }
    return this.alpha3;
  }

  /**
   * Get the language name
   */
  getName(): string {
    const key = this.country
      ? `${this.alpha3}-${this.country}`
      : this.alpha3;

    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && lang.country === this.country) {
        return lang.name;
      }
    }

    // Fallback to alpha3-only match
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && !lang.country) {
        return lang.name;
      }
    }

    return this.alpha3;
  }

  /**
   * Get the alpha2 code if available
   */
  getAlpha2(): string | undefined {
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && lang.country === this.country) {
        return lang.alpha2;
      }
    }

    // Fallback to alpha3-only match
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && !lang.country) {
        return lang.alpha2;
      }
    }

    return undefined;
  }

  /**
   * Get the OpenSubtitles code if available
   */
  getOpenSubtitles(): string | undefined {
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && lang.country === this.country) {
        return lang.opensubtitles;
      }
    }

    // Fallback to alpha3-only match
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && !lang.country) {
        return lang.opensubtitles;
      }
    }

    return undefined;
  }

  /**
   * Create a Language from a string (main lookup method)
   * Tries multiple formats: alpha3, alpha2, name, IETF, OpenSubtitles, synonyms
   */
  static fromString(value: string): Language | undefined {
    if (!value) return undefined;

    const lower = value.toLowerCase().trim();

    // Try as synonym first
    const lang = this.fromSynonym(lower);
    if (lang) return lang;

    // Try as direct codes
    if (lower.length === 3) {
      return this.fromAlpha3(lower);
    }

    if (lower.length === 2) {
      return this.fromAlpha2(lower);
    }

    // Try as name
    const byName = this.fromName(lower);
    if (byName) return byName;

    // Try as OpenSubtitles code
    const byOpenSubs = this.fromOpenSubtitles(lower);
    if (byOpenSubs) return byOpenSubs;

    // Try as IETF tag
    const byIETF = this.fromIetf(lower);
    if (byIETF) return byIETF;

    return undefined;
  }

  /**
   * Create a Language from alpha3 code
   */
  static fromAlpha3(code: string): Language | undefined {
    if (!code) return undefined;
    const lower = code.toLowerCase().trim();
    const lang = ALPHA3_MAP.get(lower);
    if (lang) {
      return new Language(lang.alpha3, lang.country, lang.script);
    }
    return undefined;
  }

  /**
   * Create a Language from alpha2 code
   */
  static fromAlpha2(code: string): Language | undefined {
    if (!code) return undefined;
    const lower = code.toLowerCase().trim();
    const lang = ALPHA2_MAP.get(lower);
    if (lang) {
      return new Language(lang.alpha3, lang.country, lang.script);
    }
    return undefined;
  }

  /**
   * Create a Language from language name
   */
  static fromName(name: string): Language | undefined {
    if (!name) return undefined;
    const lower = name.toLowerCase().trim();
    const lang = NAME_MAP.get(lower);
    if (lang) {
      return new Language(lang.alpha3, lang.country, lang.script);
    }
    return undefined;
  }

  /**
   * Create a Language from OpenSubtitles code
   */
  static fromOpenSubtitles(code: string): Language | undefined {
    if (!code) return undefined;
    const lower = code.toLowerCase().trim();
    const lang = OPENSUBTITLES_MAP.get(lower);
    if (lang) {
      return new Language(lang.alpha3, lang.country, lang.script);
    }
    return undefined;
  }

  /**
   * Create a Language from IETF language tag (e.g., "en-US", "pt-BR")
   */
  static fromIetf(tag: string): Language | undefined {
    if (!tag) return undefined;

    const parts = tag.toLowerCase().trim().split('-');
    if (parts.length === 0) return undefined;

    // Try as alpha2-country
    if (parts.length >= 1) {
      const byAlpha2 = this.fromAlpha2(parts[0]);
      if (byAlpha2 && parts.length >= 2) {
        // IETF country/region subtags are 2 letters (ISO 3166-1 alpha-2).
        // If the second part is 3+ letters it's likely a language code, not a country.
        if (parts[1].length === 2) {
          byAlpha2.country = parts[1].toUpperCase();
        } else {
          // Not a valid IETF tag - return undefined so each part is parsed separately
          return undefined;
        }
      }
      return byAlpha2;
    }

    return undefined;
  }

  /**
   * Create a Language from a guessit synonym
   */
  static fromSynonym(value: string): Language | undefined {
    if (!value) return undefined;
    const lower = value.toLowerCase().trim();

    for (const [key, synonyms] of Object.entries(GUESSIT_SYNONYMS)) {
      for (const syn of synonyms) {
        if (syn.toLowerCase() === lower) {
          const [alpha3, country] = key.split('_');
          return new Language(alpha3, country);
        }
      }
    }

    return undefined;
  }

  /**
   * Check equality
   */
  equals(other: Language): boolean {
    return (
      this.alpha3 === other.alpha3 &&
      this.country === other.country &&
      this.script === other.script
    );
  }
}

/**
 * Special language instances
 */
export const UNDETERMINED = new Language('und');
export const MULTIPLE = new Language('mul');

/**
 * Non-specific languages set
 */
export const NON_SPECIFIC_LANGUAGES = new Set([UNDETERMINED, MULTIPLE]);

/**
 * Check if a language is non-specific
 */
export function isNonSpecific(lang: Language): boolean {
  return lang.alpha3 === 'und' || lang.alpha3 === 'mul';
}
