# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

guessit-js is a TypeScript port of the Python [guessit](https://github.com/guessit-io/guessit) library. It extracts metadata (title, year, resolution, codec, language, etc.) from media filenames using pattern matching and rule-based post-processing.

## Commands

- **Build**: `npm run build` (runs `tsc --noEmit && vite build`)
- **Type check only**: `npm run typecheck`
- **Run all tests**: `npm run test`
- **Run a single test file**: `npx vitest run test/guessit.test.ts`
- **Run tests matching a pattern**: `npx vitest run -t "pattern"`
- **Watch mode**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

## Architecture

The codebase has four main layers:

### 1. Public API (`src/api.ts`, `src/index.ts`)
`GuessItApi` class manages configuration, builds the pattern matcher on demand, and converts matches to plain objects. A default singleton is exported as convenience functions (`guessit()`, `properties()`, `configure()`, `reset()`).

### 2. Rebulk Engine (`src/rebulk/`)
Port of Python's rebulk library — a generic pattern matching engine. Key concepts:
- **Patterns** (`pattern.ts`): regex, string, and loose matchers that produce `Match` objects
- **Matches** (`match.ts`): container for all matches found in a string, with conflict resolution
- **Rules** (`rules.ts`): post-processing rules that can add/remove/modify matches after initial pattern matching
- **Chain** (`chain.ts`): composes multiple patterns into sequential chains
- **Processors** (`processors.ts`): conflict solving between overlapping matches

### 3. Rules/Properties (`src/rules/`)
Each property type (title, episodes, source, codec, language, etc.) is a separate module in `src/rules/properties/`. Each exports a function that returns a configured `Rebulk` instance with patterns and rules for that property. The `rebulkBuilder()` in `src/rules/index.ts` composes all property modules together.

Common utilities in `src/rules/common/` provide shared formatters, validators, comparators, and parsing helpers (dates, numerals).

### 4. Configuration (`src/config/`)
`options.json` contains JSON-driven pattern definitions, property values, and aliases. The config loader (`src/config/index.ts`) parses these definitions and handles special directives (`import:`, `eval:`, `lambda:`) that translate Python-style config to JS functions.

### Supporting Modules
- **Language** (`src/language/`): language/country code lookup and matching
- **Regex utilities** (`src/reutils.ts`): shared regex helpers

## Test Structure

Tests use Vitest with globals enabled. The main test suite (`test/guessit.test.ts`) is YAML-fixture-driven — it loads `.yml` files from `test/` (e.g., `movies.yml`, `episodes.yml`, `various.yml`) where each entry maps a filename string to expected metadata fields. Tests do subset matching: extra keys in the result are allowed.

The `test/` directory also contains many `debug*.test.ts` files used for testing specific edge cases during development.

## Key Conventions

- ES module output (also generates CJS via Vite). Import paths use `.js` extensions.
- Path alias: `@/*` maps to `src/*` (configured in both tsconfig and vite/vitest configs).
- Property names use snake_case to match the Python guessit API (e.g., `screen_size`, `video_codec`, `release_group`).
- No runtime dependencies — fully self-contained for WASM compatibility.
