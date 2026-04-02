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

export const LANGUAGES: LanguageData[] = [
  // Major languages
  { alpha3: 'eng', alpha2: 'en', name: 'English', opensubtitles: 'eng' },
  { alpha3: 'fra', alpha2: 'fr', name: 'French', opensubtitles: 'fre' },
  { alpha3: 'deu', alpha2: 'de', name: 'German', opensubtitles: 'ger' },
  { alpha3: 'spa', alpha2: 'es', name: 'Spanish', opensubtitles: 'spa' },
  { alpha3: 'ita', alpha2: 'it', name: 'Italian', opensubtitles: 'ita' },
  { alpha3: 'por', alpha2: 'pt', name: 'Portuguese', opensubtitles: 'por' },
  { alpha3: 'rus', alpha2: 'ru', name: 'Russian', opensubtitles: 'rus' },
  { alpha3: 'jpn', alpha2: 'ja', name: 'Japanese', opensubtitles: 'jpn' },
  { alpha3: 'zho', alpha2: 'zh', name: 'Chinese', opensubtitles: 'chi' },
  { alpha3: 'kor', alpha2: 'ko', name: 'Korean', opensubtitles: 'kor' },
  { alpha3: 'ara', alpha2: 'ar', name: 'Arabic', opensubtitles: 'ara' },
  { alpha3: 'hin', alpha2: 'hi', name: 'Hindi', opensubtitles: 'hin' },
  { alpha3: 'tur', alpha2: 'tr', name: 'Turkish', opensubtitles: 'tur' },
  { alpha3: 'pol', alpha2: 'pl', name: 'Polish', opensubtitles: 'pol' },
  { alpha3: 'nld', alpha2: 'nl', name: 'Dutch', opensubtitles: 'dut' },
  { alpha3: 'swe', alpha2: 'sv', name: 'Swedish', opensubtitles: 'swe' },
  { alpha3: 'dan', alpha2: 'da', name: 'Danish', opensubtitles: 'dan' },
  { alpha3: 'nor', alpha2: 'no', name: 'Norwegian', opensubtitles: 'nor' },
  { alpha3: 'fin', alpha2: 'fi', name: 'Finnish', opensubtitles: 'fin' },
  { alpha3: 'hun', alpha2: 'hu', name: 'Hungarian', opensubtitles: 'hun' },
  { alpha3: 'ces', alpha2: 'cs', name: 'Czech', opensubtitles: 'cze' },
  { alpha3: 'rum', alpha2: 'ro', name: 'Romanian', opensubtitles: 'rum' },
  { alpha3: 'ukr', alpha2: 'uk', name: 'Ukrainian', opensubtitles: 'ukr' },
  { alpha3: 'heb', alpha2: 'he', name: 'Hebrew', opensubtitles: 'heb' },
  { alpha3: 'cat', alpha2: 'ca', name: 'Catalan', opensubtitles: 'cat' },
  { alpha3: 'vie', alpha2: 'vi', name: 'Vietnamese', opensubtitles: 'vie' },
  { alpha3: 'tha', alpha2: 'th', name: 'Thai', opensubtitles: 'tha' },
  { alpha3: 'ind', alpha2: 'id', name: 'Indonesian', opensubtitles: 'ind' },
  { alpha3: 'mal', alpha2: 'ml', name: 'Malayalam', opensubtitles: 'mal' },
  { alpha3: 'tel', alpha2: 'te', name: 'Telugu', opensubtitles: 'tel' },
  { alpha3: 'tam', alpha2: 'ta', name: 'Tamil', opensubtitles: 'tam' },
  { alpha3: 'bul', alpha2: 'bg', name: 'Bulgarian', opensubtitles: 'bul' },
  { alpha3: 'hrv', alpha2: 'hr', name: 'Croatian', opensubtitles: 'hrv' },
  { alpha3: 'srp', alpha2: 'sr', name: 'Serbian', opensubtitles: 'srp' },
  { alpha3: 'slk', alpha2: 'sk', name: 'Slovak', opensubtitles: 'slo' },
  { alpha3: 'slv', alpha2: 'sl', name: 'Slovenian', opensubtitles: 'slv' },
  { alpha3: 'ell', alpha2: 'el', name: 'Greek', opensubtitles: 'ell' },
  { alpha3: 'lit', alpha2: 'lt', name: 'Lithuanian', opensubtitles: 'lit' },
  { alpha3: 'lav', alpha2: 'lv', name: 'Latvian', opensubtitles: 'lav' },
  { alpha3: 'est', alpha2: 'et', name: 'Estonian', opensubtitles: 'est' },
  { alpha3: 'glg', alpha2: 'gl', name: 'Galician', opensubtitles: 'glg' },
  { alpha3: 'eus', alpha2: 'eu', name: 'Basque', opensubtitles: 'baq' },
  { alpha3: 'ben', alpha2: 'bn', name: 'Bengali', opensubtitles: 'ben' },
  { alpha3: 'isl', alpha2: 'is', name: 'Icelandic', opensubtitles: 'ice' },
  { alpha3: 'mkd', alpha2: 'mk', name: 'Macedonian', opensubtitles: 'mac' },
  { alpha3: 'bos', alpha2: 'bs', name: 'Bosnian', opensubtitles: 'bos' },
  { alpha3: 'alb', alpha2: 'sq', name: 'Albanian', opensubtitles: 'alb' },
  { alpha3: 'per', alpha2: 'fa', name: 'Persian', opensubtitles: 'per' },
  { alpha3: 'msa', alpha2: 'ms', name: 'Malay', opensubtitles: 'may' },
  { alpha3: 'mon', alpha2: 'mn', name: 'Mongolian', opensubtitles: 'mon' },
  { alpha3: 'tha', alpha2: 'th', name: 'Thai', opensubtitles: 'tha' },
  { alpha3: 'urd', alpha2: 'ur', name: 'Urdu', opensubtitles: 'urd' },
  { alpha3: 'pan', alpha2: 'pa', name: 'Punjabi', opensubtitles: 'pun' },
  { alpha3: 'guj', alpha2: 'gu', name: 'Gujarati', opensubtitles: 'guj' },
  { alpha3: 'kan', alpha2: 'kn', name: 'Kannada', opensubtitles: 'kan' },
  { alpha3: 'mar', alpha2: 'mr', name: 'Marathi', opensubtitles: 'mar' },
  { alpha3: 'asm', alpha2: 'as', name: 'Assamese', opensubtitles: 'asm' },
  { alpha3: 'mya', alpha2: 'my', name: 'Burmese', opensubtitles: 'mya' },
  { alpha3: 'khm', alpha2: 'km', name: 'Khmer', opensubtitles: 'khm' },
  { alpha3: 'lao', alpha2: 'lo', name: 'Lao', opensubtitles: 'lao' },

  // Regional variants
  { alpha3: 'por', alpha2: 'pt', name: 'Brazilian Portuguese', country: 'BR', opensubtitles: 'pob' },
  { alpha3: 'zho', alpha2: 'zh', name: 'Simplified Chinese', country: 'CN', opensubtitles: 'chi' },
  { alpha3: 'zho', alpha2: 'zh', name: 'Traditional Chinese', country: 'TW', opensubtitles: 'zht' },
  { alpha3: 'zho', alpha2: 'zh', name: 'Hong Kong Chinese', country: 'HK', opensubtitles: 'zht' },
  { alpha3: 'deu', alpha2: 'de', name: 'Swiss German', country: 'CH', opensubtitles: 'ger' },
  { alpha3: 'fra', alpha2: 'fr', name: 'Swiss French', country: 'CH', opensubtitles: 'fre' },
  { alpha3: 'ita', alpha2: 'it', name: 'Swiss Italian', country: 'CH', opensubtitles: 'ita' },
  { alpha3: 'nld', alpha2: 'nl', name: 'Flemish', country: 'BE', opensubtitles: 'dut' },

  // Special languages
  { alpha3: 'und', name: 'Undetermined', opensubtitles: 'und' },
  { alpha3: 'mul', name: 'Multiple Languages', opensubtitles: 'mul' },
];

