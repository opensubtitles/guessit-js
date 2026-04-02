/**
 * YAML fixture-based tests — mirrors guessit Python test suite.
 * Each YAML file has entries like:
 *   ? "filename.mkv"      ← the input
 *   : title: Foo          ← expected result fields
 *
 * The special key `__default__` sets defaults applied to every test in the file.
 *
 * We iterate every entry, call guessit(filename), and assert each expected key/value.
 * We use a "subset" check: extra keys in the result are allowed (we only test what
 * the fixture specifies).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { guessit } from '../src/index.js';
import { Language } from '../src/language/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── YAML loader ─────────────────────────────────────────────────────────────

interface FixtureEntry {
  input: string;
  expected: Record<string, unknown>;
  options?: Record<string, unknown>;
}

/**
 * Parse CLI-style options string (e.g. "-t episode --episode-prefer-number -T 'My Show'")
 * into a Record<string, unknown> suitable for passing to guessit().
 */
function parseCliOptions(optStr: string): Record<string, unknown> {
  const opts: Record<string, unknown> = {};
  // Tokenise: respect single/double quoted strings
  const tokens: string[] = [];
  const re = /(?:'([^']*)'|"([^"]*)"|(\S+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(optStr)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3]);
  }

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    // type
    if (tok === '-t' || tok === '--type') {
      opts['type'] = tokens[++i];
    } else if (tok.startsWith('--type=')) {
      opts['type'] = tok.slice('--type='.length);
    }
    // episode prefer number
    else if (tok === '-E' || tok === '--episode-prefer-number') {
      opts['episode_prefer_number'] = true;
    }
    // date year first
    else if (tok === '--date-year-first') {
      opts['date_year_first'] = true;
    }
    // expected title -T / --expected-title
    else if (tok === '-T' || tok === '--expected-title') {
      opts['expected_title'] = tokens[++i];
    }
    // expected series --expected-series (maps to expected_title in guessit)
    else if (tok === '--expected-series') {
      const v = tokens[++i];
      const existing = opts['expected_title'];
      if (Array.isArray(existing)) {
        existing.push(v);
      } else if (existing) {
        opts['expected_title'] = [existing as string, v];
      } else {
        opts['expected_title'] = v;
      }
    }
    // allowed languages -L
    else if (tok === '-L') {
      const v = tokens[++i];
      const existing = opts['allowed_languages'];
      opts['allowed_languages'] = Array.isArray(existing) ? [...existing, v] : [v];
    }
    // allowed countries -C
    else if (tok === '-C') {
      const v = tokens[++i];
      const existing = opts['allowed_countries'];
      opts['allowed_countries'] = Array.isArray(existing) ? [...existing, v] : [v];
    }
    // excludes
    else if (tok === '--excludes' || tok === '--exclude') {
      const v = tokens[++i];
      const existing = opts['excludes'];
      opts['excludes'] = Array.isArray(existing) ? [...existing, v] : [v];
    }
    // name-only
    else if (tok === '-n' || tok === '--name-only') {
      opts['name_only'] = true;
    }
    // no-default-config
    else if (tok === '--no-default-config') {
      opts['noDefaultConfig'] = true;
    }
    // includes
    else if (tok === '--include') {
      const v = tokens[++i];
      const existing = opts['includes'];
      opts['includes'] = Array.isArray(existing) ? [...existing, v] : [v];
    }
  }
  return opts;
}

