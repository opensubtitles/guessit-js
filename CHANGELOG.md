# Changelog

All notable changes to guessit-js are documented here.

## [4.2.0]

Full parity with Python guessit 4.4.0's test corpus — the 25 fixtures quarantined
in v4.1.0 all pass now (suite: 1266 green, incl. the hard tail). guessit-js also
fixes cases upstream still has open (#929 under --type episode, mid-token weak
numbers).

### Fixed
- **Filepart precedence** — two latent port bugs had disabled
  RemoveLessSpecificSeasonEpisode entirely (unstable in-place sort tie-break;
  rebulk-js rejecting duplicate rule classes). "Adam-12 S01E02" now reads episode
  2 in every mode (#929 — Python still fails it under --type episode), S44E03
  beats a season-only directory (#797), pack dirs (S06E01.E10) and sample files
  defer to the generic most-valuable-filepart logic
- **Anime brackets** — leading [ASW]/[SubsPlus+]/[Coalgirls] groups win over
  trailing parentheticals and streaming names (#696/#757); [Remux] and other
  bracketed property values are never claimed as release groups
- **Weak number chains** — token boundaries stop mid-hash episodes ("My File
  238ddcd5aff" keeps the hash in the title) while version suffixes (312v1) and
  fansub underscores still chain; weak-separator continuations require
  consecutive values ("S03E21.22" → [21,22], "S01E10.24" keeps the show "24")
- **CJK-mixed titles** — a leading original-script run splits off as
  alternative_title ("超能警探.Memorist" → Memorist / 超能警探, #890)
- **Localized forms** — Cyrillic ordinals ("5-го сезон 9 серия"), marker
  collisions ("Studio 60 Сезон 5" → season 5) resolved with full context
- **Air dates** — weekday prefixes absorbed into the date ("Thu.2.Jan.2025", #794)
- **Titles** — --exclude alternative_title keeps dashed names whole; lone-article
  episode_title merge ("Chapter.19.The.Convert"); language-only holes stay
  languages (#751); leading film numbers are titles ("F1.2024", #751); FoV-style
  multi-word leading dash groups kept (#634 refinement)
- **Audio** — audio_channels validated like codec/profile ('mono' inside "Kemono"
  no longer parses); compound Master Audio profile ordering fixed
- **Directory titles** — absolute-numbered anime ("zettai karen children/01 -
  Episode Title") takes the title from the parent directory

## [4.1.0]

Upstream-resync feature release. Python guessit shipped v4.0.0–v4.4.0 (adopting
several guessit-js fixes on the way); this release ports their 4.x feature set
back. Their test corpus grew by 225 entries — guessit-js now passes 200 of them
(suite: 1036 → 1241 fixtures, all green; the open 25 are tracked in
`test/fixtures/upstream-pending.yml`).

### New parsing features
- **Localized season/episode words** — Temporada, Сезон, Sezon, Staffel, évad,
  Bölüm, серия, aflevering, Folge, Episodul, rész and more; number-first forms
  ("1ª Temporada", "5-й сезон", "2.Sezon.7.Bolum") with ordinal suffixes, and
  totals ("Capitulo 5 de 12" → `episode_count`, "Temporada 1 de 5" → `season_count`)
- **CJK markers** — 第3集 / 第二季 / 第十一季 with Han numerals up to 99 (Chinese,
  upstream #779), plus tightened Japanese シーズン/期 guards
- **Complete-series detection** — COMPLETE (MINI)SERIES, INTÉGRALE, L'Intégrale,
  Coffret, "Seasons 1 & 2 - Complete"; a complete run without a year now types as
  episode (upstream #953)
- **Anime credit sequences** — OP/ED/OPED/NCOP/NCED with new `credits_number`
  property ("OP4a" → "4a"), version suffixes (ED2v2), and a separate `Creditless` value
- **VR / stereoscopic layouts** — VR-180/VR-360/EAC360; SBS/LR/TB/OU gated on a
  VR/3D context signal (so SBS the broadcaster survives); Half Side By Side /
  Half Over Under canonical values; DoVi → Dolby Vision
- **Bare resolutions** — "1080.x264" → 1080p when a codec follows (#933),
  "1920×1080" (U+00D7), "1280x720up" upscaled marker (#741); "1080 x265" is no
  longer a fake 1080x265 resolution and "1080.x264" no longer a fake SxxExx
- **Websites** — full IANA TLD list (1285 entries, the same data file Python
  ships): "www.TamilBlasters.vip - Shang-Chi (2021)" → website + title
- **Sources & markers** — Laserdisc/LDRip; Spanish/Portuguese T02E22/T01XE08
- **Title fixes** — title-word reclaim ("Opus.2025" → title Opus, upstream #885),
  leading-word titles ("Uk.Top.Gear.S01E01", "Au bout c'est la mer - 8x01"),
  canonical-cased tags stay properties ("Extended.2019" keeps edition), CAM
  refinement (bare Cam = episode title, Cam + release metadata = CAM source, #732)

### Internals
- `count` groups resolved by ownership (CountValidator port); word-first vs
  number-first collision disambiguation by dangling-number analysis; asymmetric
  SxxExx marker guard; output schema regenerated (50 properties, 16 enums)

## [4.0.2]

Bug-fix release (fixes #2).

- **Hyphenated show names no longer truncate in media-server paths**
  (`The X-Files/Season 9/The.X-Files.S09E19.mkv` → title `The X-Files`, was `The X`;
  worst case `9-1-1/Season 1/…` → `9`). Root cause: `Filepart2EpisodeTitle` /
  `Filepart3EpisodeTitle` took only the first title hole of the show directory, and
  holes split on the dash. Ported Python guessit's `_parent_title_hole` merge
  (upstream guessit#796): consecutive holes joined by a single non-spaced `-` are
  kept whole. Affected every hyphenated show with a `Show/Season N/file`,
  `Show/S01/file`, or nested `TV/Show/Season N/file` layout.
- Added 9 media-server-layout fixtures (the corpus previously had a single
  `Show/Season N/file` entry and none with hyphenated directory names).

## [4.0.1]

Licensing + release-infrastructure release (fixes #1). No parsing changes.

- Restored full LGPL-3.0 `LICENSE` text; copyright + upstream guessit attribution in README
- Added `THIRD_PARTY_NOTICES.md` (Javy Apache-2.0, embedded QuickJS MIT)
- Removed all committed binaries (`tools/javy`, `*.wasm`) from the repo and — via
  `git-filter-repo` — from history (~50 MB → 1.3 MB); re-clone if you have an old checkout
- `wasm/build.sh` downloads a pinned Javy release on demand; CI builds and tests the WASM
- Releases are published from CI via npm trusted publishing (OIDC + provenance);
  `guessit.wasm` / `guessit.wasm.gz` attached to GitHub releases

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
