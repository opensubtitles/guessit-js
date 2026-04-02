/**
 * Config module — port of guessit/config/__init__.py
 * Handles loading patterns from the config JSON into a Rebulk builder.
 */
import type { Rebulk } from 'rebulk-js';
import { sepsBefore, sepsAfter, sepsSurround } from '../rules/common/validators.js';

const REGEX_PREFIX = 're:';
const IMPORT_PREFIX = 'import:';
const EVAL_PREFIX = 'eval:';
const PATTERN_TYPES = ['regex', 'string'] as const;

const DEFAULT_MODULE_NAMES: Record<string, string> = {
  validator: 'validators',
  formatter: 'formatters',
};

// Dynamic import cache for validator/formatter functions
const importCache: Map<string, unknown> = new Map();

/**
 * Registry of named validators and formatters that can be imported by name.
 */
const registry: Map<string, unknown> = new Map();

export function registerFunction(name: string, fn: unknown): void {
  registry.set(name, fn);
}

// Pre-register common validators so `import:seps_after` etc. resolve correctly.
registry.set('seps_after', sepsAfter);
registry.set('seps_before', sepsBefore);
registry.set('seps_surround', sepsSurround);

// ─── Known Python lambda implementations ─────────────────────────────────────
// In Python rebulk, conflict_solver(match, other) returns the match to REMOVE,
// or '__default__' to fall back to the default solver.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConflictSolverFn = (match: any, other: any) => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ValidatorFn = (match: any) => boolean;

const KNOWN_CONFLICT_SOLVERS: Record<string, ConflictSolverFn> = {
  // DTS-HD: remove the other audio_codec in favor of DTS-HD
  "lambda match, other: other if other.name == 'audio_codec' else '__default__'":
    (match, other) => other.name === 'audio_codec' ? other : '__default__',

  // bit_rate: remove bit_rate if other is a strong audio_channels; else remove audio_channels
  "lambda match, other: match if other.name == 'audio_channels' and 'weak-audio_channels' not in other.tags else other":
    (match, other) => {
      if (other.name === 'audio_channels' && !(other.tags ?? []).includes('weak-audio_channels')) {
        return match; // remove bit_rate
      }
      return other; // remove audio_channels
    },

  // bonus: yield to video_codec or strong episode; win against weak episodes
  "lambda match, conflicting: match if conflicting.name in ('video_codec', 'episode') and 'weak-episode' not in conflicting.tags else '__default__'":
    (match, conflicting) => {
      if (
        ['video_codec', 'episode'].includes(conflicting.name) &&
        !(conflicting.tags ?? []).includes('weak-episode')
      ) {
        return match; // remove bonus, keep strong episode/video_codec
      }
      // When conflicting is a weak episode, keep the bonus (remove the episode)
      if (conflicting.name === 'episode' && (conflicting.tags ?? []).includes('weak-episode')) {
        return conflicting; // remove weak episode, keep bonus
      }
      return '__default__';
    },

  // special edition: remove episode_details 'Special' in favor of this match
  "lambda match, other: other if other.name == 'episode_details' and other.value == 'Special' else '__default__'":
    (match, other) => (other.name === 'episode_details' && other.value === 'Special') ? other : '__default__',
};

const KNOWN_VALIDATORS: Record<string, ValidatorFn> = {
  'lambda match: 0 < match.value < 100':
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (match: any) => typeof match.value === 'number' && match.value > 0 && match.value < 100,
};

function processExecutable(value: string, _defaultModule?: string): unknown {
  if (value.startsWith(IMPORT_PREFIX)) {
    const target = value.slice(IMPORT_PREFIX.length);
    if (importCache.has(target)) return importCache.get(target);
    const fn = registry.get(target);
    if (fn !== undefined) {
      importCache.set(target, fn);
      return fn;
    }
    // Return as-is if not found — pattern definitions may reference functions
    // that need to be resolved at runtime
    return undefined;
  }
  if (value.startsWith(EVAL_PREFIX)) {
    // Map common Python eval: formatter expressions to JS functions
    const expr = value.slice(EVAL_PREFIX.length).trim();
    if (expr === 'int') return (s: unknown) => parseInt(String(s), 10);
    if (expr === 'float') return (s: unknown) => parseFloat(String(s));
    if (expr === 'bool') return (s: unknown) => Boolean(s);
    // Unknown eval: expression — return raw string (best effort)
    return expr;
  }
  if (value.startsWith('lambda ') || value.startsWith('lambda:')) {
    // Try to resolve known Python lambdas to native JS implementations
    const knownConflict = KNOWN_CONFLICT_SOLVERS[value];
    if (knownConflict) return knownConflict;
    const knownValidator = KNOWN_VALIDATORS[value];
    if (knownValidator) return knownValidator;
    // Unknown lambda — not executable in JS, return undefined
    return undefined;
  }
  return value;
}

