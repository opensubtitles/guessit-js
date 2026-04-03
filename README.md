# guessit-js

Extract metadata (title, year, season, episode, codec, language, etc.) from media filenames — TypeScript port of Python [guessit](https://github.com/guessit-io/guessit).

[![npm version](https://img.shields.io/npm/v/guessit-js.svg)](https://www.npmjs.com/package/guessit-js)
[![Tests](https://github.com/opensubtitles/guessit-js/actions/workflows/ci.yml/badge.svg)](https://github.com/opensubtitles/guessit-js/actions/workflows/ci.yml)
[![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL--3.0-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)
[![Python guessit compat](https://img.shields.io/badge/guessit_compat-100%25_(1035%2F1035)-brightgreen)](https://github.com/guessit-io/guessit)

**[Live Demo](https://opensubtitles.github.io/guessit-js)** · **[API Docs](https://opensubtitles.github.io/guessit-js/docs)** · **[npm](https://www.npmjs.com/package/guessit-js)**

## Features

- **100% compatibility** with Python guessit (1035/1035 tests passing)
- **3.5x faster** than Python (6.87ms vs 23.86ms per parse)
- **40+ properties** detected: title, year, season, episode, resolution, codec, language, and more
- **Single dependency** ([rebulk-js](https://www.npmjs.com/package/rebulk-js))
- **Dual format**: ESM and CommonJS
- **TypeScript**: full type definitions included
- **WASM**: runs in any WASI-compatible runtime

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
| **File** | `container`, `mimetype`, `size`, `crc32`, `uuid` |
| **Metadata** | `language`, `subtitle_language`, `country`, `type` |

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

## Performance

| Runtime | ms/parse | vs Python |
|---------|----------|-----------|
| **Python 3.8** | 23.86 ms | baseline |
| **Node.js 22** | 6.87 ms | **3.5x faster** |
| **Browser** | ~2-3 ms | **~10x faster** |

## License

LGPL-3.0
