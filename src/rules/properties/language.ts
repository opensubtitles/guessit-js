/**
 * Language and subtitle_language properties — port of guessit/rules/properties/language.py
 */
import { Rebulk, Rule, RemoveMatch, RenameMatch, POST_PROCESS } from 'rebulk-js';
import { Language, UNDETERMINED, MULTIPLE, NON_SPECIFIC_LANGUAGES, isNonSpecific } from '../../language/index.js';
import { buildOrPattern } from '../../reutils.js';
import { sepsSurround } from '../common/validators.js';
import { isDisabled } from '../common/pattern.js';
import { iterWords } from '../common/words.js';
import { seps } from '../common/index.js';
import type { Match } from 'rebulk-js';

interface LanguageConfig {
  subtitle_affixes: string[];
  subtitle_prefixes: string[];
  subtitle_suffixes: string[];
  language_affixes: string[];
  language_prefixes: string[];
  language_suffixes: string[];
  weak_affixes: string[];
  synonyms: Record<string, string[]>;
}

/**
 * LanguageWord - Extension for compound words like "pt-BR", "soft subtitles"
 */
class LanguageWord {
  start: number;
  end: number;
  value: string;
  inputString: string;
  nextWord?: LanguageWord;

  constructor(
    start: number,
    end: number,
    value: string,
    inputString: string,
    nextWord?: LanguageWord,
  ) {
    this.start = start;
    this.end = end;
    this.value = value;
    this.inputString = inputString;
    this.nextWord = nextWord;
  }

  /**
   * Get extended word by combining with next word if separators match
   */
  get extendedWord(): LanguageWord | undefined {
    if (!this.nextWord) return undefined;

    const separator = this.inputString.slice(this.end, this.nextWord.start);
    const nextSeparator = this.inputString.slice(
      this.nextWord.end,
      this.nextWord.end + 1,
    );

    if (
      (separator === '-' && separator !== nextSeparator) ||
      separator === ' ' ||
      separator === '.'
    ) {
      const value = this.inputString
        .slice(this.start, this.nextWord.end)
        .replace(/\./g, ' ');
      return new LanguageWord(
        this.start,
        this.nextWord.end,
        value,
        this.inputString,
        this.nextWord.nextWord,
      );
    }

    return undefined;
  }
}

interface LanguageMatch {
  propertyName: 'language' | 'subtitle_language';
  word: LanguageWord;
  lang: Language;
}

/**
 * LanguageFinder - Helper to search for language matches
 */
class LanguageFinder {
  allowedLanguages: Set<string>;
  weakAffixes: Set<string>;
  commonWords: Set<string>;
  prefixesMap: Map<string, string[]>;
  suffixesMap: Map<string, string[]>;

  constructor(
    context: any,
    subtitlePrefixes: string[],
    subtitleSuffixes: string[],
    langPrefixes: string[],
    langSuffixes: string[],
    weakAffixes: string[],
    commonWords?: Set<string>,
  ) {
    const allowedLanguagesArray = context?.allowed_languages || [];
    this.allowedLanguages = new Set(
      allowedLanguagesArray.map((l: string) => l.toLowerCase()),
    );
    this.weakAffixes = new Set(weakAffixes);
    this.commonWords = commonWords ?? new Set();
    this.prefixesMap = new Map();
    this.suffixesMap = new Map();

    if (!isDisabled(context, 'subtitle_language')) {
      this.prefixesMap.set('subtitle_language', subtitlePrefixes);
      this.suffixesMap.set('subtitle_language', subtitleSuffixes);
    }

    this.prefixesMap.set('language', langPrefixes);
    this.suffixesMap.set('language', langSuffixes);
  }

