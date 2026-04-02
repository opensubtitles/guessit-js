/**
 * Numeral helpers — port of guessit/rules/common/numeral.py
 */

const ROMAN_VALUES: [string, number][] = [
  ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
  ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
  ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
];

// Word numerals — English and French
const WORD_NUMERALS: Record<string, number> = {
  // English
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  // French
  'zéro': 0, 'un': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5,
  'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
  'onze': 11, 'douze': 12, 'treize': 13, 'quatorze': 14, 'quinze': 15,
  'seize': 16, 'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19, 'vingt': 20,
};

export function parseRoman(s: string): number | undefined {
  const upper = s.toUpperCase();
  let result = 0;
  let i = 0;
  for (const [sym, val] of ROMAN_VALUES) {
    while (upper.startsWith(sym, i)) {
      result += val;
      i += sym.length;
    }
  }
  return i === upper.length && result > 0 ? result : undefined;
}

export function parseWord(s: string): number | undefined {
  return WORD_NUMERALS[s.toLowerCase()];
}

export function parseNumber(s: string): number | undefined {
  const n = parseInt(s, 10);
  if (!isNaN(n)) return n;
  const roman = parseRoman(s);
  if (roman !== undefined) return roman;
  return parseWord(s);
}

export function numericFunction(value: string): number {
  return parseNumber(value) ?? parseInt(value, 10);
}
