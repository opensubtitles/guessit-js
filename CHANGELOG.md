# Changelog

All notable changes to guessit-js are documented here.

## [Unreleased]

**A `YYYY-YYYY` span is one year range, bracketed or not** (upstream
guessit-io/guessit#988). Each year was matched on its own and arbitrated by
`KeepMarkedYearInFilepart`, which releases the first year to the title — so
`Movie 1994-2004 1080p` came back as title "Movie 1994" with year 2004, while the
bracketed spelling happened to keep both. A range is now matched as a unit and the
two years are kept or dropped together: `-`, `~`, `–` and `to` all separate it,
both years must be plausible, and the pair must run forward, so `(2013-2005)`
stays two unrelated years. The range is never expanded to the years between — it
is a span of airing dates, and a show on hiatus would collect years it never
aired.

Three things fell out of that work. `EnlargeGroupMatches` grows a match that
fills a bracket group over the brackets, and it adjusted the raw offsets as if
they were relative, which ate a character from any match that already carried
them — the second year of a bracketed `(1994-2004)` parsed as 200.
`RemoveGroupedYearWithSxxExx` measured the group against a single year, so a
group holding nothing but a range looked like text around a year and the year was
dropped. And `intCoercable` used `Number()`, which reads JS numeric literals that
Python's `int()` rejects: `0x539` scored as the integer 1337, so a fansub group id
in brackets was discarded as a number instead of becoming the release group.

**A season-pack directory no longer overrides the file it holds** (upstream
guessit-io/guessit#983). `RemoveAmbiguous` keeps the filepart carrying the most
properties and only then prefers the rightmost, so a single extra token on the
directory — `Complete`, or a stray word read as `episode_title` — replaced the
file's own episode with the pack's whole range:
`Show.S01E01-E10.Complete/Show.S01E05.mkv` returned episodes 1 through 10 instead
of 5. Between equally complete `SxxExx` fileparts the filename now wins. The
exception is a companion file: a sample or proof clip names nothing real, so it
still defers to the single-episode directory holding it, but not to a pack, which
is not a single episode either.

**A plain sidecar extension is a container, not the release group** (upstream
guessit-io/guessit#978). `.strm` — how Kodi, Emby and Jellyfin name every
streamed episode — along with `.vtt`, `.txt` and `.url`, was not a known
extension, so it either replaced the real release group
(`[Erai-raws] … .strm` → `strm`) or stayed glued to a trailing scene group
(`…-NINJA.strm`). All four are containers now; upstream added the first two.

**The anime-only readings are gated on an anime signal** (upstream
guessit-io/guessit#985). "Season N - EE" meaning season N episode EE collides
with the equally common western box set, so `The Wire Season 1 - 5 1080p BluRay`
lost seasons 2 through 5. A compact `S4-24` is the annotation of an absolute
episode number only in round parentheses right after one — a bracketed
`[S01-07]` is a season pack, and `Once Upon a Time [S01-07]` likewise kept only
season 1. Both readings now require their evidence.

Also from that name: a two-letter token after a language code had to be a real
ISO 3166-1 country. Any two letters passed, so the release group `HR-GZ` parsed
as Croatian spoken in the nonexistent country GZ and took the group name with it.

Still divergent from #985 by design, now recorded in `docs/upstream-issues.md`:
an anime compound dash title stays whole (`Fairy Tail - 100 Years Quest` is the
show's name, not a title plus an alternative title), a year does not become a
season, and `Show 12 - 24` reads as title "Show 12" plus episode 24 rather than a
two-episode list.

**Every pass of a twice-registered rule class runs** (rebulk-js 3.5.0). Rule
dedup compared instances by class alone, so a rule class registered twice with
different constructor arguments lost an instance when rebulks were merged — the
defect that silently disabled Python guessit's
`RemoveLessSpecificSeasonEpisode("episode")` pass (upstream
guessit-io/guessit#961, Toilal/rebulk#92). The rebulk-js 3.4.0 note claimed
every instance already executed, but only the toposort half had shipped;
`Rules.extend` still dropped them one step earlier. Equality is parameter-aware
now, so interchangeable instances — notably the default
`ConflictSolver`/`PrivateRemover` that every Rebulk registers, 31 of each here —
still collapse to one. No parsing changed: the season and episode passes were
already separate classes precisely because of this trap, so what this removes is
the requirement for that workaround. The dead placeholder
`RemoveUndeterminedLanguagesRule` in the episode rules (its `when` always
returned false, shadowed by the real one in the language rules) is gone.

Upstream landed the same fix from the other side on 2026-11-10: rebulk 6.0.2
compares instance-registered rules by identity, and guessit#982 integrates it
together with the specificity guard this port contributed in #962 — which it
credits and supersedes. All five of its new equally-complete-filepart cases
already pass here.

**Asterisks in a title stay in the title** (upstream guessit-io/guessit#977,
filed 2026-11-08). Already correct here and now pinned: Python splits on the
first `*` and keeps the others, so `M*A*S*H.S01E01.mkv` gives title `M*A*S H`
while `M*A*S*H.mkv` gives `M A*S*H` — one show, two mangled titles depending on
whether an episode marker follows. This port never treats `*` as a separator, so
both read `M*A*S*H`.

**`guessitMany()` parses a list of names in one options pass.** `guessit()`
re-parses the options and re-merges them with the whole config on every call,
which costs more than matching a short name does; the batch entry point hoists
that out of the loop. Each entry carries the `input_string` plus either a
`result` or the `error` that name produced, so one unparseable name cannot abort
the rest. `POST /api/guessit` takes the same shape via `{"filenames": [...]}`.

Batch is now a documented part of the API rather than an undocumented extra, and
its contract is identical on all three HTTP surfaces (hosted worker, `--serve`,
`npm start`): 100 names per request, 1024 characters per name, 1 MiB body, every
limit answered with 413, one entry per name in request order. The previous cap
was 500; 100 keeps one request inside the free Workers CPU budget and is enough
for the request-shape bound to be the only thing it is — throughput comes from
sending more requests, or from `guessitMany()` in-process, which has no cap. The
OpenAPI spec now carries the batch request shape, the entry schema, the 413
response and a batch example.

**Broadcast/DVR timestamps are dates, not episode numbers** (the sub-case filed
in upstream guessit-io/guessit#875 on 2026-09-11).
`…Requested.Episode.Title_Channel.5_2025_07_18_21_00.mp4` gave `episode: [7, 0]`
and `year: 2025` with no date at all. Two things were wrong. Underscore was
missing from the date separators — Python's list is `[-/ .]`, so a stamp written
with underscores never reached the date parser and its digits fell through to the
episode rules; `Show_2025_07_18` now parses like `Show.2025.07.18` always did.
And the four-digit-year regexps are tried before the two-digit-year ones, because
otherwise the interior window `07_18_21` is claimed as 2021-07-18 before the real
`2025_07_18` gets a turn. The `_HH_MM` clock tail is then absorbed into the date
span, so its digits are not left in a hole to be read as episodes — only behind a
full `YYYY<sep>MM<sep>DD` stamp, and only when every trailing group is a valid
hour, minute and second. The name now reads as season 19 with date 2025-07-18 and
no episode, which is what the report asks for. Under a forced `type=episode` the
lenient rules still take `Channel.5` as episode 5 (upstream #627 treats that
leniency as by design); Python returns `[5, 7, 18, 21, 0]` there.

**A parenthesised localized title no longer costs the real one** (the last open
#877 B2 name). `[Juuni.Kokki]-(Les.12.Royaumes)-[Ep.24]-[x264+OGG].mkv` gave
title "Les 12 Royaumes" with the show name taken for a fansub group. A
parenthesis never holds a group name, so when the only title of a bracketed
episode name sits inside one, the leading bracket is the title and the
parenthetical is the alternative title. An unbracketed title keeps the bracket as
the group, so `[Golumpa] Star Blazers 2202 - 22 (Uchuu Senkan Yamato 2202)` is
unchanged. The earlier "11 of 12 #877 cases" count had missed this name.

Third upstream triage sweep (2026-09-27), last issue checked #968: every open
issue re-read plus every comment since the second sweep. #968 (`Spa Weekend`
read as Spanish), #961 and the #949 comment (a duplicate of #966) already parsed
correctly and now carry guard fixtures.

**A property filling a bracket group glued to the token before it is no longer
thrown away.** `EnlargeGroupMatches` grows a match that fills a whole `(…)` or
`[…]` over the brackets, which moves `start` onto the bracket and leaves
`rawStart` on the content. `sepsBefore`/`sepsAfter` read `start`, so they were
inspecting the character in *front* of the bracket: `Movie abc(BluRay)` looked
glued to "abc" and lost its source, `abc(AAC)` lost its audio codec, and
`Shes the one_2013(camrip)` lost the camera source and handed "camrip" to the
release group. The bracket is itself the delimiter, so an enlarged edge now counts
as separated — fixed in the validators, so every property that uses them benefits
at once. Before `EnlargeGroupMatches` runs the raw and span edges coincide, so
pattern-time validation is unchanged. Python has the same blind spot; that last
name is in upstream's own cross-parser baseline.

An HD camera release writes the marker either way round — `CAMHD` joins `HDCAM`.

Measured against upstream's cross-parser baseline (the 276 names Python guessit
admits failing versus anitomy/ptt/ptn/go-ptn/thcolin): 114 pass, up from 113. Of
the 162 remaining, ~21 are source-taxonomy disagreements where this port is the
more precise one (`UHD BluRay` → Ultra HD Blu-ray, `PDTV` → Digital TV, `HDCAM`
→ HD Camera) and ~12 are multi-track audio where returning every codec is
correct and the other parser returns one.

**The HTTP endpoints now bound their input.** Parsing cost grows with the square
of the number of matches a name yields — 400 repetitions of "S01E01" takes 2.3
seconds where a real name takes under 3 ms, and doubling the input quadruples the
time. None of the three entry points capped filename length, and `--serve` capped
nothing at all, so a single request could occupy the event loop indefinitely;
SECURITY.md already scopes this class of issue. `--serve`, `server.ts` and the
Cloudflare worker now reject a filename over 1024 characters and a batch over 500
with 413. The whole fixture corpus tops out at 196 characters, so the bound only
ever rejects something that was never a filename, and parsing local CLI arguments
stays unbounded. `test/serve-limits.test.ts` covers it.

This bounds the exposure rather than removing it: the quadratic itself is still
there, and a 500-name batch of 1024-character inputs is still expensive. Making
the rules layer linear is the real fix and is not attempted here.

Sports events — a promotion numbers its events, it does not run seasons:

- **combat sports**: a three-digit event number was split down the middle.
  `UFC.300` became season 3, `Bellator.300` the same, `UFC.Fight.Night.245`
  became s02e45. The number is one value and now reads as the episode. Two-digit
  numbers (`UFC.on.FOX.24`) already did and are unchanged, and a promotion that
  really runs a numbered series keeps its marker (`UFC.Embedded.S01E05`). This
  diverges from Python on one corpus name, `UFC.Fight.Night.185` — its fixture
  carried a note that "E185 exceeds the default configuration of E100 being the
  max", which is the split showing through; it is now episode 185
- **motorsport**: `Formula.1.2024.Round.22.Las.Vegas.GP.Race` lost the round
  entirely — "Round" fell into an alternative title and 22 vanished. The calendar
  round is the episode. A bare number elsewhere belongs to the race, so
  `NASCAR.Cup.Series.2024.Daytona.500` no longer reads as season 5 episode 0.
  Scoped to a filepart opening with a series name, which keeps "Round 6" (the
  Portuguese title of Squid Game) and "Round Midnight" out of it
- **sports streaming services**: F1TV, DAZN, FITE and MotorTrend were being taken
  for release groups

**`allowed_languages` widened from 24 to 60.** The default whitelist was
upstream's, and it left out Arabic, Turkish, Greek, Thai, Vietnamese, Indonesian,
Persian, Tamil, Bengali, Urdu and two dozen more — every one of them fell into
the release group instead. All 36 additions are reachable by the spellings
subtitle files actually carry (`ara`/`arabic`, `tur`/`turkish`/`tr`,
`gre`/`ell`/`greek`, …), including the ISO 639-2 bibliographic halves.

Eighteen two-letter spellings are suppressed in `common_words` instead of being
dropped, so the language stays reachable by its three-letter and written-out
forms while the ambiguous token cannot fire: `ar` (Star Trek), `is` (My Name Is
Earl), `my`, `mr` (Mr. Robot), `el` (El Camino), `hr` (HR.DVDRip), `lt` (YTS.LT),
`id`/`as` (streaming tags), `da`, `et` (Jules et Jim), `lo` (Lo Imposible), and
the three-letter `scr` (screener) and `kan`. Macedonian is left out entirely —
`mk` collides with release-group names and the language is negligible here.

Verified by replaying every corpus and golden-reference name (1458 of them)
before and after and diffing `language` / `subtitle_language` / `country` /
`title` / `release_group`: **zero changes**. An adversarial probe over titles
built from the ambiguous tokens is clean too.

Subtitle-metadata sweep — the second pass over a modern corpus, this time
through subtitle files, editions and language tags:

- **"Final Cut" is an edition**: without it `Blade.Runner.1982.Final.Cut.…` typed
  a dated film as an *episode* with `episode_details: Final`. `Redux`,
  `Ultimate Cut`, `Assembly Cut`, `International Cut` and `Anniversary` join it —
  previously they landed in the title (*Apocalypse Now Redux*) or in
  `alternative_title`
- **subtitle flags**: `SDH`, `Forced` and `Closed Caption` are `other` values
  rather than the release group. `…-GRP.eng.forced.srt` kept "forced" as the
  group and lost GRP; both are now right. The flags are scoped to subtitle
  containers, so the group "SC-SDH" on a video file survives and "CC" stays the
  Criterion edition
- **`.hi.srt` was Hindi**: behind another subtitle language it is the
  hearing-impaired flag (`other: SDH`). Alone it is still Hindi
- **Chinese was invisible**: `zh` was missing from the default `allowed_languages`,
  so `.zh.srt`, `.chi.srt`, `.zho.srt` and `.chinese.srt` all fell into the
  release group. (`cn` is deliberately not a synonym — it is the country, and it
  collides with Cartoon Network.)
- **BCP-47 script subtags**: `zh-Hans` / `zh-Hant` / `sr-Latn` are parsed and kept
  on the language as `script`; the two written forms of Chinese are catalogued
  separately. Region subtags (`pt-BR`, `es-MX`) already worked
- **ISO 639-2 bibliographic codes**: `chi`, `ger`, `fre`, `dut`, `cze` resolved to
  nothing — a three-letter miss returned early instead of falling through to the
  code table that holds them. These are what subtitle files and Matroska tracks
  carry. Glued to the previous word by a dash they stay title text, so "Shang-Chi"
  is a film rather than Shang in Chinese
- **a hyphenated title before a year is not a release group**:
  `Spider-Man.2002.1080p.mkv` returned title "Man", release_group "Spider" — the
  #634 guard covered a following season/episode/date but not a year. Ant-Man,
  X-Men and Spider-Man all parse now. Python still gets this one wrong

Real-world sweep — the gaps a modern release corpus hits that the fixture corpus
never did:

- **four-digit absolute episodes**: `One.Piece.1089.1080p.CR.WEB-DL…` was read as
  season 10 episode 89. No season carries 89 episodes — a four-digit run whose
  tail is 40+ is the absolute episode of a long-running show, which is how the
  highest-volume anime (One Piece, Detective Conan, Naruto) name every file. The
  plausible pairs still read as pairs (`the.simpsons.2401` → s24e01,
  `Show.1024` → s10e24), and `1120` stays ambiguous and keeps its season. Python
  has the same bug, so this one is ours alone
- **`H.264` no longer eats the episode**: the digits inside a dotted codec offered
  "264" as a competing season/episode pair, and letting it win cost the episode
  entirely — `One.Piece.1089.…H.264-VARYG` kept neither reading. A duplicate
  sitting strictly inside another recognised property now takes no part in the
  contest
- **HLG** (upstream drops it, we made it worse): `…WEB-DL.HLG.H.265-GRP` reported
  `episode_title: "HLG"`. It is an HDR transfer curve — `other: HLG` — and every
  2160p BBC iPlayer rip carries it
- **HDR10+** is its own format: `HDR10Plus` vanished entirely and `HDR10+`
  collapsed to plain `HDR10`. Both spellings now report `HDR10+`
- **bracketed end-markers**: `[24（END）]`, `[12(END)]`, `[完]` are the completeness
  of the run (`other: Complete`), not an episode title. The bracket is what tells
  them apart from title words — "World's End" and "End of Days" are untouched
- **`[GB]` is not Great Britain**: in a Chinese fansub release it is the subtitle
  encoding (GB2312, simplified), and its sibling tags `[BIG5]`/`[CHS]` already
  parsed to nothing. A country that travels with the title still reads as one
  (`The.Voice.UK.S03E12` → GB)
- **a padded four-digit run belongs to the title**: the anime episode-number bonus
  now applies to two- and three-digit runs only, so
  `Mobile.Suit.Gundam.Unicorn.RE.0096.-.14` is episode 14 of
  "Mobile Suit Gundam Unicorn RE 0096" — previously episode 96 with "14" as the
  title, and better than Python, which returns episode [14, 96]
- **`[x264_ogg].avi`**: a codec bracket lists codecs, so the ogg beside x264 is
  `audio_codec: Vorbis`, not a second container. A real `.ogg` file is untouched

Not changed: `Show.Name.500` still reads s5e0, matching Python and the corpus,
which pins the same quirk on `Show.Name.100`. `Show-A (US) - Episode Title S02E09`
keeps its `alternative_title` — routing it to `episode_title` collides with five
fixtures that want an alternative title on a numbered episode.

## [4.8.0]

**The published v4.7.1 bundle mis-parses — upgrade.** rebulk identifies a rule
by `this.constructor.name`, so the minifier introduced in 4.7.1 collapsed rule
identity and the engine lost dependency order and dedup. `dist` diverged from
`src` on **337 of 1412** corpus names — `episode_title` reported as
`alternative_title`, filepart title selection wrong, `film_title` dropped —
while every source-level test stayed green, because nothing exercised the built
bundle. `vite.config.ts` now sets `keepNames`, matching what `wasm/build.sh`
always did (which is why the WASM target was never affected), and
`test/dist-parity.test.ts` parses the whole corpus through both and fails on any
divergence. It runs after `npm run build` in the CI and release workflows.

Upstream triage sweep — the parsing bugs open at guessit-io/guessit that the
port still shared, plus the test-harness hole that hid one of them:

- **decimal sequel numbers** (upstream #963): `Jackass.2.5.2007` is a film, not
  2 May 2007, and `M3GAN.2.0` keeps its version instead of reporting stereo
  audio. A dotted version run trailing a title keeps every dot, so
  `Evangelion.3.0.1.11` no longer sheds its last one — a run that *opens* the
  value still follows Python (the show `11.22.63` is titled `11 22 63`)
- **source picked out of an episode title** (upstream #964): `…Vhs.Mix.Tape.
  1080p.WEBRip…` reports `Web` alone, because a tag block separates the two
  candidates. Two real sources with only title text between them still compose
  (`UFC.247.PPV.…HDTV` → `[Pay-per-view, HDTV]`), and the file extension never
  outranks a source earlier in the name (`…MPEG2-TrollHD.ts` keeps `HDTV`)
- **`re:` expected titles ignored separators** (upstream #966): Python rewrites
  the space to a dash and compiles with the `dash` abbreviation, so `re:Foo 2`
  matches `Foo.2`. We compiled the pattern raw and matched nothing on a dotted
  name. `Foo.2.2` with `-T 're:Foo 2'` is now `title: Foo 2, episode: 2` —
  what #966 asks for, and ahead of Python, which still returns
  `episode_title: '2'`
- **absolute episodes behind a dotted range** (upstream #944):
  `Bleach.s16e03-04.313-314-GROUP` → `absolute_episode: [313, 314]` and
  `release_group: GROUP`. The bare decimal notation was reading `04.313` as
  season 4, stealing the 313; it no longer starts on the tail of an
  episode range
- **the test loader dropped 96 fixtures**: a block listing several names against
  one expectation (`? name-a` / `? name-b` / `: …`) gives every name but the
  last a null value in YAML, and those were skipped — so only the final name of
  each block ever ran. The two `absolute_episode` names above were among them.
  Suite: 1342 → 1477 tests
- `mimetype` is emitted before `type`, as Python does. The source had always
  had it the other way round; the broken 4.7.1 bundle happened to reorder the
  two rules back into Python's order, so the drop-in parity job passed on a
  bundle that was wrong about everything else
- `wasm/build.sh` uses `wc -c` instead of GNU `stat -c%s`, so the WASM target
  builds on macOS

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
