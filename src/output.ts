/**
 * Output notation.
 *
 * guessit-js is a drop-in for Python guessit, so by default a result uses the
 * notation Python guessit's JSON output uses (`guessit --json`, guessit-rest):
 *
 *   language / subtitle_language  babelfish name   "French", ["German", "Multiple languages"]
 *   country                       babelfish name   "UNITED STATES"
 *   date                          ISO date string  "2024-03-15"
 *
 * `output: 'codes'` keeps guessit-js's richer native values instead: languages as
 * `{ alpha3, country?, script? }` objects (so pt-BR keeps its region, which the
 * Python name "Portuguese" drops), countries as ISO 3166 alpha-2 codes, and dates
 * as `Date` objects.
 */
import { PYTHON_COUNTRY_NAMES, PYTHON_LANGUAGE_NAMES } from './language/python-names.js';

export type OutputFormat = 'python' | 'codes';

/** The output formats `guessit()` accepts as `options.output`. */
export const OUTPUT_FORMATS: readonly OutputFormat[] = ['python', 'codes'];

/** Python guessit's name for an ISO 639-3 code ("fra" → "French"); unknown codes pass through. */
export function pythonLanguageName(alpha3: string): string {
  return PYTHON_LANGUAGE_NAMES[alpha3] ?? alpha3;
}

/** Python guessit's name for an ISO 3166 alpha-2 code ("US" → "UNITED STATES"); unknown codes pass through. */
export function pythonCountryName(alpha2: string): string {
  return PYTHON_COUNTRY_NAMES[alpha2.toUpperCase()] ?? alpha2;
}

function convert(key: string, value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(key, v));
  if (value instanceof Date) {
    // Dates are built as UTC midnight; Python prints datetime.date as YYYY-MM-DD.
    return value.toISOString().slice(0, 10);
  }
  if (value && typeof value === 'object' && typeof (value as { alpha3?: unknown }).alpha3 === 'string') {
    return pythonLanguageName((value as { alpha3: string }).alpha3);
  }
  if (key === 'country' && typeof value === 'string') return pythonCountryName(value);
  return value;
}

/**
 * Convert a guessit-js result (codes notation) to Python guessit's notation.
 * Returns a new object; the input is not modified.
 */
export function toPythonNotation<T extends Record<string, unknown>>(result: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(result)) out[key] = convert(key, value);
  return out as T;
}

/** Normalise an `output` option value; throws on anything but 'python' / 'codes'. */
export function parseOutputFormat(value: unknown): OutputFormat {
  if (value === undefined || value === null || value === '') return 'python';
  if (value === 'python' || value === 'codes') return value;
  throw new Error(`invalid output "${String(value)}": must be "python" or "codes"`);
}