/**
 * Build lookup maps from language data
 */
function buildLookupMap<K extends keyof LanguageData>(key: K): Map<string, LanguageData> {
  const map = new Map<string, LanguageData>();
  for (const lang of LANGUAGES) {
    const value = lang[key];
    if (value) {
      const k = String(value).toLowerCase();
      // Prefer entries without country/region (generic language) over
      // country-specific variants so that e.g. "fr" maps to French,
      // not Swiss French.
      if (!map.has(k) || (!lang.country && map.get(k)!.country)) {
        map.set(k, lang);
      }
    }
  }
  return map;
}

export const ALPHA3_MAP = buildLookupMap('alpha3');
export const ALPHA2_MAP = buildLookupMap('alpha2');
export const NAME_MAP = buildLookupMap('name');
export const OPENSUBTITLES_MAP = buildLookupMap('opensubtitles');

/**
 * Guessit synonym mappings from config
 */
export const GUESSIT_SYNONYMS: Record<string, string[]> = {
  'ell': ['gr', 'greek'],
  'spa': ['esp', 'español', 'espanol'],
  'fra': ['français', 'vf', 'vff', 'vfi', 'vfq'],
  'swe': ['se'],
  'por_BR': ['po', 'pb', 'pob', 'ptbr', 'br', 'brazilian'],
  'deu_CH': ['swissgerman', 'swiss german'],
  'nld_BE': ['flemish'],
  'cat': ['català', 'castellano', 'espanol castellano', 'español castellano'],
  'ces': ['cz'],
  'ukr': ['ua'],
  'zho': ['cn'],
  'jpn': ['jp'],
  'hrv': ['scr'],
  'mul': ['multi', 'multiple', 'dl'],
};

/**
 * Countries data
 */
export const COUNTRIES: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'FR': 'France',
  'DE': 'Germany',
  'ES': 'Spain',
  'IT': 'Italy',
  'PT': 'Portugal',
  'BR': 'Brazil',
  'CA': 'Canada',
  'AU': 'Australia',
  'JP': 'Japan',
  'CN': 'China',
  'IN': 'India',
  'RU': 'Russia',
  'MX': 'Mexico',
  'CH': 'Switzerland',
  'BE': 'Belgium',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'SK': 'Slovakia',
  'HU': 'Hungary',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'RS': 'Serbia',
  'GR': 'Greece',
  'TR': 'Turkey',
  'KR': 'South Korea',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'ID': 'Indonesia',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'PH': 'Philippines',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'IL': 'Israel',
  'EG': 'Egypt',
  'ZA': 'South Africa',
  'NG': 'Nigeria',
};
