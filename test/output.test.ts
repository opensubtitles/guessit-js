/**
 * Output notation: the default is Python guessit's JSON notation (drop-in);
 * `output: 'codes'` returns guessit-js's native values.
 */
import { describe, it, expect } from 'vitest';
import {
  guessit, guessitMany, toPythonNotation, pythonLanguageName, pythonCountryName,
} from '../src/index.js';

describe('default output = Python guessit notation', () => {
  it('languages are babelfish names', () => {
    expect(guessit('Amelie.2001.FRENCH.1080p.BluRay.x264-GRP.mkv').language).toBe('French');
    expect(guessit('Movie.2020.German.DL.1080p.BluRay.mkv').language)
      .toEqual(['German', 'Multiple languages']);
    expect(guessit('Show.Name.S01E01.720p.HDTV.x264.ENG.SUBS.mkv').subtitle_language).toBe('English');
  });

  it('a region is dropped, as Python does', () => {
    expect(guessit('Movie.2020.PT-BR.1080p.mkv').language).toBe('Portuguese');
  });

  it('countries are babelfish names', () => {
    expect(guessit('The.Office.US.S02E01.mkv').country).toBe('UNITED STATES');
    expect(guessit('Shameless.UK.S01E01.mkv').country).toBe('UNITED KINGDOM');
  });

  it('dates are YYYY-MM-DD strings', () => {
    expect(guessit('The.Daily.Show.2024.03.15.Guest.720p.mkv').date).toBe('2024-03-15');
  });

  it("output: 'python' is the same as the default", () => {
    const name = 'Movie.2020.German.DL.1080p.BluRay.mkv';
    expect(guessit(name, { output: 'python' })).toEqual(guessit(name));
  });

  it('the result is plain JSON (round-trips unchanged)', () => {
    const r = guessit('The.Daily.Show.2024.03.15.Guest.FRENCH.720p.mkv');
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });
});

describe("output: 'codes'", () => {
  it('languages are objects that keep the region', () => {
    expect(guessit('Movie.2020.PT-BR.1080p.mkv', { output: 'codes' }).language)
      .toEqual(expect.objectContaining({ alpha3: 'por', country: 'BR' }));
    expect(JSON.parse(JSON.stringify(guessit('Amelie.2001.FRENCH.mkv', { output: 'codes' }).language)))
      .toEqual({ alpha3: 'fra' });
  });

  it('countries are alpha-2 codes, dates Date objects', () => {
    expect(guessit('The.Office.US.S02E01.mkv', { output: 'codes' }).country).toBe('US');
    const d = guessit('The.Daily.Show.2024.03.15.Guest.720p.mkv', { output: 'codes' }).date;
    expect(d).toBeInstanceOf(Date);
    expect((d as Date).toISOString()).toBe('2024-03-15T00:00:00.000Z');
  });

  it('toPythonNotation converts a codes result to the default output', () => {
    for (const name of ['Movie.2020.PT-BR.1080p.mkv', 'The.Office.US.S02E01.mkv',
      'The.Daily.Show.2024.03.15.Guest.FRENCH.720p.mkv']) {
      expect(toPythonNotation(guessit(name, { output: 'codes' }) as Record<string, unknown>))
        .toEqual(guessit(name));
    }
  });
});

describe('output option', () => {
  it('rejects unknown values', () => {
    expect(() => guessit('Movie.2020.mkv', { output: 'yaml' as never })).toThrow(/invalid output/);
  });

  it('applies to guessitMany too', () => {
    const [a] = guessitMany(['Amelie.2001.FRENCH.mkv']);
    const [b] = guessitMany(['Amelie.2001.FRENCH.mkv'], { output: 'codes' });
    expect('result' in a && a.result.language).toBe('French');
    expect('result' in b && JSON.parse(JSON.stringify(b.result.language))).toEqual({ alpha3: 'fra' });
  });

  it('advanced mode still returns match objects', () => {
    const r = guessit('Amelie.2001.FRENCH.mkv', { advanced: true }) as Record<string, any>;
    expect(r.language).toHaveProperty('value');
  });
});

describe('name tables', () => {
  it('use babelfish names, unknown codes pass through', () => {
    expect(pythonLanguageName('ell')).toBe('Modern Greek (1453-)');
    expect(pythonLanguageName('mul')).toBe('Multiple languages');
    expect(pythonLanguageName('xyz')).toBe('xyz');
    expect(pythonCountryName('us')).toBe('UNITED STATES');
    expect(pythonCountryName('ZZ')).toBe('ZZ');
  });
});
