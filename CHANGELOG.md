# Changelog

All notable changes to guessit-js are documented here.

## [4.0.0]

A correctness + tooling release. guessit-js still matches Python guessit 3.8.0 on
all 1036 fixtures, but it now **fixes 32 upstream guessit bugs that Python still
has**, ships a machine-readable output schema, and the WASM build is bit-identical
to the JS build (including accented titles). Major version because output for some
previously-buggy inputs changes.

### Correctness — now more correct than Python

- **Python↔JS parity gap closed** (`docs/python-parity.md`): every genuine
  JS-worse-than-Python case is fixed (FIX 0). The remaining differences are cases
  where guessit-js is *more* correct than Python (35) or genuinely debatable (12).
- **32 upstream guessit issues fixed** (`docs/upstream-issues.md`), including:
  - `Us.2019` → title `Us` (not country `US`); `The.Collector` → title (not edition)
  - `X2.2003…` → short title `X2`
  - `grown-ish.s03e01…[eztv]` → title `grown-ish` (no hyphen split) — #634/#640
  - `cd` no longer matches mid-hash (`238ddcd5aff` → no `cd:5`) — #742
  - source/codec/extension tokens no longer leak into `release_group`/`title`
  - archive (`.rar`/`.7z`/split `.rNN`) and image (`.jpg`/`.png`…) **containers**
    recognised; artwork files classified via `other` (poster/fanart/…) — #272/#273
  - new properties / detection: `imdb_id`/`tmdb_id`/`tvdb_id`, `volume`, VR,
    Opening/Ending credits, month-name dates, CJK season/episode markers, and
    Telugu/Spanish that Python misses.

### Output schema (new)

- Precise typed result: `import { type GuessItResult } from 'guessit-js'` — value
  fields are typed as their closed enums.
- `properties()` now returns **all 50 properties with their possible values**
  (Python's is partial); `GUESSIT_SCHEMA` exposes the machine-readable schema.
- `docs/output-schema.json` — JSON Schema (draft-07) of the output, validated
  against both the corpus and the code (`npm run schema`).

### WASM

- **Bit-identical to the JS build** across the whole corpus (1026/1026), including
  accented titles. The previous accent limitation (QuickJS lacks
  `String.prototype.normalize`) is gone: diacritic folding now uses a complete,
  engine-independent table generated from V8's NFD for every script (Latin, Greek,
  Cyrillic, Vietnamese, …) — `npm run diacritics`.

### Tooling / housekeeping

- `npm run schema`, `npm run diacritics`, `npm run build:pages` for reproducible
  regeneration of the schema, diacritic table, and GitHub Pages artifacts.
- Removed scratch/debug tests; `dist/` is no longer committed (built on publish via
  `prepublishOnly`); README adds "Differences from Python" and "Known issues".

## [3.9.0]

- 100% Python guessit compatibility (1035/1035 fixtures), WASM build, REST API.
