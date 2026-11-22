/**
 * guessit() caches the merged options per option set and skips rebuilding the
 * rules when nothing changed (upstream guessit#1008). These pin that the cache
 * never returns an answer for the wrong options.
 */
import { describe, it, expect } from 'vitest';
import { GuessItApi } from '../src/index.js';

const AMBIGUOUS = 'Show.Name.2020.mkv';

describe('merged-options cache', () => {
  it('alternating option sets each get their own result', () => {
    const api = new GuessItApi();
    for (let i = 0; i < 6; i++) {
      expect(api.guessit(AMBIGUOUS, { type: 'episode' }).type).toBe('episode');
      expect(api.guessit(AMBIGUOUS, { type: 'movie' }).type).toBe('movie');
      expect(api.guessit(AMBIGUOUS).type).toBe('movie');
      expect(api.guessit('Amelie.2001.FRENCH.mkv', { output: 'codes' }).language).toEqual({ alpha3: 'fra' });
      expect(api.guessit('Amelie.2001.FRENCH.mkv').language).toBe('French');
    }
  });

  it('key order does not matter, values do', () => {
    const api = new GuessItApi();
    const a = api.guessit('Movie.2020.mkv', { type: 'episode', name_only: true });
    const b = api.guessit('Movie.2020.mkv', { name_only: true, type: 'episode' });
    expect(b).toEqual(a);
    expect(api.guessit('my 720p show S01E02', { expected_title: ['my 720p show'] }).title).toBe('my 720p show');
    expect(api.guessit('my 720p show S01E02').title).not.toBe('my 720p show');
  });

  it('an advancedConfig override rebuilds the rules; unchanged options reuse them', () => {
    const api = new GuessItApi();
    const rules = () => (api as unknown as { _rebulk: unknown })._rebulk;
    const name = 'Movie.2020.1080p.BluRay.x264-GRP.mkv';
    const normal = api.guessit(name);
    const base = rules();
    api.guessit(name, { type: 'movie' });
    expect(rules()).toBe(base); // plain options never rebuild
    const override = { advancedConfig: { release_group: { forbidden_names: ['zzzz'] } } };
    api.guessit(name, override);
    const overridden = rules();
    expect(overridden).not.toBe(base);
    api.guessit(name, override);
    expect(rules()).toBe(overridden); // same override, same rules
    expect(api.guessit(name)).toEqual(normal);
    expect(rules()).not.toBe(overridden); // back to the default rules
  });

  it('options that are not plain JSON still work (no caching)', () => {
    const api = new GuessItApi();
    const opts = { type: 'episode' as const, extra: new Date(0) };
    expect(api.guessit(AMBIGUOUS, opts).type).toBe('episode');
    expect(api.guessit(AMBIGUOUS, opts).type).toBe('episode');
  });

  it('stays bounded and survives reset() and configure(force)', () => {
    const api = new GuessItApi();
    for (let i = 0; i < 40; i++) api.guessit(AMBIGUOUS, { expected_title: [`Title ${i}`] });
    expect((api as unknown as { _mergedCache: Map<string, unknown> })._mergedCache.size).toBeLessThanOrEqual(16);
    api.reset();
    expect(api.guessit(AMBIGUOUS, { type: 'episode' }).type).toBe('episode');
    api.configure({}, undefined, true);
    expect(api.guessit(AMBIGUOUS).type).toBe('movie');
  });
});