  /**
   * Find all language matches in the string
   */
  *find(inputString: string): Generator<[number, number, Record<string, any>]> {
    const regularLangMap = new Map<string, Set<LanguageMatch>>();
    const undeterminedMap = new Map<string, Set<LanguageMatch>>();
    const multiMap = new Map<string, Set<LanguageMatch>>();

    for (const match of this.iterLanguageMatches(inputString)) {
      const key = match.propertyName;

      if (match.lang.equals(UNDETERMINED)) {
        if (!undeterminedMap.has(key)) undeterminedMap.set(key, new Set());
        undeterminedMap.get(key)!.add(match);
      } else if (match.lang.equals(MULTIPLE)) {
        if (!multiMap.has(key)) multiMap.set(key, new Set());
        multiMap.get(key)!.add(match);
      } else {
        if (!regularLangMap.has(key)) regularLangMap.set(key, new Set());
        regularLangMap.get(key)!.add(match);
      }
    }

    // Dedup yielded matches by (name, span, language). Python stores
    // LanguageMatch in a set keyed by value equality, so two identical matches
    // (same word, same language) collapse to one; the JS Set above keys by
    // object identity, so without this an exact-duplicate match would be emitted
    // twice (e.g. "German.Sub" -> subtitle_language ["deu","deu"]).
    const emitted = new Set<string>();
    const emit = (m: LanguageMatch): [number, number, Record<string, any>] | undefined => {
      const key = `${m.propertyName}:${m.word.start}-${m.word.end}:${m.lang.alpha3}`;
      if (emitted.has(key)) return undefined;
      emitted.add(key);
      return this.toRebulkMatch(m);
    };

    // Yield multi matches if there are regular or no undetermined
    for (const [key, values] of multiMap) {
      if (regularLangMap.has(key) || !undeterminedMap.has(key)) {
        for (const value of values) {
          const r = emit(value);
          if (r) yield r;
        }
      }
    }

    // Yield undetermined if there are no regular
    for (const [key, values] of undeterminedMap) {
      if (!regularLangMap.has(key)) {
        for (const value of values) {
          const r = emit(value);
          if (r) yield r;
        }
      }
    }

    // Yield regular
    for (const values of regularLangMap.values()) {
      for (const value of values) {
        const r = emit(value);
        if (r) yield r;
      }
    }
  }

  /**
   * Convert LanguageMatch to rebulk match tuple
   */
  private toRebulkMatch(
    match: LanguageMatch,
  ): [number, number, Record<string, any>] {
    const word = match.word;
    const start = word.start;
    const end = word.end;
    const name = match.propertyName;

    if (match.lang.equals(UNDETERMINED)) {
      return [
        start,
        end,
        {
          name,
          value: word.value.toLowerCase(),
          formatter: (s: string) => new Language('und'),
          tags: ['weak-language'],
        },
      ];
    }

    const tags: string[] = [];
    if (this.commonWords.has(word.value.toLowerCase())) {
      tags.push('common');
    }

    return [
      start,
      end,
      {
        name,
        value: match.lang,
        ...(tags.length > 0 ? { tags } : {}),
      },
    ];
  }

  /**
   * Iterate over language matches in the string
   */
  private *iterLanguageMatches(
    inputString: string,
  ): Generator<LanguageMatch> {
    const candidates: LanguageWord[] = [];
    let previous: LanguageWord | null = null;

    for (const word of iterWords(inputString)) {
      const languageWord = new LanguageWord(
        word.span[0],
        word.span[1],
        word.value,
        inputString,
      );

      if (previous) {
        previous.nextWord = languageWord;
        candidates.push(previous);
      }

      previous = languageWord;
    }

    if (previous) {
      candidates.push(previous);
    }

    for (const candidate of candidates) {
      yield* this.iterMatchesForCandidate(candidate);
    }
  }

  /**
   * Iterate over matches for a candidate word
   */
  private *iterMatchesForCandidate(
    languageWord: LanguageWord,
  ): Generator<LanguageMatch> {
    // Check prefixes with next word
    if (languageWord.nextWord) {
      const match = this.findMatchForWord(
        languageWord.nextWord,
        languageWord,
        this.prefixesMap,
        (w, p) => w.startsWith(p),
        (w, p) => w.slice(p.length),
      );
      if (match) yield match;
    }

    // Check suffixes with language word
    const match = this.findMatchForWord(
      languageWord,
      languageWord.nextWord ?? undefined,
      this.suffixesMap,
      (w, s) => w.endsWith(s),
      (w, s) => w.slice(0, -s.length),
    );
    if (match) yield match;

    // Try direct language match
    const directMatch = this.findLanguageMatchForWord(languageWord);
    if (directMatch) yield directMatch;
  }

