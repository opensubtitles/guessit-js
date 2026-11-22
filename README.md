# guessit-js

Extract metadata (title, year, season, episode, codec, language, etc.) from media filenames — TypeScript port of Python [guessit](https://github.com/guessit-io/guessit).

[![npm version](https://img.shields.io/npm/v/guessit-js.svg)](https://www.npmjs.com/package/guessit-js)
[![Tests](https://github.com/opensubtitles/guessit-js/actions/workflows/ci.yml/badge.svg)](https://github.com/opensubtitles/guessit-js/actions/workflows/ci.yml)
[![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL--3.0-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)
[![Python corpus](https://img.shields.io/badge/python_corpus-2191%2F2229-brightgreen)](https://github.com/guessit-io/guessit)
[![Coverage](https://img.shields.io/badge/coverage-97%25-brightgreen)](https://github.com/opensubtitles/guessit-js/actions/workflows/ci.yml)

**[Live Demo](https://opensubtitles.github.io/guessit-js)** · **[API Docs](https://opensubtitles.github.io/guessit-js/docs)** · **[npm](https://www.npmjs.com/package/guessit-js)**

## Features

- **Runs 2191 of the 2229 cases in Python guessit's own test suite** (upstream 4.5.1, its corpus *and* its per-rule files) — and is **more correct**: fixes for 32 historical upstream bugs, Python's still-open #877, and 114 of the 276 cross-parser cases Python admits failing (see [Differences from Python](#differences-from-python-guessit))
- **Drop-in output**: results use Python guessit's own notation (`"language": "French"`, `"country": "UNITED STATES"`, `"date": "2024-03-15"`) in the library, CLI, REST API and WASM; guessit-js only *parses* better. Richer codes are opt-in with [`output: 'codes'`](#output-notation)
- **AI-agent ready**: an [MCP server](#ai-agents-mcp) (`npx -y guessit-js --mcp`, or the hosted `https://guessit.opensubtitles.com/mcp`) and an [`llms.txt`](https://opensubtitles.github.io/guessit-js/llms.txt)
- **~2x faster** than Python per parse ([measured](#performance))
- **56 properties** detected: title, year, season, episode, resolution, codec, language, ids, and more — with a [machine-readable schema](#output-schema)
- **Batch parsing**: `guessitMany()` in-process, or one POST for up to 100 names
- **Zero runtime dependencies** ([rebulk-js](https://www.npmjs.com/package/rebulk-js) is bundled at build time)
- **Dual format**: ESM and CommonJS
- **TypeScript**: full, precise type definitions (typed `GuessItResult`, enum'd value fields)
- **WASM**: runs in any WASI-compatible runtime, **bit-identical to the JS build**

## Install

```bash
npm install guessit-js
```

## CLI

**Drop-in replacement** for the Python `guessit` command — same flags, same
output formats, byte-compared against the real Python CLI in CI on every push.
The one field excluded from that comparison is `mimetype`: Python reads it from
the operating system's MIME table, so the same `.mkv` is `video/matroska` on a
GitHub runner and `video/x-matroska` on macOS, while this port returns the
conventional `x-` spelling everywhere. Installs both `guessit-js` and `guessit`
binaries:

```bash
npx guessit-js "The.Dark.Knight.2008.1080p.BluRay.x264-GROUP.mkv"
# title: The Dark Knight
# year: 2008
# ...

npx guessit-js -j "Mob Psycho 100 - 09.mkv"        # JSON (-y YAML, --jsonl streaming)
npx guessit-js -P title "Movie.2020.mkv"           # single property
npx guessit-js -t episode "ambiguous.file.mkv"     # force type
npx guessit-js @list.txt                           # filenames from file (also -f list.txt)
find . -name '*.mkv' | npx guessit-js --jsonl      # from stdin, one JSON per line
npx guessit-js -a "Movie.2020.mkv"                 # advanced: value/raw/start/end
npx guessit-js -p                                  # list detectable properties (-V with values)
```

Parsing options match the Python CLI: `-n` name-only, `-Y`/`-D` date order,
`-L`/`-C` allowed languages/countries, `-E` episode-prefer-number,
`-T`/`-G` expected title/group, `--includes`/`--excludes`, `-s` single-value,
`-v` verbose. User config is auto-loaded from `~/.guessit/options.json` and
`~/.config/guessit/options.json` (`.yaml`/`.yml` too; disable with
`--no-user-config`), plus explicit `-c <file>`. See `npx guessit-js --help`.

Extras beyond the Python CLI:

```bash
npx guessit-js --serve 3847            # instant REST API (see below)
npx guessit-js --benchmark 1000 "Movie.2020.1080p.mkv"   # throughput report
eval "$(npx guessit-js --completion bash)"               # shell completion (bash/zsh)
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

### Output notation

Results are a drop-in for Python guessit: the same keys and the same notation
Python's `guessit --json` prints, so code written against Python guessit keeps
working. guessit-js parses many names better (see
[Differences](#differences-from-python-guessit)); it never formats differently
by default.

| Value | default (`output: 'python'`) | `output: 'codes'` |
|---|---|---|
| `language`, `subtitle_language` | `"French"`, `["German", "Multiple languages"]` | `{ alpha3: 'fra' }`, `[{ alpha3: 'deu' }, { alpha3: 'mul' }]` |
| region / script | dropped, as in Python: `"Portuguese"` | kept: `{ alpha3: 'por', country: 'BR' }` |
| `country` | `"UNITED STATES"` | `"US"` |
| `date` | `"2024-03-15"` | `Date` (JSON: `"2024-03-15T00:00:00.000Z"`) |

```typescript
guessit('Movie.2020.PT-BR.1080p.mkv');
// { title: 'Movie', year: 2020, language: 'Portuguese', ... }
guessit('Movie.2020.PT-BR.1080p.mkv', { output: 'codes' });
// { title: 'Movie', year: 2020, language: { alpha3: 'por', country: 'BR' }, ... }
```

The same switch exists everywhere: `?output=codes` or `"options": {"output": "codes"}`
on the REST API, `--output-codes` on the CLI, `{"options": {"output": "codes"}}`
for WASM. The names are generated from babelfish, the library Python guessit uses
(`scripts/python-names.py`). `toPythonNotation()`, `pythonLanguageName()` and
`pythonCountryName()` are exported for converting codes yourself.

### Batch

`guessitMany()` parses a list in one pass. `guessit()` re-parses the options and
re-merges them with the whole config on every call — more work than matching a
short name — so hoisting that out of the loop is the point. Each entry carries
the `input_string` plus either a `result` or the `error` that name produced, so
one unparseable name cannot abort the rest, and entries can be correlated without
relying on array position.

```typescript
import { guessitMany } from 'guessit-js';

guessitMany(['A.2020.1080p.mkv', 'B.S01E02.mkv'], { type: 'episode' });
// [
//   { input_string: 'A.2020.1080p.mkv', result: { title: 'A', year: 2020, ... } },
//   { input_string: 'B.S01E02.mkv',     result: { title: 'B', season: 1, ... } }
// ]
```

In-process there is no cap — pass the whole library. The 100-name cap applies
only to the HTTP surfaces, where it bounds one request's shape.

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
guessit('file.mkv', { output: 'codes' });  // guessit-js codes instead of Python names
```

```typescript
import { version } from 'guessit-js';  // package version string
```

## Detected Properties

All 56, the same set `properties()` advertises:

| Category | Properties |
|----------|-----------|
| **Title** | `title`, `alternative_title`, `episode_title`, `film_title`, `bonus_title` |
| **Episode** | `season`, `episode`, `episode_details`, `episode_count`, `season_count`, `episode_format`, `absolute_episode`, `credits_number`, `disc`, `part`, `version`, `cd`, `cd_count` |
| **Date** | `year`, `date`, `week` |
| **Video** | `screen_size`, `aspect_ratio`, `frame_rate`, `video_codec`, `video_profile`, `video_api`, `video_bit_rate`, `color_depth` |
| **Audio** | `audio_codec`, `audio_profile`, `audio_channels`, `audio_bit_rate` |
| **Source** | `source`, `streaming_service`, `website` |
| **Release** | `release_group`, `edition`, `other`, `proper_count`, `film`, `bonus`, `volume`, `another` |
| **Ids** | `imdb_id`, `tmdb_id`, `tvdb_id`, `uuid`, `crc32` |
| **File** | `container` (video / subtitle / archive / image / nfo / torrent / nzb), `mimetype`, `size` |
| **Metadata** | `language`, `subtitle_language`, `country`, `type` |

### Output schema

The result is fully typed — import `GuessItResult` for autocomplete and type-checking:

```ts
import { guessit, properties, GUESSIT_SCHEMA, type GuessItResult } from 'guessit-js';

const r: GuessItResult = guessit('The.Dark.Knight.2008.1080p.BluRay.x264-GRP.mkv');
r.source;  // typed as the closed enum: "Blu-ray" | "Web" | "HDTV" | …

properties();        // { source: ["Blu-ray", "Web", …], type: ["episode","movie"], … } for all 56 properties
GUESSIT_SCHEMA.source.enum;  // the allowed values, programmatically
```

- **`properties()`** — returns every emittable property with its possible values (value-constrained props list their full enum; free/computed props list `[null]`), mirroring Python guessit's `properties()`.
- **`GUESSIT_SCHEMA`** — the machine-readable schema (type, cardinality, enum) for all properties.
- **[`docs/output-schema.json`](docs/output-schema.json)** — a JSON Schema (draft-07) of the output, for validating results or generating clients in other languages.

Regenerate the schema (after parsing changes) with `npm run schema`. A test (`test/schema.test.ts`) guarantees it never goes stale — every value emitted across the corpus must be in the schema.

## REST API

**Hosted demo (testing only):**

```bash
curl "https://guessit.opensubtitles.com/api/guessit?filename=Movie.2024.1080p.mkv"
curl -X POST https://guessit.opensubtitles.com/api/guessit \
  -H 'Content-Type: application/json' \
  -d '{"filenames": ["A.2020.mkv", "B.S01E02.mkv"]}'
```

> ⚠️ **For testing and evaluation only — never use in production.** It runs on
> a free Cloudflare Workers tier with a hard daily request cap and no uptime
> guarantee; it can be throttled, rate-limited, or removed at any time. For
> production, self-host (`npx guessit-js --serve`, one command) or better,
> call the library in-process (~1.5 ms per parse, no HTTP at all).

Runs on Cloudflare Workers at the edge, CORS enabled, batch up to 100
filenames per POST, redeployed automatically with every release.

**Self-hosted** — no install needed beyond the package itself:

```bash
npx guessit-js --serve                 # port 3847 (or --serve 8080 / PORT env)
curl "http://localhost:3847/api/guessit?filename=Movie.2024.1080p.mkv"
curl -X POST http://localhost:3847/api/guessit \
  -H 'Content-Type: application/json' \
  -d '{"filenames": ["A.2020.mkv", "B.S01E02.mkv"], "options": {"type": "episode"}}'
```

CLI parsing flags become server defaults: `guessit-js --serve -t episode -L en`.
Every surface answers in Python guessit's notation; add `?output=codes` (GET) or
`"options": {"output": "codes"}` (POST) for guessit-js codes
([Output notation](#output-notation)). Any other `output` value is a `400`.
The repo also ships a fuller dev server (`npm start`) with the demo page,
Swagger UI at `/docs`, and static WASM serving.

**Batch contract**, identical on all three HTTP surfaces (hosted worker,
`--serve`, `npm start`):

| | |
|---|---|
| Request | `POST /api/guessit` with `{"filenames": [...], "options": {...}}` |
| Response | one entry per name, in request order, each `{input_string, result}` or `{input_string, error}` |
| Limits | 100 names per request, 1024 characters per name, 1 MiB body |
| Errors | `400` for a malformed body, `413` for any limit exceeded |

A name that fails to parse becomes an `error` entry — the request still answers
`200`. The caps bound the shape of one request, not throughput: for 10k names,
send 100 requests, or skip HTTP and call `guessitMany()` in-process.

## AI agents (MCP)

guessit-js is a [Model Context Protocol](https://modelcontextprotocol.io) server,
so AI agents (Claude, Cursor, VS Code Copilot, any MCP client) can call it as a
tool. Three read-only tools:

| Tool | Input | Output |
|---|---|---|
| `guessit` | `{"filename": "...", "options": {...}}` | the result, same JSON as the library |
| `guessit_batch` | `{"filenames": [...], "options": {...}}` | `{"results": [{input_string, result} \| {input_string, error}]}` |
| `guessit_properties` | `{}` | every property with its possible values |

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_guessit-0098FF?logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=guessit&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22guessit-js%22%2C%22--mcp%22%5D%7D)
[![Install in Cursor](https://img.shields.io/badge/Cursor-Install_guessit-000000?logo=cursor&logoColor=white)](https://cursor.com/en/install-mcp?name=guessit&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImd1ZXNzaXQtanMiLCItLW1jcCJdfQ==)
[![Claude Desktop extension](https://img.shields.io/badge/Claude_Desktop-guessit--js.mcpb-D97757?logo=claude&logoColor=white)](https://github.com/opensubtitles/guessit-js/releases/latest/download/guessit-js.mcpb)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.opensubtitles%2Fguessit--js-555)](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.opensubtitles/guessit-js)

**Claude Desktop**: download [`guessit-js.mcpb`](https://github.com/opensubtitles/guessit-js/releases/latest/download/guessit-js.mcpb)
from the latest release and open it (Settings → Extensions). Runs locally, offline.

**Local (stdio)**, no server to run:

```bash
claude mcp add guessit -- npx -y guessit-js --mcp      # Claude Code
```

```json
{ "mcpServers": { "guessit": { "command": "npx", "args": ["-y", "guessit-js", "--mcp"] } } }
```

(Claude Desktop `claude_desktop_config.json`, Cursor `.cursor/mcp.json`, VS Code
`.vscode/mcp.json` with `"servers"` instead of `"mcpServers"`.)

Docker: `docker run -i --rm ghcr.io/opensubtitles/guessit-js node bin/cli.mjs --mcp`

**Remote (Streamable HTTP)**, nothing to install: `https://guessit.opensubtitles.com/mcp`
(demo tier, same limits as the hosted API), or `POST /mcp` on a self-hosted
`npm start` server.

```bash
claude mcp add --transport http guessit https://guessit.opensubtitles.com/mcp
```

Protocol: dual-era. Stateless MCP `2026-07-28` (`server/discover`, per-request
`_meta`, no handshake) and the `initialize` handshake of `2025-11-25` back to
`2024-11-05`, on both stdio and HTTP. Every tool has an `outputSchema` and
returns `structuredContent`. Listed in the [official MCP Registry](https://registry.modelcontextprotocol.io)
as `io.github.opensubtitles/guessit-js`.

For language models reading about the project: [`llms.txt`](https://opensubtitles.github.io/guessit-js/llms.txt)
(also at `/llms.txt` on the hosted API) and the [OpenAPI spec](https://opensubtitles.github.io/guessit-js/openapi.json).

## WASM

For non-JS environments (Rust, Go, C++, edge compute). Uses [Javy](https://github.com/bytecodealliance/javy) (QuickJS → WASM).

```bash
npm run wasm
echo '{"filename":"Movie.2024.1080p.mkv"}' | wasmtime wasm/guessit.wasm
echo '{"filename":"Movie.PT-BR.mkv","options":{"output":"codes"}}' | wasmtime wasm/guessit.wasm
```

The WASM build is **bit-identical to the JS build** across the entire test corpus
(1035/1035, including accented titles) — verified by `test/wasm-full.test.ts`
(skipped locally until you've built the module and installed wasmtime).

Prebuilt binaries ship with every [GitHub release](https://github.com/opensubtitles/guessit-js/releases)
and as the npm package [`@opensubtitles/guessit-wasm`](packages/guessit-wasm)
(`guessit.wasm` + a small `node:wasi` helper). Binaries are never committed to git.
`wasm/build.sh` downloads Javy pinned by version **and** sha256.

### Versioning

One version number for everything built from a release tag: the `guessit-js`
npm package, `@opensubtitles/guessit-wasm`, the WASM binaries on the GitHub
release, the Docker image (`ghcr.io/opensubtitles/guessit-js:<version>`) and the
hosted API (`/api/health` reports it).

## Differences from Python guessit

guessit-js is a faithful port (tracking Python 4.5.4, plus the unreleased
castellano fix [#1007](https://github.com/guessit-io/guessit/pull/1007)), but it
is **not bug-for-bug identical** — where Python has a genuine parsing bug,
guessit-js is corrected. Run against a live Python guessit 4.5.1 over all 2490 corpus inputs,
**2247 (90.2%) come back identical**; every remaining difference is listed, with a
verdict, in [`docs/python-parity.md`](docs/python-parity.md). Highlights:

- **Cases the released Python 4.5.1 still gets wrong** (each verified against the
  real Python CLI; the [demo](https://opensubtitles.github.io/guessit-js) shows
  live side-by-sides): `X2.2003…` (Python: `bonus: 2`, no title), Python's
  [#875](https://github.com/guessit-io/guessit/issues/875) (fixed upstream in
  4.5.1, years after it was fixed here) and still-open
  [#877](https://github.com/guessit-io/guessit/issues/877) (`Season 3 - 11`,
  anchored weak episodes, `0x539` ids), Python's dead
  `RemoveLessSpecificSeasonEpisode("episode")` pass
  ([#961](https://github.com/guessit-io/guessit/issues/961) — diagnosed from this
  port in [#962](https://github.com/guessit-io/guessit/pull/962), fixed upstream
  by rebulk 6.0.2 plus [#982](https://github.com/guessit-io/guessit/pull/982),
  which carries this port's specificity guard), and **114 of the 276
  cross-parser cases Python's own test data admits failing** — fullwidth CJK
  bracket groups, UFC event numbers, anime compound dash titles, fully-bracketed
  titles, and more.
- **32 historical upstream bugs** were fixed here ahead of upstream during the
  4.x catch-up (many since adopted by Python 4.4 — e.g. `Us.2019`,
  `The.Collector`, `grown-ish`, `imdb_id`/`tmdb_id`, `volume`, artwork and
  month-date detection are now correct in both). Full ledger with dispositions:
  [`docs/upstream-issues.md`](docs/upstream-issues.md).
- **Typed, schema-described output:** a precise `GuessItResult` interface with
  enum'd value fields, `properties()` mirroring Python's API, and a JSON Schema
  (draft-07) of the output — none of which Python provides as machine-readable
  artifacts.
- **No Python runtime:** zero runtime dependencies, ESM + CJS + WASM, ~2x faster.
- **Intentional divergences** (cases where guessit-js is *more* correct than
  Python) are catalogued per-example in [`docs/python-parity.md`](docs/python-parity.md).

### Where guessit-js beats Python on real traffic

Measured on ~26,000 distinct filenames from production traffic (IPTV `.strm`
playlists, typed search phrases, IMDb-style names, release names), the classes
below parse correctly in guessit-js and not in Python guessit 4.5.4. Every row is
a test case in [`test/fixtures/better-than-python.yml`](test/fixtures/better-than-python.yml);
[`scripts/check-better-than-python.py`](scripts/check-better-than-python.py) re-runs
them through a real Python guessit and fails when Python has caught up (then the
case moves to the normal fixtures). Regenerate this table with
`scripts/check-better-than-python.py --table`.

| Input | guessit-js | Python guessit 4.5.4 |
|---|---|---|
| `Some Drama Episode #1.16` | title 'Some Drama', season 1, episode 16 | title "Some Drama", episode [1, 16], no season |
| `Top Show Episode #24.3` | title 'Top Show', season 24, episode 3 | title "Top Show", episode 24, episode_title "3" (season read as the episode) |
| `"Quoted Series" Episode #1.2` | title 'Quoted Series', season 1, episode 2 | title '"Quoted Series"', episode 1 (episode number dropped, quotes kept) |
| `"Os 12 Signos" Episode #1.4` | title 'Os 12 Signos', season 1, episode 4 | title '"Os', episode [12, 1] (number inside the quoted title taken as episode) |
| `en ★ some show - s04e06 - an episode.strm` | title 'some show', language 'en', season 4, episode 6, episode_title 'an episode' | language eng, but title "★ some show" (the list-marker symbol leaks into the title) |
| `nl ▎ some movie.strm` | title 'some movie', language 'nl' | language nld, title "▎ some movie" |
| `Some.Movie.2020.Danish.1080p.WEB.H264-GRP` | title 'Some Movie', year 2020, language 'da' | no language (Danish is not in Python's default allowed_languages) |
| `Some Movie (2021) Tamil HD DVD Print 700MB.mkv` | title 'Some Movie', year 2021, language 'ta' | no language |
| `some movie (2016) malayalam hdrip` | title 'some movie', year 2016, language 'ml' | no language |
| `s01e04 - nf - some show (2025) (us) - s01e04 - the few.strm` | title 'some show', season 1, episode 4, episode_title 'the few', year 2025, country 'US', streaming_service 'Netflix' | title "nf", alternative_title "some show", episode_title "the few" |
| `s01e04 - nf - other show (sa) - s01e04.strm` | title 'other show', season 1, episode 4, streaming_service 'Netflix' | title "nf", release_group "sa" (a region code), episode_title = the show |
| `s01e02 - 4k-a+ - third show (2022) (us) - s01e02 - half loop.strm` | title 'third show', episode_title 'half loop', screen_size '2160p', streaming_service 'AppleTV' | title "a" (half of "a+"); "4k" in the provider tag is the resolution |
| `s01e03 - vp - fourth show - s01e03 - a storm.strm` | title 'fourth show', episode_title 'a storm' | title "vp"; an unknown provider tag is dropped |
| `ar-kh - مسلسل - s01e12 - مسلسل - s01e12.strm` | title 'مسلسل', language 'ar', season 1, episode 12 | title "ar-kh", no language; v4.10: language ara with country KH (Cambodia) |
| `ar-bdy - مسلسل آخر - s01e21 - مسلسل آخر - s01e21.strm` | title 'مسلسل آخر', language 'ar', season 1, episode 21 | title "ar-bdy", alternative_title = the show |
| `some show - s05e01 - some show - s05e01.strm` | title 'some show', season 5, episode 1 | episode_title "some show" (a copy of the title); v4.10: alternative_title "some show" |
| `some show - s05e01 - some show - s05e01 - the real episode.strm` | title 'some show', episode_title 'the real episode' | episode_title "some show" (the real episode title is lost) |
| `The.Show.S11E01.NF.WEB.H265-GRP.mkv` | title 'The Show', streaming_service 'Netflix' | no streaming_service, episode_title "NF" |
| `The.Show.S11E01.German.DL.EAC3.AMZN.WEB.H265-GRP.mkv` | streaming_service 'Amazon Prime' | no streaming_service |
| `X2.2003.1080p.BluRay.x264-GRP.mkv` | title 'X2', year 2003 | bonus 2, no title |
| `Some.Show.S02E03.1080p.WEB.AV1-GRP.mkv` | title 'Some Show', video_codec 'AV1', release_group 'GRP' | no video_codec, release_group "AV1-GRP" (Python has no AV1) |
| `1917.1080p.mkv` | title '1917' | year 1917, no title (a lone number is the film's title) |
| `how to rob a bank[cam]` | title 'how to rob a bank', source 'Camera' | release_group "cam" |


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
- **Differences that are nobody's bug** — a bare `2012` read as a title here and a
  year there, Python's 23 allowed languages against this port's 60 — are listed
  with a verdict each in [`docs/python-parity.md`](docs/python-parity.md), and the
  38 upstream cases this port does not satisfy yet are parked in
  `test/fixtures/upstream-rules-pending.yml`.

## Performance

Warm per-parse. The Node and Python numbers below come from one run of the same
400 corpus names through each parser on the same machine (Apple silicon, Node 20,
Python 3.11, guessit 4.5.1), best of three passes after a warm-up — absolute
numbers are hardware-dependent, and the [live
demo](https://opensubtitles.github.io/guessit-js) times it in your browser:

| Runtime | ms/parse | Notes |
|---------|----------|-------|
| **Node.js 20 (V8)** | ~1.7 ms | **~2× faster than Python guessit** on identical input — recommended for servers/CLI |
| **Python guessit 4.5.1** | ~3.5 ms | reference, same 400 names |
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

Copyright (C) 2024-2026 OpenSubtitles

Licensed under the [GNU Lesser General Public License v3.0](LICENSE) (LGPL-3.0),
the same license as the original Python [guessit](https://github.com/guessit-io/guessit)
library this project is ported from.

Build-time and embedded third-party components (Javy, QuickJS) are covered in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
