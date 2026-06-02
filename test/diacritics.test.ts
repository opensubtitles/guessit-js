import { describe, it, expect } from 'vitest';
import { foldDiacritics } from '../src/rules/common/formatters.js';

// foldDiacritics must reproduce V8's normalize('NFD') + combining-mark strip for
// every accented letter in every script — WITHOUT calling normalize (QuickJS has
// none). This is what keeps the JS and WASM builds identical on accented titles.
const v8Fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

describe('foldDiacritics — genuine NFD-strip parity (all scripts)', () => {
  it('matches V8 NFD-strip for every diacritic codepoint in the BMP', () => {
    const mismatches: string[] = [];
    for (let cp = 0xc0; cp <= 0xffff; cp++) {
      if (cp >= 0xd800 && cp <= 0xdfff) continue;
      const ch = String.fromCodePoint(cp);
      const nfd = ch.normalize('NFD');
      if (!/[̀-ͯ]/.test(nfd)) continue; // only chars with a real diacritic
      if (foldDiacritics(ch) !== v8Fold(ch)) {
        mismatches.push(`U+${cp.toString(16)} ${ch} → ${foldDiacritics(ch)} (want ${v8Fold(ch)})`);
      }
    }
    expect(mismatches.slice(0, 20)).toEqual([]);
  });

  it('folds real multilingual titles like V8 does', () => {
    const samples = [
      'Bunker Palace Hôtel', 'La Science des Rêves', 'Amélie', 'Coração',
      'Ολυμπιάδα', 'Tiếng Việt', 'Йот', 'Mötley Crüe', 'Naïve', 'São Paulo',
      'Köln', 'Žižek', 'Dvořák', 'Œuvre',
    ];
    for (const s of samples) expect(foldDiacritics(s), s).toBe(v8Fold(s));
  });

  it('strips already-decomposed combining marks (engine-independent path)', () => {
    expect(foldDiacritics('é')).toBe('e');       // e + combining acute
    expect(foldDiacritics('Hôtel')).toBe('Hotel');
  });

  it('leaves un-accented text untouched', () => {
    expect(foldDiacritics('The Dark Knight')).toBe('The Dark Knight');
    expect(foldDiacritics('') ).toBe('');
  });
});