  /**
   * Find match for word with affixes
   */
  private findMatchForWord(
    word: LanguageWord | undefined,
    fallbackWord: LanguageWord | undefined,
    affixes: Map<string, string[]>,
    isAffix: (w: string, a: string) => boolean,
    stripAffix: (w: string, a: string) => string,
  ): LanguageMatch | undefined {
    if (!word) return undefined;

    for (const currentWord of [word.extendedWord, word]) {
      if (!currentWord) continue;

      const wordLang = currentWord.value.toLowerCase();

      for (const [key, parts] of affixes) {
        for (const part of parts) {
          if (!isAffix(wordLang, part)) continue;

          let match: LanguageMatch | undefined = undefined;
          const value = stripAffix(wordLang, part);

          if (!value) {
            if (
              fallbackWord &&
              (Math.abs(fallbackWord.start - currentWord.end) <= 1 ||
                Math.abs(currentWord.start - fallbackWord.end) <= 1)
            ) {
              match = this.findLanguageMatchForWord(fallbackWord, key as any);
            }

            if (!match && !this.weakAffixes.has(part)) {
              match = this.createLanguageMatch(
                key as any,
                new LanguageWord(
                  currentWord.start,
                  currentWord.end,
                  'und',
                  currentWord.inputString,
                ),
              );
            }
          } else {
            // When the affix is stripped from an extendedWord, narrow the match position
            // to only cover the remaining (non-affix) portion. This prevents creating
            // wide matches that conflict with direct matches at the non-affix position.
            // For example, "Dubbed.DL" with suffix "dubbed" → value "dl" should create
            // a match at DL's position, not at the full "Dubbed.DL" span.
            let matchStart = currentWord.start;
            let matchEnd = currentWord.end;
            if (currentWord !== word) {
              // This is an extendedWord match — narrow to the sub-word that
              // actually holds the stripped (non-affix) value. The value can be
              // the leading word ("German.Sub", suffix "sub" -> value "german"
              // lives in "German") or the trailing word ("Dubbed.DL", value "dl"
              // lives in "DL"). Narrowing blindly to fallbackWord put the value on
              // the affix word (e.g. "Sub" -> deu).
              const trimmedValue = value.trim();
              if (trimmedValue && word && word.value.toLowerCase() === trimmedValue) {
                // Value lives in the leading word ("German.Sub" -> "german").
                matchStart = word.start;
                matchEnd = word.end;
              } else if (trimmedValue && word && word.nextWord && word.nextWord.value.toLowerCase() === trimmedValue) {
                // Value lives in the word after the affix ("Subtitulado.Esp",
                // prefix "subtitulado" -> value "esp" lives in "Esp"). Without
                // this it narrowed to fallbackWord (the word *before* the affix,
                // e.g. "HDTV" -> spa).
                matchStart = word.nextWord.start;
                matchEnd = word.nextWord.end;
              } else if (trimmedValue && fallbackWord) {
                // Default: value lives in the trailing word ("Dubbed.DL" -> "dl"),
                // or a compound the affix applies to ("Sub.Fr-Eng").
                matchStart = fallbackWord.start;
                matchEnd = fallbackWord.end;
              }
            }
            match = this.createLanguageMatch(
              key as any,
              new LanguageWord(
                matchStart,
                matchEnd,
                value,
                currentWord.inputString,
              ),
            );
          }

          if (match) return match;
        }
      }
    }

    return undefined;
  }

  /**
   * Find language match for word
   */
  private findLanguageMatchForWord(
    word: LanguageWord | undefined,
    key: 'language' | 'subtitle_language' = 'language',
  ): LanguageMatch | undefined {
    if (!word) return undefined;

    for (const currentWord of [word.extendedWord, word]) {
      if (currentWord) {
        const match = this.createLanguageMatch(key, currentWord);
        if (match) return match;
      }
    }

    return undefined;
  }

