# guessit-js

Extract metadata (title, year, season, episode, codec, language, etc.) from media filenames — TypeScript port of Python [guessit](https://github.com/guessit-io/guessit).

[![npm version](https://img.shields.io/npm/v/guessit-js.svg)](https://www.npmjs.com/package/guessit-js)
[![Tests](https://github.com/opensubtitles/guessit-js/actions/workflows/ci.yml/badge.svg)](https://github.com/opensubtitles/guessit-js/actions/workflows/ci.yml)
[![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL--3.0-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)
[![Python guessit compat](https://img.shields.io/badge/guessit_compat-100%25_(1036%2F1036)-brightgreen)](https://github.com/guessit-io/guessit)

**[Live Demo](https://opensubtitles.github.io/guessit-js)** · **[API Docs](https://opensubtitles.github.io/guessit-js/docs)** · **[npm](https://www.npmjs.com/package/guessit-js)**

## Features

- **100% compatibility** with Python guessit (1036/1036 fixtures passing) — and **more correct** in places: ships fixes for 32 upstream guessit bugs that Python still has (see [Differences from Python](#differences-from-python-guessit))
- **3.5x faster** than Python (6.87ms vs 23.86ms per parse)
- **50 properties** detected: title, year, season, episode, resolution, codec, language, and more — with a [machine-readable schema](#output-schema)
- **Single dependency** ([rebulk-js](https://www.npmjs.com/package/rebulk-js))
- **Dual format**: ESM and CommonJS
- **TypeScript**: full, precise type definitions (typed `GuessItResult`, enum'd value fields)
- **WASM**: runs in any WASI-compatible runtime, **bit-identical to the JS build**

## Install

```bash
npm install guessit-js
```

## Usage

```typescript
import { guessit } from 'guessit-js';

const result = guessit('The.Dark.Knight.2008.1080p.BluRay.x264-GROUP.mkv');
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

// Short titles are handled correctly too:
guessit('X2.2003.720p.DSNP.WEB-DL.DDP5.1.H.264-EVO.mkv');
// { title: 'X2', year: 2003, screen_size: '720p',
//   streaming_service: 'Disney+', source: 'Web', ... }
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
guessit('file.mkv', { type: 'episode' });
guessit('my 720p show S01E02', { expected_title: ['my 720p show'] });
guessit('file.mkv', { allowed_languages: ['en', 'fr'] });
guessit('file.mkv', { excludes: ['release_group'] });
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
| **File** | `container` (video / subtitle / archive / image / nfo / torrent / nzb), `mimetype`, `size`, `crc32`, `uuid` |
| **Metadata** | `language`, `subtitle_language`, `country`, `type` |

### Output schema

The result is fully typed — import `GuessItResult` for autocomplete and type-checking:

```ts
import { guessit, properties, GUESSIT_SCHEMA, type GuessItResult } from 'guessit-js';

const r: GuessItResult = guessit('The.Dark.Knight.2008.1080p.BluRay.x264-GRP.mkv');
r.source;  // typed as the closed enum: "Blu-ray" | "Web" | "HDTV" | …

properties();        // { source: ["Blu-ray", "Web", …], type: ["episode","movie"], … } for all 50 properties
GUESSIT_SCHEMA.source.enum;  // the allowed values, programmatically
```

- **`properties()`** — returns every emittable property with its possible values (value-constrained props list their full enum; free/computed props list `[null]`), mirroring Python guessit's `properties()`.
- **`GUESSIT_SCHEMA`** — the machine-readable schema (type, cardinality, enum) for all properties.
- **[`docs/output-schema.json`](docs/output-schema.json)** — a JSON Schema (draft-07) of the output, for validating results or generating clients in other languages.

Regenerate the schema (after parsing changes) with `npm run schema`. A test (`test/schema.test.ts`) guarantees it never goes stale — every value emitted across the corpus must be in the schema.

## REST API

```bash
npm start  # port 3847
curl "http://localhost:3847/api/guessit?filename=Movie.2024.1080p.mkv"
```

## WASM

For non-JS environments (Rust, Go, C++, edge compute). Uses [Javy](https://github.com/bytecodealliance/javy) (QuickJS → WASM).

```bash
npm run wasm
echo '{"filename":"Movie.2024.1080p.mkv"}' | wasmtime wasm/guessit.wasm
```

The WASM build is **bit-identical to the JS build** across the entire test corpus
(1026/1026, including accented titles) — verified by `test/wasm-full.test.ts`.

## Differences from Python guessit

guessit-js is a faithful port (1036/1036 fixtures match Python 3.8.0), but it is
**not bug-for-bug identical** — where Python has a genuine parsing bug, guessit-js
is corrected. Highlights:

- **32 upstream guessit bugs fixed** that Python still gets wrong — e.g. `Us.2019`
  (title vs country `US`), `The.Collector` (title vs edition), `X2.2003…` (short
  title), `grown-ish…[eztv]` (hyphenated title split), `cd`-matching mid-hash, and
  source/codec/extension tokens leaking into `release_group`/`title`. Full ledger:
  [`docs/upstream-issues.md`](docs/upstream-issues.md).
- **More properties / better detection:** `imdb_id`/`tmdb_id`/`tvdb_id`, `volume`,
  archive & image **containers** (`.rar`/`.7z`/`.jpg`…), artwork classification
  (`poster`/`fanart` → `other`), VR / Opening-Ending credits, month-name dates,
  CJK season/episode markers, and detection of Telugu/Spanish that Python misses.
- **Typed, schema-described output:** a precise `GuessItResult` interface, a
  complete `properties()` (Python's is partial), and a JSON Schema.
- **No Python runtime:** zero runtime dependencies, ESM + CJS + WASM, ~3.5x faster.
- **Intentional divergences** (cases where guessit-js is *more* correct than
  Python) are catalogued per-example in [`docs/python-parity.md`](docs/python-parity.md).

## Known issues

- **Music files are not supported** ([#599](https://github.com/guessit-io/guessit/issues/599)):
  `Artist - Album/01 Track.flac` is parsed with the video vocabulary (title /
  alternative_title), not `artist`/`album`/`track`. Out of scope for now.
- **No composite `quality` field** ([#802](https://github.com/guessit-io/guessit/issues/802)):
  `screen_size`, `source` and `video_codec` are returned separately, not combined
  into one string (the request is underspecified).
- **A few ambiguous anime conventions** remain
  ([#690](https://github.com/guessit-io/guessit/issues/690)/[#696](https://github.com/guessit-io/guessit/issues/696)/[#747](https://github.com/guessit-io/guessit/issues/747)):
  e.g. `Re ZERO …- Season 2 - 15`, romaji + `(English title)` — no unambiguous
  correct parse.
- **12 debatable cases** vs Python (neither clearly right) are listed under
  "② NEUTRAL" in [`docs/python-parity.md`](docs/python-parity.md).

## Performance

Warm per-parse, measured on one machine (absolute numbers are hardware-dependent —
the [live demo](https://opensubtitles.github.io/guessit-js) times it in your browser):

| Runtime | ms/parse | Notes |
|---------|----------|-------|
| **Browser (V8)** | ~2–3 ms | fastest; JIT-compiled |
| **Node.js 22 (V8)** | ~4.4 ms | **~3.5× faster than Python** (same machine) — recommended for servers/CLI |
| **Python 3.8** | ~15.5 ms | reference |
| **WASM (QuickJS/Javy)** | ~35 ms warm · ~150 ms cold | for portability, **not** speed (see below) |

**About the WASM build.** It exists so you can run guessit in environments without
a JS engine (Rust, Go, C/C++, edge/WASI runtimes). Javy compiles the bundle to
**QuickJS**, which is an *interpreter* (no JIT), so per-parse compute (~35 ms) is
slower than V8 and even than Python — that's inherent to the engine, not the code.
If you want speed, use the Node/browser build (V8). If you need WASM, the levers
that actually help:

- **Amortize startup** — instantiate the module once and parse many filenames;
  most of the ~150 ms single-shot cost is wasmtime + module init, not parsing.
- **AOT-compile the module** (`wasmtime compile guessit.wasm -o guessit.cwasm`)
  to skip per-run JIT of the wasm itself (~30 ms off cold start).
- The ~35 ms warm floor is QuickJS interpretation; beating it would require a
  JIT-capable WASI JS engine (none production-ready) or a native port — out of
  scope. WASM correctness is **bit-identical** to the JS build.

## License

LGPL-3.0
