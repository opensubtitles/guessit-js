# Changelog

All notable changes to guessit-js are documented here.

## [4.7.1]

Housekeeping sweep:

- dist is now minified with sourcemaps (ESM 460K→336K, CJS 460K→232K,
  83 KB gzipped) — debuggability kept via `.map` files
- Dependabot enabled (npm weekly, grouped devDependencies; GitHub Actions)
- CONTRIBUTING.md (fixtures-first workflow) and SECURITY.md (private
  vulnerability reporting, ReDoS/pollution scope) added
- coverage badge — statement coverage is 97%

## [4.7.0]

Developer-experience layer on top of the drop-in CLI:

- **`--serve [port]`** — instant zero-dependency REST API:
  `GET /api/guessit?filename=…`, `POST` with `{filename}` or batch
  `{filenames: [...], options: {...}}`, `/api/health`, CORS enabled;
  CLI parsing flags become server defaults (`guessit-js --serve -t episode`)
- **`--benchmark [N]`** — throughput report (per-parse ms, parses/s)
- **`--completion bash|zsh`** — shell completion scripts
- **CLI test suite** (`test/cli.test.ts`, 14 tests): output formats, config
  loading, exit codes, extras — suite is now 1371 tests
- `server.ts` health endpoint reports the real package version (was
  hardcoded 3.9.0) and `npm start` docs added to README

## [4.6.0]

CLI is now a **drop-in replacement** for the Python `guessit` command,
byte-identical output verified against the real Python CLI in CI:

- installs a `guessit` bin alias next to `guessit-js`
- default output: `For: <file>` + `GuessIt found: {…}` (4-space JSON, Python
  separators); `-j` = one compact JSON per file with Python's `", "`/`": "`
  separators; `-y` = pyyaml block style (`? file` / `: key: value`, lists at
  key level, single-quoted scalars)
- babelfish-compatible values: JSON uses language/country display names
  ("English", "UNITED STATES"), YAML uses codes ("en", "pt-BR", "US")
- user config auto-loaded from `~/.guessit/options.*` and
  `~/.config/guessit/options.*` (json/yaml/yml); `--no-user-config` /
  `--no-default-config`; `-c` accepts JSON or flat YAML
- **breaking**: `-v` is now `--verbose` (Python semantics; per-match debug
  lines) — version banner moved to `--version` like Python
- `-a` advanced output omits `raw` for synthesized matches (valid JSON,
  Python shape)
- CI: drop-in parity job diffs our output against `pip install guessit`
  across formats

## [4.5.4]

Full-featured CLI, mirroring the Python `guessit` command:

- inputs: multiple filenames, `@list.txt`, `-f/--input-file` (`-` = stdin),
  piped stdin (one filename per line)
- outputs: property lines (default), `-j` JSON, `--jsonl` (one object per
  line), `-y` YAML, `-P/--show-property`, `-i/--output-input-string`
- parsing options: `-t` type, `-n` name-only, `-Y`/`-D` date order, `-L`/`-C`
  allowed languages/countries, `-E` episode-prefer-number, `-T`/`-G` expected
  title/group, `--includes`/`--excludes`, `-s` single-value, `-c` JSON config
- `-a/--advanced` now emits the Python shape (`{value, raw, start, end}`)
  instead of raw engine internals
- introspection: `-p` property list, `-V` properties with values
- standard behavior: `--` end-of-options, exit codes 0/1/2, value validation
- CI: dedicated CLI smoke-test job

## [4.5.3]

Packaging audit + CLI:

- **truly zero runtime dependencies**: rebulk-js was listed in `dependencies`
  but has always been bundled into dist — moved to devDependencies, so
  `npm install guessit-js` now installs nothing else
- `exports` map: `types` condition first (fixes type resolution under
  `moduleResolution: "bundler"` / `"node16"`), `./package.json` export added
- `sideEffects: false` (tree-shaking) and `engines.node >= 18` declared
- **new CLI**: `npx guessit-js <filename>` (`-j` JSON, `-t` type, `-v`, `-h`)
- **new `version` export** — `import { version } from 'guessit-js'`
- CI: typecheck + full unit suite in the matrix (was fixtures only),
  separate coverage job
- docs: README CLI/version sections, WASM corpus count 1026→1035,
  upstream-issues.md stamped as historical snapshot

## [4.5.2]