  /**
   * Create a LanguageMatch for a word
   */
  private createLanguageMatch(
    key: 'language' | 'subtitle_language',
    word: LanguageWord,
  ): LanguageMatch | undefined {
    const lang = this.parseLanguage(word.value.toLowerCase());

    if (lang) {
      return {
        propertyName: key,
        word,
        lang,
      };
    }

    return undefined;
  }

  /**
   * Parse a language word into a Language object
   */
  private parseLanguage(langWord: string): Language | undefined {
    const lang = Language.fromString(langWord);

    if (!lang) return undefined;

    if (this.allowedLanguages.size === 0) {
      return lang;
    }

    const name = lang.getName().toLowerCase();
    const alpha2 = lang.getAlpha2();
    const alpha3 = lang.alpha3.toLowerCase();

    if (
      this.allowedLanguages.has(name) ||
      (alpha2 && this.allowedLanguages.has(alpha2.toLowerCase())) ||
      this.allowedLanguages.has(alpha3)
    ) {
      return lang;
    }

    return undefined;
  }
}

/**
 * Rules for language detection
 */
class SubtitlePrefixLanguageRule extends Rule {
  consequence = RemoveMatch;
  properties = { subtitle_language: [null] };

  enabled(context: any): boolean {
    return !isDisabled(context, 'subtitle_language');
  }

  when(matches: any, context: any): any {
    const toRename: Array<[any, any]> = [];
    const toRemove: any[] = matches.named('subtitle_language.prefix') || [];

    for (const lang of matches.named('language') || []) {
      let prefix = matches.previous(
        lang,
        (m: any) => m.name === 'subtitle_language.prefix',
        0,
      );

      if (!prefix) {
        const groupMarker = matches.markers?.at(lang, (m: any) => m.name === 'group', 0);
        if (groupMarker) {
          prefix = matches.previous(
            groupMarker,
            (m: any) => m.name === 'subtitle_language.prefix',
            0,
          );
          if (!prefix) {
            prefix = matches.range?.(
              groupMarker.start,
              lang.start,
              (m: any) => m.name === 'subtitle_language.prefix',
              0,
            );
          }
        }
      }

      if (!prefix) {
        // If another language in the same group is already being renamed to
        // subtitle_language (in toRename), this language should also be renamed.
        // This handles cases like St{Fr-Eng} or {Sub.Fr-Eng} where the prefix
        // applies to the first language but subsequent languages in the same
        // group should also become subtitle_language.
        const groupMarker = matches.markers?.atMatch?.(lang, (m: any) => m.name === 'group', 0);
        if (groupMarker) {
          const siblingRename = toRename.find(([_pfx, renamedLang]: [any, any]) =>
            renamedLang.start >= groupMarker.start && renamedLang.end <= groupMarker.end
          );
          if (siblingRename) {
            prefix = siblingRename[0];
          }
        }
      }

      if (prefix) {
        toRename.push([prefix, lang]);
        const conflicting = matches.conflicting?.(lang) || [];
        toRemove.push(...conflicting);
        if (toRemove.includes(prefix)) {
          toRemove.splice(toRemove.indexOf(prefix), 1);
        }
      }
    }

    if (toRename.length > 0 || toRemove.length > 0) {
      return { toRename, toRemove };
    }

    return false;
  }

  then(matches: any, whenResponse: any, context: any): void {
    const { toRename, toRemove } = whenResponse;

    for (const m of toRemove) {
      matches.remove(m);
    }

    for (const [prefix, match] of toRename) {
      const suffix = { ...prefix, name: 'subtitle_language.suffix' };
      if (matches.includes?.(suffix)) {
        matches.remove(suffix);
      }
      matches.remove(match);
      match.name = 'subtitle_language';
      matches.append(match);
    }
  }
}

class SubtitleSuffixLanguageRule extends Rule {
  dependency = SubtitlePrefixLanguageRule;
  consequence = RemoveMatch;
  properties = { subtitle_language: [null] };

  enabled(context: any): boolean {
    return !isDisabled(context, 'subtitle_language');
  }

