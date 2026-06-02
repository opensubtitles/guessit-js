# Upstream guessit issues — triage & tracking

Triaged from <https://github.com/guessit-io/guessit/issues> (open issues) for the
guessit-js port. Oriented toward parsing behaviour; Python-runtime/packaging
crashes are treated as no-go since they have no analogue in a self-contained
TS/WASM build.

**Status legend:** `todo` = should fix · `fixed` = done in guessit-js · `middle` =
debatable/feature · `wontfix` = invalid/ambiguous/env-specific · `partial` = partly done.

**Cross-ref:** the biggest validated cluster is **title-token collision** — a title
word/letter consumed as country/language/edition/source/other. This is the *same*
root cause as the Python↔JS parity gap tracked by `scripts/pydiff.mjs`
(`spurious-episode_title` + `spurious-alternative_title` + `dup-language`, ~158
cases). Fixing it once should resolve many of these issues together. Tagged ★ below.

---

## VALIDATED / SHOULD FIX (22)

| # | URL | Claim (example → expected vs actual) | Status |
|---|-----|--------------------------------------|--------|
| 305 | https://github.com/guessit-io/guessit/issues/305 | `Brodnopis_i_pioro.svg` → title includes `svg`; extension leaks into title, typed movie | todo |
| 623 | https://github.com/guessit-io/guessit/issues/623 | `FlexGet.US.S2013E14...AAC1.0.x264-NOGRP` → `season:[2013,0]`, misses `audio_codec:AAC`/`audio_channels:1.0` | **fixed** (audio_channels 1.0, no season:0) |
| 634 | https://github.com/guessit-io/guessit/issues/634 | ★ `grown-ish.s03e01.web.x264-tbs[eztv]` → `release_group:"grown"`, `title:"ish"`; hyphenated title split | todo |
| 638 | https://github.com/guessit-io/guessit/issues/638 | ★ `Us.2019.mkv` → `Us` matched as country `US` not title | todo |
| 640 | https://github.com/guessit-io/guessit/issues/640 | ★ `grown-ish` + trailing `[ettv]`/`[eztv]` flips title/release_group (same root as 634) | todo |
| 646 | https://github.com/guessit-io/guessit/issues/646 | `Charlot.Policeman.1917...` → `season:19, episode:17`; pre-1920 year split into S/E | todo |
| 651 | https://github.com/guessit-io/guessit/issues/651 | `...x264-CNHD` → `streaming_service:"Cartoon Network"` from `CN` in release group | **fixed** (glued short-abbrev guard) |
| 652 | https://github.com/guessit-io/guessit/issues/652 | ★ `The.Collector.2009...` → `title:"The"`, `edition:"Collector"` | todo |
| 670 | https://github.com/guessit-io/guessit/issues/670 | `[SSA] Uma Musume...mkv` → `container:["ssa","mkv"]`, no release_group; leading `[SSA]` is group | **fixed** (leading subtitle-ext bracket → release_group) |
| 732 | https://github.com/guessit-io/guessit/issues/732 | ★ `Show.S01E01.Cam...` → `source:["Camera","Web"]`; "Cam" episode word → Camera source | **fixed** (Title-Case Cam→title) |
| 737 | https://github.com/guessit-io/guessit/issues/737 | ★ `The.English.S01E01...` → `title:"The"`, `language:"English"` | todo |
| 742 | https://github.com/guessit-io/guessit/issues/742 | `My File 238ddcd5aff.mkv` → `cd:5`; `cd` matches mid-token, needs word boundary | todo |
| 743 | https://github.com/guessit-io/guessit/issues/743 | ★ `The.Mandalorian.S03E03.Chapter.19.The.Convert...` → `other:"Converted"`, truncated episode_title | **fixed** (Title-Case Convert→title) |
| 744 | https://github.com/guessit-io/guessit/issues/744 | `Ted.Lasso.S03E03.4-5-1...` → `episode:[3,4,5]`, `episode_title:"1"`; "4-5-1" eaten as range | todo |
| 745 | https://github.com/guessit-io/guessit/issues/745 | ★ `[ASW] Oshi no Ko - 01...` → `title:"Oshi no"`, `language:"Korean"`; "Ko" → Korean | todo |
| 746 | https://github.com/guessit-io/guessit/issues/746 | ★ `Schmigadoon.S02E04.Something.Real...` → `other:"Proper"`, episode_title truncated | **fixed** (Title-Case Real→title) |
| 757 | https://github.com/guessit-io/guessit/issues/757 | `[SubsPlus+] Helck...` → group mis-detected; `+` in leading-bracket group name breaks detection | todo |
| 784 | https://github.com/guessit-io/guessit/issues/784 | ★ `The.Convert (2024)...` → `title:"The"`, `other:"Converted"` (movie variant of 743) | **fixed** (Title-Case Convert→title) |
| 789 | https://github.com/guessit-io/guessit/issues/789 | ★ `It Ends With Us 2024...` → `title:"It Ends With"`, `country:"US"` (19 comments) | todo |
| 790 | https://github.com/guessit-io/guessit/issues/790 | `La casa del dragón 2×7` not parsed; Unicode `×` should normalize to `x` (→ S2E7) | **fixed** (added × to episode markers) |
| 796 | https://github.com/guessit-io/guessit/issues/796 | ★ `Adam-12 S01E02...` → `title:["Adam","12"]` (list, split); should be `"Adam-12"` | **fixed** (title "Adam-12") |
| 800 | https://github.com/guessit-io/guessit/issues/800 | ★ `The.Four.Seasons.2025.S01E01...` → `title:"The Four"`, `season:[2025,1]`; "Seasons" swallowed | todo |