Engine upgrade: rebulk-js bumped to ^3.4.0, which fixes two bugs we filed
during the parity work (opensubtitles/rebulk-js#1, #2):

- duplicate rule classes are now allowed and every instance executes;
  class dependencies resolve to all instances (previously the second
  instance was silently dropped or `toposortRules` threw)
- `Matches.matches` getter added, so Python-spelled rule code
  (`matches.matches`) is no longer a silent no-op

No behavior change in guessit-js — our `RemoveLessSpecificSeason` /
`RemoveLessSpecificEpisode` subclass workaround stays (harmless and
explicit). Full suite green: 1357 tests, WASM bit-identical on all
1035 corpus fixtures.

Related discovery, reported upstream as guessit-io/guessit#961: Python
rebulk's `Rules` container silently dedupes by class too, so upstream
guessit's `RemoveLessSpecificSeasonEpisode("season")` pass has never
executed.

## [4.5.1]

Closing cross-parser sprint: **112 of the 276 cases Python guessit fails** now
pass (was 104), plus CI housekeeping.

- OVA is a title word before the episode anchor ("AIKa ZERO OVA - 01")
- percent numbers are never episodes ("Magical☆Star Kanon 100%")
- short Titlecase language codes inside anime titles stay title text
  ("Bokura Ga Ita", "Ro-Kyu-Bu! SS")
- fullwidth CJK brackets 【】「」（） are group markers — "【MMZYSUB】★【Golden Time】[24…]"
  → release group MMZYSUB, title Golden Time, episode 24
- event numbers: "UFC.247.PPV" → title UFC 247; a leading non-padded 2-digit
  before a multi-word title with no other signals is a movie title
  ("22 Jump Street") — zero-padded "01 - Ep Name" stays an episode
- CI: actions/checkout and setup-node bumped to v5 (Node 20 deprecation)

## [4.5.0]

Fifth cross-parser sprint — the anime/fansub tail and movie-title integrity:
**104 of the 276 cases Python guessit fails** now pass (was 93). Minor version
for the "Episode N before year" title semantics.

- "Star Wars Episode 1 La Menace fantome 1999" → one movie title (an episode
  word before the year with title text continuing is part of the name); a real
  "Show.Episode.5" without a year stays an episode
- SxxExx version suffixes ("S01E06v2") and part letters on all weak chains
  ("111C", "09a")
- "Mary Bell - 02 [h-b]": a scene group claimed as "NN [name]" splits into
  episode + group
- "Hidamari Sketch x365" — a bonus marker glued into an anime title before the
  anchor is title text
- lone leading years are titles ("2012.AC3.720p" → title 2012; "2012.2009" →
  title 2012, year 2009)
- volume variants: "Vol. 1v2 & Vol. 2" → volume [1, 2], titles no longer carry
  the Vol token

## [4.4.2]

Fourth cross-parser sprint — season/episode notations: **93 of the 276 cases
Python guessit fails** now pass (was 80, the best sprint yet).

- "Sn4 Ep14" season marker; "S01E22c"/"S10E01b" multi-part episode letters
- colon season ranges: "Complete Seasons 1: 11" → [1..11]
- comma lists with ampersand: "Season 1, 2, 3, 4, 5, & 6" → [1..6]
- decimal notations: "Episode 1.22" → s1e22, " - 6.01 - " → s6e01,
  "[5.134]" → s5e134 — audio "5.1"/"2.0" and resolutions guarded
- glued NxNN: "Castle1x01" and "3x11m720p" parse; 1280x720 stays a resolution

## [4.4.1]

Third cross-parser sprint — title integrity: **80 of the 276 cases Python
guessit fails** now pass (was 74).

- word-numeral parts before the anchor are title text: "Dune.Part.Two.2024" →
  title "Dune Part Two" (digit "Part 2" stays the property)
- year-titled shows: "1923 S02E01" → title "1923" (guarded to strong
  season/episode anchors so date strings keep their year)
- a dash-glued S<n> after an audio/codec token is a group name, not a season:
  "DD5.1-S56", "[E-AC3-S78]" — Apollo 13 parses as the movie again
- "DolbyD" → Dolby Digital
- "3D-in-title" (Saw 3D vs Pacific Rim 3D) evaluated and rejected as lexically
  unresolvable — documented, not changed

## [4.4.0]

Second cross-parser sprint: **74 of the 276 cases Python guessit fails** now pass
(was 62). Minor version because alternative_title semantics change for anime
releases.

- **Anime compound titles stay whole** — under an anime signal (leading bracket
  group or CRC32), wordy dash segments are one title: "Tower of Druaga - Sword of
  Uruk", "Garo - Vanishing Line", "Neon Genesis Evangelion - Platinum", "Macross
  Frontier - Sayonara no Tsubasa". Short coded segments still split ("Baccano! -
  T1", "Infinite Stratos - IS"). Six fixtures updated to the compound reading as
  a deliberate divergence from Python.
- fully-bracketed names take the title from the bracket's unmatched hole even
  when the bracket carries properties ("[Mobile Suit Gundam Seed Destiny HD
  REMASTER][07]…")
- codecs enlarged over a bracket edge are separator-bounded ("ponyo[h264.dts]"
  → H.264; Python loses it)
- a glued-ordinal marker collision resurfaces the trailing number as the
  absolute episode ("Hayate no Gotoku 2nd Season 24" → season 2, episode 24)
- trailing-number anime episodes also trigger on heavily bracketed names (≥3
  groups) without CRC/release-group signals

## [4.3.2]

Cross-parser corpus sprint: guessit-js now passes **62 of the 276 cases Python
guessit admits failing** against anitomy/PTT/PTN/go-ptn/thcolin (was 54).

- a dash-joined title starting with a bare number stays whole: "2047 - Sights of
  Death" is one title, not title 2047 + alternative
- "MD" is a title word before the season/episode/year anchor ("House MD Season 7"
  → title House MD) and the Mic Dubbed tag after it
- a title's trailing season word is cropped before a season match ("Skins Season
  S01-S07" → title Skins)
- sources: DvdR9/DvdR5 → DVD; HQCAM and S-Print/SPrint (Indian cam conventions)
  → Camera
- `scripts/cross-parser-check.mts` measures progress against the corpus

## [4.3.1]

- **#744 fully fixed** — "Ted.Lasso.S03E03.4-5-1" keeps the formation whole:
  episode 3, episode_title "4-5-1" (Python still reads episodes [3,4,5])
- ordering validation was silently disabled in the SxxExx chains (a Python-named
  `to_dict` call that always returned undefined) — now active, guarding
  decreasing chain continuations
- docs/upstream-issues.md refreshed: #690, #693, #696, #741, #797 rows marked
  fixed by the v4.1–v4.3 work (verified against the current build)

## [4.3.0]

Fixes upstream guessit's two remaining open parsing issues — **#875** (spurious
season/episode numbers) and most of **#877** (anime/fansub parsing) — which
Python 4.4.0 still fails. 22 of the 23 reproducible cases from those issues now
parse correctly (suite: 1289 green); the one exception (ED2 → episode) is
deliberate, matching upstream's own shipped credit-sequence behavior.