  when(matches: any, context: any): any {
    const toAppend: any[] = [];
    const toRemove: any[] = matches.named('subtitle_language.suffix') || [];

    for (const lang of matches.named('language') || []) {
      const suffix = matches.next(
        lang,
        (m: any) => m.name === 'subtitle_language.suffix',
        0,
      );

      if (suffix) {
        // Don't treat a suffix as belonging to this language if there is another
        // language/subtitle_language match right after the suffix (e.g. "ENG.sub.FR" →
        // "sub" is a prefix for FR, not a suffix for ENG).
        const nextLang = matches.next(
          suffix,
          (m: any) => m.name === 'language' || m.name === 'subtitle_language',
          0,
        );
        if (nextLang) {
          continue;
        }
        // Also check if a subtitle_language match overlaps/contains the suffix position.
        // This happens when the LanguageFinder detects "sub.FR" as a single subtitle_language
        // match spanning the prefix+language (e.g. [32,38) for "sub.FR"). In that case,
        // matches.next() won't find it because the match starts before suffix.end.
        const overlapping = matches.range?.(
          suffix.start,
          suffix.end + 10,
          (m: any) => (m.name === 'language' || m.name === 'subtitle_language') && m.start >= suffix.start && m.end > suffix.end,
          0,
        );
        if (overlapping) {
          continue;
        }
        toAppend.push(lang);
        if (toRemove.includes(suffix)) {
          toRemove.splice(toRemove.indexOf(suffix), 1);
        }
      }
    }

    if (toAppend.length > 0 || toRemove.length > 0) {
      return { toAppend, toRemove };
    }

    return false;
  }

  then(matches: any, whenResponse: any, context: any): void {
    const { toAppend, toRemove } = whenResponse;

    for (const m of toRemove) {
      matches.remove(m);
    }

    for (const match of toAppend) {
      matches.remove(match);
      match.name = 'subtitle_language';
      matches.append(match);
    }
  }
}

class SubtitleExtensionRule extends Rule {
  dependency = SubtitleSuffixLanguageRule;
  static SUBTITLE_EXTENSIONS = new Set(['srt', 'sub', 'smi', 'ssa', 'ass', 'vtt', 'idx', 'sup']);

  when(matches: any, context: any): any {
    const containers = matches.named('container') || [];
    const containerArr: any[] = Array.isArray(containers) ? containers : containers ? [containers] : [];
    const subtitleContainer = containerArr.find((c: any) =>
      SubtitleExtensionRule.SUBTITLE_EXTENSIONS.has(String(c.value).toLowerCase()),
    );
    if (!subtitleContainer) return false;

    // Find the filepart containing the subtitle extension
    const fileparts = matches.markers?.named('path') || [];
    const filepartArr: any[] = Array.isArray(fileparts) ? fileparts : fileparts ? [fileparts] : [];
    const subtitleFilepart = filepartArr.find((fp: any) =>
      subtitleContainer.start >= fp.start && subtitleContainer.end <= fp.end
    );

    const languages = matches.named('language') || [];
    const langArr: any[] = Array.isArray(languages) ? languages : languages ? [languages] : [];

    // Only convert languages that are in the same filepart as the subtitle extension.
    // In name_only mode (single filepart), all languages in the filepart are converted.
    let toConvert: any[];
    if (subtitleFilepart) {
      toConvert = langArr.filter((l: any) =>
        l.start >= subtitleFilepart.start && l.end <= subtitleFilepart.end
      );
    } else {
      toConvert = langArr;
    }

    return toConvert.length > 0 ? toConvert : false;
  }

  then(matches: any, whenResponse: any, _context: any): void {
    if (!whenResponse || !Array.isArray(whenResponse)) return;
    for (const match of whenResponse) {
      matches.remove(match);
      match.name = 'subtitle_language';
      matches.append(match);
    }
  }
}

class RemoveCommonWordsLanguageRule extends Rule {
  consequence = RemoveMatch;
  static override priority = 32;
  override priority = 32;

