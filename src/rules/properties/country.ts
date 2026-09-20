import { Rebulk, Rule, RemoveMatch } from 'rebulk-js';
import type { Match, Matches, Context } from 'rebulk-js';
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

  return rebulk.rules(RemoveEncodingTagCountry);
}

/**
 * A bracket holding nothing but "GB" is the subtitle encoding of a Chinese
 * fansub release (GB2312, simplified) — its sibling tags [BIG5] and [CHS]
 * already parse to nothing, and reading this one as Great Britain both invents
 * a country and pushes the neighbouring "(END)" marker into the episode title.
 * A real country marker travels with the title instead ("The Voice UK",
 * "Shameless.US.S01E01"), never alone inside its own bracket.
 */
class RemoveEncodingTagCountry extends Rule {
  override consequence = RemoveMatch;

  /**
   * The tag still has to occupy its span. Dropping it outright opens a hole that
   * the episode-title logic joins with the neighbouring bracket, so
   * "…[24（END）][GB]…" would trade a bogus country for a bogus episode title.
   */
  override then(matches: Matches, whenResponse: Match[] | false, _context: Context): void {
    if (!Array.isArray(whenResponse)) return;
    for (const match of whenResponse) {
      matches.remove(match);
      (match as unknown as { private: boolean }).private = true;
      matches.append(match);
    }
  }

  override when(matches: Matches, _context: Context): Match[] | false {
    const countries = matches.named('country') as Match[] | Match | undefined;
    const out: Match[] = [];
    for (const match of Array.isArray(countries) ? countries : countries ? [countries] : []) {
      if (String(match.value) !== 'GB') continue;
      const group = matches.markers.atMatch(match, (m) => m.name === 'group', 0) as Match | undefined;
      if (!group) continue;
      const inner = (matches.inputString ?? '').slice(group.start + 1, group.end - 1).trim();
      if (/^gbk?$/i.test(inner)) out.push(match);
    }
    return out.length ? out : false;
  }
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
