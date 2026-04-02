import { Rebulk } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';
import { iterWords } from '../common/words.js';

// Simple country lookup map
const COUNTRY_MAP: Record<string, string> = {
  'us': 'US',
  'usa': 'US',
  'united states': 'US',
  'gb': 'GB',
  'uk': 'GB',
  'united kingdom': 'GB',
  'ca': 'CA',
  'canada': 'CA',
  'de': 'DE',
  'germany': 'DE',
  'fr': 'FR',
  'france': 'FR',
  'it': 'IT',
  'italy': 'IT',
  'es': 'ES',
  'spain': 'ES',
  'nl': 'NL',
  'netherlands': 'NL',
  'be': 'BE',
  'belgium': 'BE',
  'ch': 'CH',
  'switzerland': 'CH',
  'se': 'SE',
  'sweden': 'SE',
  'no': 'NO',
  'norway': 'NO',
  'dk': 'DK',
  'denmark': 'DK',
  'fi': 'FI',
  'finland': 'FI',
  'pl': 'PL',
  'poland': 'PL',
  'ru': 'RU',
  'russia': 'RU',
  'cn': 'CN',
  'china': 'CN',
  'jp': 'JP',
  'japan': 'JP',
  'au': 'AU',
  'australia': 'AU',
  'nz': 'NZ',
  'new zealand': 'NZ',
  'in': 'IN',
  'india': 'IN',
  'br': 'BR',
  'brazil': 'BR',
  'mx': 'MX',
  'mexico': 'MX',
  'za': 'ZA',
  'south africa': 'ZA',
  'kr': 'KR',
  'south korea': 'KR',
  'tw': 'TW',
  'taiwan': 'TW',
  'hk': 'HK',
  'hong kong': 'HK',
};

export function country(config: Record<string, unknown>, commonWords: Set<string>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'country') });
  rebulk.defaults({ name: 'country' });

  function findCountries(str: string, context?: Record<string, unknown>) {
    const allowedCountries = context?.['allowed_countries'] as string[] | undefined;
    return new CountryFinder(allowedCountries, commonWords).find(str);
  }

  rebulk.functional(findCountries, {
    conflictSolver: (match, other) =>
      other.name !== 'language' || !['US', 'GB'].includes(String(match.value)) ? match : other,
    properties: { country: [null] },
    disabled: (context) => !context?.['allowed_countries'],
  });

  return rebulk;
}

class CountryFinder {
  allowedCountries: Set<string>;
  commonWords: Set<string>;

  constructor(allowedCountries: string[] | undefined, commonWords: Set<string>) {
    this.allowedCountries = new Set(
      allowedCountries?.map((c) => c.toLowerCase()) || []
    );
    this.commonWords = commonWords;
  }

  find(str: string) {
    const results: Array<[number, number, { value: string }]> = [];

    for (const wordMatch of iterWords(str.trim().toLowerCase())) {
      const word = wordMatch.value;
      if (this.commonWords.has(word.toLowerCase())) {
        continue;
      }

      const countryCode = COUNTRY_MAP[word.toLowerCase()];
      if (countryCode) {
        if (
          this.allowedCountries.has(countryCode.toLowerCase()) ||
          this.allowedCountries.has(word.toLowerCase())
        ) {
          results.push([
            wordMatch.span[0],
            wordMatch.span[1],
            { value: countryCode },
          ]);
        }
      }
    }

    return results;
  }
}