  when(matches: any, _context: any): any {
    // Faithful port of Python's RemoveInvalidLanguages: remove every
    // language/subtitle_language match whose raw text is a blacklisted common
    // word (e.g. "De", "no", "it") — UNLESS it sits in a group marker that
    // contains nothing but language matches (e.g. "[Multiple Subtitles]"), in
    // which case it is a real tag. The finder tags such matches 'common', which
    // is equivalent to `raw.toLowerCase() in common_words`.
    const toRemove: any[] = [];
    const all = matches.range?.(0, matches.inputString?.length ?? 0, (m: any) =>
      m.name === 'language' || m.name === 'subtitle_language') || [];
    const allArr: any[] = Array.isArray(all) ? all : all ? [all] : [];

    for (const match of allArr) {
      if (!match.tags?.includes('common')) continue;

      const group = matches.markers?.atMatch?.(match, (m: any) => m.name === 'group', 0);
      if (group) {
        const nonLang = matches.range?.(group.start, group.end,
          (m: any) => m.name !== 'language' && m.name !== 'subtitle_language');
        const hasNonLang = Array.isArray(nonLang) ? nonLang.length > 0 : !!nonLang;
        const holesRes = matches.holes?.(group.start, group.end,
          { predicate: (m: any) => m.value && [...String(m.value)].some((c: string) => !seps.includes(c)) });
        const hasContentHoles = Array.isArray(holesRes) ? holesRes.length > 0 : !!holesRes;
        if (!hasNonLang && !hasContentHoles) continue; // group is all-languages → keep
      }

      toRemove.push(match);
    }
    return toRemove.length > 0 ? toRemove : false;
  }
}

class RemoveLanguageRule extends Rule {
  consequence = RemoveMatch;

  enabled(context: any): boolean {
    return isDisabled(context, 'language');
  }

  when(matches: any, context: any): any {
    return matches.named('language') || false;
  }
}

class RemoveUndeterminedLanguagesRule extends Rule {
  consequence = RemoveMatch;
  static override priority = 32;
  override priority = 32;

  when(matches: any, context: any): any {
    const toRemove: any[] = [];

    for (const match of matches.range?.(0, matches.inputString?.length) || []) {
      if (!['language', 'subtitle_language'].includes(match.name)) continue;

      if (match.value === 'und' || (match.value instanceof Language && match.value.alpha3 === 'und')) {
        const previous = matches.previous?.(match, undefined, 0);
        const next = matches.next?.(match, undefined, 0);
        const langNames = new Set(['language', 'subtitle_language']);

        if (
          (previous && langNames.has(previous.name)) ||
          (next && langNames.has(next.name))
        ) {
          toRemove.push(match);
        }
      }
    }

    return toRemove.length > 0 ? toRemove : false;
  }
}

/**
 * Remove exact-duplicate language / subtitle_language matches — same span AND
 * same language. The subtitle rename rules can append a copy of a match that the
 * finder already produced (e.g. "German.Sub" -> two subtitle_language matches at
 * the same span). Python never reports the same language twice. Only same-span +
 * same-value copies are removed; distinct positions and genuine multi-language
 * releases are untouched. Runs after the subtitle rename rules.
 */
class DedupLanguageRule extends Rule {
  consequence = RemoveMatch;
  dependency = [SubtitlePrefixLanguageRule, SubtitleSuffixLanguageRule, SubtitleExtensionRule];

  private identity(match: any): string {
    const v = match.value;
    if (v instanceof Language) {
      const country = (v as any).country;
      return `${v.alpha3}:${country ? String(country) : ''}`;
    }
    return String(v);
  }

  when(matches: any): any {
    const toRemove: any[] = [];
    for (const name of ['language', 'subtitle_language']) {
      const list = [...(matches.named(name) || [])].sort((a: any, b: any) => a.start - b.start || a.end - b.end);
      const seen = new Set<string>();
      for (const m of list) {
        const key = `${m.start}-${m.end}:${this.identity(m)}`;
        if (seen.has(key)) toRemove.push(m);
        else seen.add(key);
      }
    }
    return toRemove.length > 0 ? toRemove : false;
  }
}

/**
 * Main language property builder
 */