/** Map from Python snake_case option names to TypeScript camelCase counterparts. */
const SNAKE_TO_CAMEL: Record<string, string> = {
  conflict_solver: 'conflictSolver',
  private_parent: 'privateParent',
  private_children: 'privateChildren',
  private_names: 'privateNames',
  ignore_names: 'ignoreNames',
  format_all: 'formatAll',
  validate_all: 'validateAll',
  pre_match_processor: 'preMatchProcessor',
  post_match_processor: 'postMatchProcessor',
  post_processor: 'postProcessor',
  log_level: 'logLevel',
  ignore_case: 'ignoreCase',
};

/** Rename snake_case keys to camelCase in an options object (shallow, in-place). */
function normalizeCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  for (const [snake, camel] of Object.entries(SNAKE_TO_CAMEL)) {
    if (snake in obj && !(camel in obj)) {
      obj[camel] = obj[snake];
      delete obj[snake];
    }
  }
  return obj;
}

function processOption(name: string, value: unknown): unknown {
  if (name === 'validator' || name === 'conflict_solver' || name === 'formatter') {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = processOption(name, v);
      }
      return result;
    }
    if (value !== null && value !== undefined && typeof value === 'string') {
      return processExecutable(value, DEFAULT_MODULE_NAMES[name]);
    }
  }
  return value;
}

function buildEntryDecl(entry: unknown, options: Record<string | symbol, unknown>, value: string): Record<string, unknown> {
  const defaultOpts = (options[Symbol.for('default')] || options['__default__'] || {}) as Record<string, unknown>;
  const entryDecl: Record<string, unknown> = { ...defaultOpts };
  if (!value.startsWith('_')) {
    entryDecl['value'] = value;
  }
  if (typeof entry === 'string') {
    if (entry.startsWith(REGEX_PREFIX)) {
      entryDecl['regex'] = [entry.slice(REGEX_PREFIX.length)];
    } else {
      entryDecl['string'] = [entry];
    }
  } else if (entry && typeof entry === 'object') {
    Object.assign(entryDecl, entry as Record<string, unknown>);
  }
  // Handle legacy 'pattern' key
  if ('pattern' in entryDecl) {
    const legacyPattern = entryDecl['pattern'] as string;
    delete entryDecl['pattern'];
    if (legacyPattern.startsWith(REGEX_PREFIX)) {
      entryDecl['regex'] = [legacyPattern.slice(REGEX_PREFIX.length)];
    } else {
      entryDecl['string'] = [legacyPattern];
    }
  }
  return entryDecl;
}

export function loadPatterns(
  rebulk: Rebulk,
  patternType: 'regex' | 'string',
  patterns: string[],
  options: Record<string | symbol, unknown> = {},
): void {
  const defaultOpts = (options[Symbol.for('default')] || options['__default__'] || {}) as Record<string, unknown>;
  const itemOptions: Record<string, unknown> = { ...defaultOpts };
  const patternTypeOption = options[patternType] as Record<string, unknown> | undefined;
  if (patternTypeOption) Object.assign(itemOptions, patternTypeOption);

  // Process option values (handle import: / eval: / lambda strings)
  const processedOptions: Record<string, unknown> = {};
  for (const [name, val] of Object.entries(itemOptions)) {
    processedOptions[name] = processOption(name, val);
  }

  // Remove undefined processed options (e.g. unresolvable lambda/eval strings)
  for (const key of Object.keys(processedOptions)) {
    if (processedOptions[key] === undefined) {
      delete processedOptions[key];
    }
  }

  // Convert snake_case keys to camelCase for TypeScript pattern/match options
  normalizeCamelCase(processedOptions);

  if (patternType === 'regex') {
    (rebulk as Rebulk).regex(...patterns, processedOptions as Parameters<Rebulk['regex']>[0]);
  } else {
    (rebulk as Rebulk).string(...patterns, processedOptions as Parameters<Rebulk['string']>[0]);
  }
}

/**
 * Load patterns defined in the given config dict into the rebulk builder.
 * Mirrors Python's load_config_patterns().
 */
export function loadConfigPatterns(
  rebulk: Rebulk,
  config: Record<string, unknown> | undefined,
  options: Record<string | symbol, unknown> = {},
): void {
  if (!config) return;

  for (const [value, rawEntries] of Object.entries(config)) {
    const entries: unknown[] = Array.isArray(rawEntries) ? rawEntries : [rawEntries];
    for (const entry of entries) {
      // Process entry
      const entryDecl = buildEntryDecl(entry, options, value);

      for (const patternType of PATTERN_TYPES) {
        let patterns = entryDecl[patternType];
        if (!patterns) continue;
        if (!Array.isArray(patterns)) patterns = [patterns];

        const patternsEntryDecl = { ...entryDecl };
        for (const pt of PATTERN_TYPES) delete patternsEntryDecl[pt];

        const currentPatternOptions: Record<string | symbol, unknown> = { ...options };
        currentPatternOptions[Symbol.for('default')] = patternsEntryDecl;
        currentPatternOptions['__default__'] = patternsEntryDecl;

        loadPatterns(rebulk, patternType as 'regex' | 'string', patterns as string[], currentPatternOptions);
      }
    }
  }
}
