# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GuessIt JS is a JavaScript/WebAssembly port of the Python GuessIt library for extracting metadata from video filenames. The project provides both pure JavaScript and high-performance WebAssembly implementations.

## Development Commands

### Building
- `npm run build` - Build production bundle with webpack
- `npm run build:dev` - Build development bundle  
- `npm run build:simple` - Simple build without webpack
- `npm run build:wasm` - Build WebAssembly module (requires Emscripten SDK)

### Testing
- `npm test` - Run comprehensive test suite (test-runner.js)
- `npm run test:simple` - Run basic tests (test-simple.js)
- `npm run test:all` - Alias for npm test

### Development
- `npm run dev` - Start webpack dev server on port 8080
- `npm run lint` - Run ESLint on src/ directory

### Demos and Examples
- `npm run demo` - Run basic demo (examples/demo.js)
- `npm run demo:wasm` - Run WebAssembly demo
- `npm run demo:browser` - Instructions for browser demo
- `npm run start` - Run CLI tool (examples/cli.js)
- `npm run benchmark` - Performance benchmarking

## Code Architecture

### Core Components
- **src/index.js** - Main entry point, exports primary API functions
- **src/api.js** - GuessItApi class with core parsing logic
- **src/options.js** - Configuration and options parsing
- **src/exceptions.js** - Custom exception classes
- **src/rules/** - Rule-based parsing system
  - **rebulk.js** - Pattern matching engine
  - **properties/** - Individual property extractors (codecs, sources, etc.)
  - **markers/** - Path and grouping markers
  - **processors.js** - Post-processing rules

### Key Files
- **src/rules/index.js** - RebulkBuilder for assembling parsing rules
- **src/wasm/** - WebAssembly implementation for performance
- **dist/** - Built distribution files
- **examples/** - Usage examples and CLI tool

### Architecture Patterns
- Uses a rule-based parsing system similar to the original Python GuessIt
- Configurable API with options merging and validation
- Supports both pure JavaScript and WebAssembly execution paths
- Comprehensive property extraction system for video metadata

### Testing
- Custom test runner in test-runner.js with colored output
- Comprehensive test cases covering basic parsing, codecs, sources, screen sizes, episodes
- Tests include complex real-world filename examples
- Separate simple test file for quick validation

### Build System
- Webpack for module bundling with ES module output
- Emscripten for WebAssembly compilation
- ESLint for code quality
- Multiple build targets (development, production, WASM)

### Entry Points
- Main: `dist/guessit.js` (built)
- Module: `src/index.js` (source)
- CLI: `examples/cli.js`
- Type: ES modules (`"type": "module"`)

## Key Implementation Notes

- The project maintains API compatibility with the Python GuessIt library
- Uses a rebulk-based pattern matching system for filename parsing
- Supports extensive configuration options for different parsing scenarios
- WebAssembly implementation provides significant performance improvements
- All parsing rules are organized by property type (video_codec, audio_codec, etc.)