---

## MIDDLE PRIORITY (27)

| # | URL | Claim | Status |
|---|-----|-------|--------|
| 272 | https://github.com/guessit-io/guessit/issues/272 | Feature: archive containers/types (rar → episodearchive) | middle |
| 273 | https://github.com/guessit-io/guessit/issues/273 | Feature: metadata files (nfo/poster/jpg → episodemeta, other:poster) | middle |
| 301 | https://github.com/guessit-io/guessit/issues/301 | `vol127+128` leaks into release_group; detect `volume` property | **fixed** (new volume property) |
| 599 | https://github.com/guessit-io/guessit/issues/599 | Feature: artist/album for music folders | middle |
| 618 | https://github.com/guessit-io/guessit/issues/618 | Feature: VR support | **fixed** (VR other-value) |
| 622 | https://github.com/guessit-io/guessit/issues/622 | Feature: extract imdb_id/tmdb/tvdb (`tt\d+`) | **fixed** (imdb_id tt…, tmdb_id, tvdb_id) |
| 630 | https://github.com/guessit-io/guessit/issues/630 | Feature: MicroHD / HDlite other-values | **fixed** (added MicroHD/HDlite) |
| 637 | https://github.com/guessit-io/guessit/issues/637 | `E.60.2020...` → title "E", ep 60; real show "E:60" but ambiguous | middle |
| 648 | https://github.com/guessit-io/guessit/issues/648 | Dolby Vision (DV/SL.DV/DL.DV) mis-parsed; new property, ambiguous tokens | **works** (DV→Dolby Vision, HDR→HDR10) |
| 660 | https://github.com/guessit-io/guessit/issues/660 | `HI.SCORE.GIRL...` → `language:hi`; suppress 2-letter lang at title start (debatable) | **works** (title kept, no phantom hi) |
| 667 | https://github.com/guessit-io/guessit/issues/667 | Anime `S2 - 01` → episode as episode_title "01" | middle |
| 671 | https://github.com/guessit-io/guessit/issues/671 | Japanese episode marker `第195話` (CJK parsing) | middle |
| 690 | https://github.com/guessit-io/guessit/issues/690 | `Re ZERO -Starting Life...- Season 2 - 15` → season:15; ambiguous formatting | middle |
| 693 | https://github.com/guessit-io/guessit/issues/693 | Resolution without 'p' (`720`/`1080`) → S/E; maintainer reluctant | middle |
| 696 | https://github.com/guessit-io/guessit/issues/696 | Romaji title + `(English title)` → group mis-detected | middle |
| 705 | https://github.com/guessit-io/guessit/issues/705 | Feature: opening/ending sequence detection (extra_type) | middle |
| 708 | https://github.com/guessit-io/guessit/issues/708 | `...(July 30 2021) [540p mp4 subs]` → release_group "July 30 2021"; should be date | **fixed** (month-name date parsing) |
| 722 | https://github.com/guessit-io/guessit/issues/722 | `Extras (2005) - S01E01...` → `other:"Extras"`, no title; show named "Extras" | middle |
| 741 | https://github.com/guessit-io/guessit/issues/741 | `1280x720up` junk after resolution breaks parsing | middle |
| 747 | https://github.com/guessit-io/guessit/issues/747 | `5. Nanatsu no Taizai...` → movie while `22.` works; inconsistent leading number | middle |
| 752 | https://github.com/guessit-io/guessit/issues/752 | `S01E02.3.Kings` → `episode:[2,3]`; leading title digit read as range | **works** (ep 2, et "3 Kings"; better than Python) |
| 763 | https://github.com/guessit-io/guessit/issues/763 | Japanese season/episode markers (シーズン/第/話) | middle |
| 771 | https://github.com/guessit-io/guessit/issues/771 | `3D` should match only after year (avoids titles containing 3D) | middle |
| 772 | https://github.com/guessit-io/guessit/issues/772 | Folder episode range `01~43` overrides file `11`; precedence design | middle |
| 774 | https://github.com/guessit-io/guessit/issues/774 | `Blade Runner 2049` (no year) → S20E49; needs year-range heuristic | middle |
| 797 | https://github.com/guessit-io/guessit/issues/797 | Parent-dir `Season 1` overrides filename `S44`; precedence design | middle |
| 802 | https://github.com/guessit-io/guessit/issues/802 | Feature: composite `quality` field (underspecified) | middle |