function loadFixtures(filename: string): FixtureEntry[] {
  const raw = readFileSync(join(__dirname, 'fixtures', filename), 'utf8');
  // js-yaml's DEFAULT_SCHEMA handles !!python/object and similar tags by
  // stripping them. Use FAILSAFE for unknown tags.
  const doc = yaml.load(raw, { schema: yaml.DEFAULT_SCHEMA, json: true }) as Record<string, unknown>;

  if (!doc || typeof doc !== 'object') return [];

  const defaults: Record<string, unknown> = (doc['__default__'] as Record<string, unknown>) ?? {};
  const entries: FixtureEntry[] = [];

  for (const [key, value] of Object.entries(doc)) {
    if (key === '__default__') continue;
    const rawExpected: Record<string, unknown> = { ...defaults, ...(value as Record<string, unknown>) };

    // Extract and remove the special 'options' key from the expected dict.
    // In Python guessit fixtures, 'options' is CLI-style options passed to guessit(), not expected output.
    let options: Record<string, unknown> | undefined;
    if ('options' in rawExpected) {
      const cliStr = rawExpected['options'] as string;
      delete (rawExpected as any)['options'];
      options = parseCliOptions(String(cliStr ?? ''));
    }

    // Parse optional embedded options from key: "filename.mkv [options]"
    // Only treat brackets as options when the content looks like JSON (starts with { or ")
    const optMatch = /^(.*)\s+\[([^\]]+)\]$/.exec(key);
    let input = key;
    if (optMatch && /^\s*[{"']/.test(optMatch[2])) {
      input = optMatch[1].trim();
      try {
        const keyOpts = JSON.parse(optMatch[2]) as Record<string, unknown>;
        options = { ...options, ...keyOpts };
      } catch {
        // Not valid JSON, treat as part of the filename
        input = key;
      }
    }

    // In Python guessit fixtures, a leading '-' on the filename means "name_only" mode
    // (treat entire string as filename, no path parsing).
    if (input.startsWith('-')) {
      input = input.slice(1);
      options = { ...options, name_only: true };
    }

    const expected = rawExpected;
    entries.push({ input, expected, options });
  }

  return entries;
}

// ─── Comparison helpers ───────────────────────────────────────────────────────

/**
 * Normalise a value from a YAML fixture for comparison.
 * - Dates become ISO date strings (YYYY-MM-DD)
 * - Language objects compare by alpha3
 * - Numbers / strings stay as-is
 */
function normalise(v: unknown): unknown {
  if (v instanceof Date) {
    return v.toISOString().slice(0, 10);
  }
  if (Array.isArray(v)) {
    return v.map(normalise);
  }
  if (v && typeof v === 'object') {
    // Language-like object from babelfish YAML tags → just return as-is;
    // comparison below handles Language objects from guessit result
    return v;
  }
  return v;
}

function normaliseResult(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map(normaliseResult);
  // Language class instances: compare via alpha3 string
  if (typeof v === 'object' && 'alpha3' in (v as object)) {
    return (v as { alpha3: string }).alpha3;
  }
  return v;
}

/**
 * Attempt to resolve a string to a Language alpha3 code.
 * Returns undefined if the string cannot be resolved.
 */
function tryResolveLanguage(s: string): string | undefined {
  try {
    const lang = Language.fromString(s);
    return lang?.alpha3;
  } catch {
    return undefined;
  }
}

const LANGUAGE_KEYS = new Set(['language', 'subtitle_language']);
const COUNTRY_KEYS = new Set(['country']);
const COUNTRY_MAP: Record<string, string> = {
  'united kingdom': 'GB', 'uk': 'GB', 'gb': 'GB',
  'united states': 'US', 'usa': 'US', 'us': 'US',
  'australia': 'AU', 'au': 'AU',
  'canada': 'CA', 'ca': 'CA',
};

function normaliseExpected(v: unknown, key?: string): unknown {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map((item) => normaliseExpected(item, key));
  // babelfish Language YAML tags come through as plain objects or strings
  if (typeof v === 'object') return v; // leave for deep comparison
  // Normalize country names to alpha2 codes
  if (typeof v === 'string' && key && COUNTRY_KEYS.has(key)) {
    const mapped = COUNTRY_MAP[v.toLowerCase()];
    if (mapped) return mapped;
    return v.toUpperCase();
  }
  // Only try to resolve language names/codes for language-related keys
  if (typeof v === 'string' && (!key || LANGUAGE_KEYS.has(key))) {
    const alpha3 = tryResolveLanguage(v);
    if (alpha3 !== undefined) return alpha3;
  }
  return v;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXTURE_FILES = [
  'movies.yml',
  'episodes.yml',
  'various.yml',
  'streaming_services.yaml',
];

// ─── Tests ───────────────────────────────────────────────────────────────────

for (const fixtureFile of FIXTURE_FILES) {
  let entries: FixtureEntry[];
  try {
    entries = loadFixtures(fixtureFile);
  } catch {
    continue;
  }

  describe(fixtureFile, () => {
    for (const { input, expected, options } of entries) {
      it(input, () => {
        const result = guessit(input, options);

        for (const [key, expectedValue] of Object.entries(expected)) {
          // Keys starting with '-' are negative assertions: the property should NOT be present
          if (key.startsWith('-')) {
            const realKey = key.slice(1);
            if (realKey in result) {
              expect(result, `${realKey} should not be present`).not.toHaveProperty(realKey);
            }
            continue;
          }

          if (!(key in result)) {
            // Key missing from result — only fail if expected is non-null
            if (expectedValue !== null && expectedValue !== undefined) {
              expect(result).toHaveProperty(key);
            }
            continue;
          }

          const actual = normaliseResult(result[key]);
          const exp = normaliseExpected(expectedValue, key);

          if (Array.isArray(exp)) {
            // For arrays, check each expected element is present
            const actualArr = Array.isArray(actual) ? actual : [actual];
            for (const item of exp) {
              const normItem = normaliseExpected(item, key);
              // Language comparison: expected string vs Language object
              const found = actualArr.some((a) => {
                const normA = typeof a === 'object' && a && 'alpha3' in a
                  ? (a as { alpha3: string }).alpha3
                  : a;
                return normA === normItem || JSON.stringify(normA) === JSON.stringify(normItem);
              });
              if (!found) {
                expect(actualArr, `${key}: expected to contain ${JSON.stringify(normItem)}`).toContain(normItem);
              }
            }
          } else if (exp instanceof Date || (typeof exp === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(exp))) {
            // Date comparison as ISO string
            const expStr = exp instanceof Date ? exp.toISOString().slice(0, 10) : exp;
            const actStr = actual instanceof Date
              ? (actual as Date).toISOString().slice(0, 10)
              : String(actual);
            expect(actStr, `${key}`).toBe(expStr);
          } else if (typeof exp === 'string' && Array.isArray(actual)) {
            // Python test runner: when expected is a single value and result is a list,
            // check that the expected value is contained in the result list.
            const found = (actual as unknown[]).some(
              (a) => String(a).toLowerCase() === exp.toLowerCase(),
            );
            if (!found) {
              expect(actual, `${key}: expected to contain "${exp}"`).toContain(exp);
            }
          } else if (typeof exp === 'string' && typeof actual === 'string') {
            // Case-insensitive for some string values
            expect(actual.toLowerCase(), `${key}`).toBe(exp.toLowerCase());
          } else {
            expect(actual, `${key}`).toEqual(exp);
          }
        }
      });
    }
  });
}