export function language(config: LanguageConfig, commonWords: Set<string>): Rebulk {
  const subtitleBoth = config.subtitle_affixes;
  const subtitlePrefixes = [
    ...subtitleBoth,
    ...config.subtitle_prefixes,
  ].sort((a, b) => b.length - a.length);
  const subtitleSuffixes = [
    ...subtitleBoth,
    ...config.subtitle_suffixes,
  ].sort((a, b) => b.length - a.length);

  const langBoth = config.language_affixes;
  const langPrefixes = [...langBoth, ...config.language_prefixes].sort(
    (a, b) => b.length - a.length,
  );
  const langSuffixes = [...langBoth, ...config.language_suffixes].sort(
    (a, b) => b.length - a.length,
  );

  const weakAffixes = new Set(config.weak_affixes);

  const rebulk = new Rebulk()
    .stringDefaults({ ignoreCase: true })
    .defaults({
      validator: sepsSurround,
    });

  // Register subtitle language prefixes
  for (const prefix of subtitlePrefixes) {
    rebulk.string(prefix, {
      name: 'subtitle_language.prefix',
      ignoreCase: true,
      private: true,
      validator: sepsSurround,
      tags: ['release-group-prefix'],
      disabled: (context: any) => isDisabled(context, 'subtitle_language'),
    });
  }

  // Register subtitle language suffixes
  for (const suffix of subtitleSuffixes) {
    rebulk.string(suffix, {
      name: 'subtitle_language.suffix',
      ignoreCase: true,
      private: true,
      validator: sepsSurround,
      disabled: (context: any) => isDisabled(context, 'subtitle_language'),
    });
  }

  // Register language suffixes
  for (const suffix of langSuffixes) {
    rebulk.string(suffix, {
      name: 'language.suffix',
      ignoreCase: true,
      private: true,
      validator: sepsSurround,
      tags: ['source-suffix'],
      disabled: (context: any) => isDisabled(context, 'language'),
    });
  }

  // Functional pattern for finding languages
  rebulk.functional(
    (input: string, context: any) => {
      const finder = new LanguageFinder(
        context,
        subtitlePrefixes,
        subtitleSuffixes,
        langPrefixes,
        langSuffixes,
        Array.from(weakAffixes),
        commonWords,
      );
      return Array.from(finder.find(input));
    },
    {
      properties: { language: [null] },
      disabled: (context: any) => isDisabled(context, 'language') && isDisabled(context, 'subtitle_language'),
    },
  );

  // Add rules
  rebulk.rules(
    SubtitlePrefixLanguageRule,
    SubtitleSuffixLanguageRule,
    SubtitleExtensionRule,
    RemoveCommonWordsLanguageRule,
    RemoveLanguageRule,
    RemoveUndeterminedLanguagesRule,
    DedupLanguageRule,
    RemoveLanguageInsideTitle,
  );

  return rebulk;
}

/**
 * A short language *abbreviation* (≤3 chars, e.g. "En", "It") whose span falls
 * entirely inside a finalised title / episode_title is part of that title's text,
 * not real metadata — e.g. "…- En Close, Yet En Far.…French.…" matches "En" →
 * English twice inside the episode_title "En Close, Yet En Far". Python keeps only
 * the trailing French. Full language *names* buried in a title (e.g. "Masala …
 * Telugu Movie", "…Spanish…") are left alone — those are genuine languages that
 * Python misses and we keep.
 */
class RemoveLanguageInsideTitle extends Rule {
  static override priority = POST_PROCESS;
  override consequence = RemoveMatch;

  override when(matches: any): Match[] | false {
    const titleNames = new Set(['title', 'episode_title', 'alternative_title']);
    const titles = matches.range(0, (matches.inputString ?? '').length,
      (m: Match) => titleNames.has(m.name ?? '')) as Match[];
    if (!titles.length) return false;
    const out: Match[] = [];
    for (const name of ['language', 'subtitle_language']) {
      for (const lang of (matches.named(name) as Match[])) {
        const rawLen = String(lang.raw ?? '').trim().length;
        if (rawLen > 3) continue;
        if (titles.some((t) => t.start <= lang.start && t.end >= lang.end)) out.push(lang);
      }
    }
    return out.length ? out : false;
  }
}