---

## NO-GO / BULLSHIT (29)

| # | URL | Reason | Status |
|---|-----|--------|--------|
| 389 | https://github.com/guessit-io/guessit/issues/389 | Aho-Corasick perf; Python-engine, irrelevant to TS | wontfix |
| 610 | https://github.com/guessit-io/guessit/issues/610 | options vs options.json merge; Python config behaviour, workaround exists | wontfix |
| 617 | https://github.com/guessit-io/guessit/issues/617 | Debian test failures on old 3.1.0; obsolete/env | wontfix |
| 620 | https://github.com/guessit-io/guessit/issues/620 | "Us 2019 remux" dump looks correct, no clear expected; dup of 638 | wontfix |
| 627 | https://github.com/guessit-io/guessit/issues/627 | `-t episode` lenient anime rules; working-as-designed per maintainer | wontfix |
| 668 | https://github.com/guessit-io/guessit/issues/668 | no/da removed by common_words; user-config, not a bug | wontfix |
| 699 | https://github.com/guessit-io/guessit/issues/699 | `E-AC-3` bleeds into episode; ambiguous audio token, no clean expected | wontfix |
| 700 | https://github.com/guessit-io/guessit/issues/700 | mojibake/zero-width chars; not a clean repro | wontfix |
| 704 | https://github.com/guessit-io/guessit/issues/704 | nuitka packaging TypeError; Python tooling | wontfix |
| 725 | https://github.com/guessit-io/guessit/issues/725 | Bazarr crash old version; downstream/version | wontfix |
| 751 | https://github.com/guessit-io/guessit/issues/751 | title vs film_title; usage question | wontfix |
| 768 | https://github.com/guessit-io/guessit/issues/768 | read embedded media tags; out of scope (names only) | wontfix |
| 773 | https://github.com/guessit-io/guessit/issues/773 | `xXx`→other:XXX; fundamentally ambiguous, dup of 246 | wontfix |
| 779 | https://github.com/guessit-io/guessit/issues/779 | garbled Chinese = JSON ensure_ascii in user's script; not a bug | wontfix |
| 782 | https://github.com/guessit-io/guessit/issues/782 | "Discovery" episode word → streaming service; no well-defined rule | wontfix |
| 783 | https://github.com/guessit-io/guessit/issues/783 | UnicodeDecodeError reading options.json; ASCII-locale env | wontfix |
| 785 | https://github.com/guessit-io/guessit/issues/785 | NoneType not iterable; corrupted install via Bazarr/QNAP | wontfix |
| 792 | https://github.com/guessit-io/guessit/issues/792 | import fails on Python 3.12 / babelfish; runtime-specific | wontfix |
| 793 | https://github.com/guessit-io/guessit/issues/793 | Exception report 3.4.2; obsolete | wontfix |
| 794 | https://github.com/guessit-io/guessit/issues/794 | episode_title is a date, parsed as `date` correctly; expected behaviour | wontfix |
| 795 | https://github.com/guessit-io/guessit/issues/795 | Exception report 3.4.2 (`E=M6`); obsolete | wontfix |
| 803 | https://github.com/guessit-io/guessit/issues/803 | input is None; user error / TS type error | wontfix |
| 804 | https://github.com/guessit-io/guessit/issues/804 | subliminal can't find subs; downstream integration | wontfix |
| 805 | https://github.com/guessit-io/guessit/issues/805 | mnamer crash; pinned old 3.7.1, fixed in 3.8.0 | wontfix |
| 806 | https://github.com/guessit-io/guessit/issues/806 | Medusa crash 3.4.2; obsolete/env | wontfix |
| 807 | https://github.com/guessit-io/guessit/issues/807 | "project dead?"; meta question | wontfix |
| — | (#783/#785/#792/#793/#795/#803/#804/#805/#806 form the Python-runtime crash cluster) | | |

---

## Notes for fixing

- **One root cause, many issues:** ★ items are title-token collisions. The fix is
  in how language/country/edition/other matches interact with title-hole
  computation — title candidates should exclude tokens already claimed by a
  strong property, and a *bare* country/language word adjacent to a real title
  should not steal it. Validate against `scripts/pydiff.mjs` after each change.
- **Hyphenated-title split** (#634, #640, #796) is its own sub-bug: a `-` inside a
  title is treated as a release-group boundary.
- **"Convert"→Converted** (#743, #784) and **"Real"→Proper** (#746): word-values
  match without requiring full-token isolation / position context.