### #875 — spurious season/episode numbers
- title digits are not episodes: "Mob Psycho 100 - 09" → episode 9 (anchored-weak
  scoring: zero-padded/dash-delimited numbers beat title digits and parenthesized
  absolutes: "52 (227)" → 52, "29 (04)" → 4, "002 (100)" → 2)
- "Season 3 - 11" → season 3 + episode 11 (space-padded dash; glued "Season 1-3",
  plural "Seasons", and Complete-marked packs keep range semantics); bracketed
  "(S4-24)" → season 4 + episode 24 while "S01-S05" still expands
- "[0x539]" hex bracket ids never parse as NxNN

### #877 — anime / fansub parsing
- bare fansub episodes: "[DB]_Bleach_264_[hex]" → title Bleach, episode 264
  (phantom "h_264" codecs glued to a word lose; weak-family conflicts keep both
  readings until WeakConflictSolver picks the anime one)
- special markers: SP01/EX01/OVA → episode; "2nd Season 24" → season 2
- trailing numbers with an anime signal (CRC32 or bracket group) are episodes:
  "Eve no Jikan 2 [hex]" → episode 2, "Angel Beats (9)" → episode 9 — while
  "Deadpool 2" stays a movie title
- fully-bracketed names get titles: "[FuktLogik][Sayonara_Zetsubou_Sensei][01]"
  → title from the second bracket; "[Keroro].148." → the lone bracket is the
  title; junk words before the group bracket are dropped ("EvoBot.[Watakushi]_…")

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
