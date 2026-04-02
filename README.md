# guessit-js

Extract metadata (title, year, season, episode, codec, language, etc.) from media filenames — TypeScript port of Python [guessit](https://github.com/guessit-io/guessit).

[![npm version](https://img.shields.io/npm/v/guessit-js.svg)](https://www.npmjs.com/package/guessit-js)
[![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL--3.0-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

**[Live Demo](https://opensubtitles.github.io/guessit-js)** · **[API Docs](https://opensubtitles.github.io/guessit-js/docs)** · **[WASM Test](https://opensubtitles.github.io/guessit-js/wasm-test.html)**

## Features

- **99.3% compatibility** with Python guessit (1018/1025 tests passing)
- **3.5x faster** than Python (6.87ms vs 23.86ms per parse)
- **40+ properties** detected: title, year, season, episode, resolution, codec, language, and more
- **Single dependency** ([rebulk-js](https://www.npmjs.com/package/rebulk-js))
- **Dual format**: ESM and CommonJS
- **TypeScript**: full type definitions included
- **WASM**: runs in any WASI-compatible runtime (wasmtime, wasmer, browsers)

## Install

```bash
npm install guessit-js
```

## Usage

```typescript
import { guessit } from 'guessit-js';

const result = guessit('The.Dark.Knight.2008.1080p.BluRay.x264-GROUP.mkv');

console.log(result);
// {
//   title: 'The Dark Knight',
//   year: 2008,
//   screen_size: '1080p',
//   source: 'Blu-ray',
//   video_codec: 'H.264',
//   release_group: 'GROUP',
//   container: 'mkv',
//   type: 'movie'
// }
```

### CommonJS

```javascript
const { guessit } = require('guessit-js');

const result = guessit('Breaking.Bad.S01E02.720p.BluRay.x264-DEMAND.mkv');
console.log(result.title);   // 'Breaking Bad'
console.log(result.season);  // 1
console.log(result.episode); // 2
```

### Options

```typescript
// Force type detection
guessit('file.mkv', { type: 'episode' });

// Provide expected title for ambiguous filenames
guessit('my 720p show S01E02', { expected_title: ['my 720p show'] });

// Restrict language/country detection
guessit('file.mkv', { allowed_languages: ['en', 'fr'], allowed_countries: ['us', 'gb'] });

// Exclude specific properties
guessit('file.mkv', { excludes: ['release_group'] });

// Name-only mode (ignore path separators)
guessit('file.mkv', { name_only: true });
```

## Detected Properties

| Category | Properties |
|----------|-----------|
| **Title** | `title`, `alternative_title`, `episode_title` |
| **Episode** | `season`, `episode`, `episode_details`, `episode_count`, `season_count`, `absolute_episode`, `disc`, `part` |
| **Date** | `year`, `date` |
| **Video** | `screen_size`, `aspect_ratio`, `frame_rate`, `video_codec`, `video_profile`, `color_depth` |
| **Audio** | `audio_codec`, `audio_profile`, `audio_channels`, `audio_bit_rate` |
| **Source** | `source`, `streaming_service` |
| **Release** | `release_group`, `edition`, `other`, `proper_count` |
| **File** | `container`, `mimetype`, `size`, `crc32`, `uuid` |
| **Metadata** | `language`, `subtitle_language`, `country`, `type` |
| **Film** | `film`, `film_title`, `bonus`, `bonus_title` |

## REST API

Self-host the API server:

```bash
npm start  # starts on port 3847
```

```bash
# GET
curl "http://localhost:3847/api/guessit?filename=Movie.2024.1080p.mkv"

# POST with options
curl -X POST http://localhost:3847/api/guessit \
  -H "Content-Type: application/json" \
  -d '{"filename": "file.mkv", "options": {"type": "movie"}}'

# Swagger UI at http://localhost:3847/docs
# OpenAPI spec at http://localhost:3847/openapi.json
```

## WASM

guessit-js compiles to WebAssembly via [Javy](https://github.com/bytecodealliance/javy), which embeds a [QuickJS](https://bellard.org/quickjs/) JavaScript engine inside a WASM module. The guessit code runs as interpreted JS inside QuickJS inside WASM.

```bash
# Build
npm run wasm

# Run (stdin/stdout JSON)
echo '{"filename":"Movie.2024.1080p.mkv"}' | wasmtime wasm/guessit.wasm
```

**3.9 MB** raw · **1.6 MB** gzipped · Compatible with wasmtime, wasmer, WasmEdge, Cloudflare Workers, Fermyon Spin

**When to use WASM:** Non-JS backends (Rust, Go, C++), edge compute, sandboxed environments, CLI tools.

**When to use JS:** Browser, Node.js, Deno, Bun — native JS is ~40x faster than WASM because it avoids the QuickJS interpreter overhead.

## Performance

| Runtime | ms/parse | vs Python |
|---------|----------|-----------|
| **Python 3.8** (guessit 3.8.0) | 23.86 ms | baseline |
| **Node.js 22** (guessit-js) | 6.87 ms | **3.5x faster** |
| **Browser** (IIFE bundle) | ~2-3 ms | **~10x faster** |
| **WASM** (QuickJS) | ~75 ms | for non-JS environments |

## Compatibility

Port of Python guessit v3.8.0. Test suite uses the same YAML fixtures:

- `movies.yml` — 208 test cases
- `episodes.yml` — 523 test cases
- `various.yml` — 126 test cases
- `streaming_services.yaml` — 197 test cases

**1018 / 1025 passing** (99.3%)

## Architecture

4-layer design (~8,400 lines TypeScript across 46 source files):

1. **Public API** (`src/api.ts`) — GuessItApi class, config management
2. **Rebulk Engine** ([rebulk-js](https://www.npmjs.com/package/rebulk-js)) — generic pattern matching engine
3. **Rules & Properties** (`src/rules/`) — 25 property modules with post-processing rules
4. **Configuration** (`src/config/options.json`) — JSON-driven pattern definitions

## Self-hosting

```bash
# Clone and install
git clone https://github.com/opensubtitles/guessit-js
cd guessit-js && npm install

# Run server (port 3847)
npm start

# Run tests
npm test

# Build
npm run build
```

## License

LGPL-3.0 — same as Python guessit.
