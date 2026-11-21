import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { guessit } from '../src/index.js';

const root = resolve(__dirname, '..');
const groups: Record<string, string[]> = JSON.parse(
  readFileSync(resolve(root, 'scripts/showcase-examples.json'), 'utf8'),
);
const html = readFileSync(resolve(root, 'public/index.html'), 'utf8');
const pycmp = JSON.parse(readFileSync(resolve(root, 'public/dist/python-compare.json'), 'utf8'));

// Same notation rules as canon() in public/index.html.
function canon(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v instanceof Date) return JSON.stringify(v.toISOString().slice(0, 10));
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return JSON.stringify(o.alpha3 ?? o.alpha2 ?? o.name ?? o);
  }
  if (typeof v === 'string' && /^\d{4}-\d\d-\d\dT00:00:00(\.000)?Z$/.test(v)) return JSON.stringify(v.slice(0, 10));
  return JSON.stringify(v);
}
function diffKeys(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (k) => k !== 'mimetype' && canon(a[k]) !== canon(b[k]),
  );
}

describe('homepage examples', () => {
  it('lists exactly the names in scripts/showcase-examples.json', () => {
    for (const names of Object.values(groups)) {
      for (const name of names) {
        expect(html, name).toContain(JSON.stringify(name).replace(/<\//g, '<\\/'));
      }
    }
  });

  it('python-compare.json covers every example', () => {
    for (const name of Object.values(groups).flat()) {
      expect(pycmp.results[name], name).toBeDefined();
      expect(pycmp.canonical[name], name).toBeDefined();
    }
  });

  // These hold against the checked-in python-compare.json; the Pages deploy
  // regenerates it from PyPI, and the page itself then shows whatever Python says.
  it.each(groups.same)('same as Python: %s', (name) => {
    expect(diffKeys(guessit(name) as any, pycmp.results[name])).toEqual([]);
  });

  it.each(groups.format)('same answer, different notation: %s', (name) => {
    const js = guessit(name) as any;
    expect(diffKeys(js, pycmp.canonical[name])).toEqual([]);
    expect(diffKeys(js, pycmp.results[name]).length).toBeGreaterThan(0);
  });

  it.each(groups.python_wrong)('Python differs: %s', (name) => {
    expect(diffKeys(guessit(name) as any, pycmp.canonical[name]).length).toBeGreaterThan(0);
  });
});
