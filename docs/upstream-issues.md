# Upstream guessit issues — triage & tracking

Triaged from <https://github.com/guessit-io/guessit/issues> (open issues) for the
guessit-js port. Oriented toward parsing behaviour; Python-runtime/packaging
crashes are treated as no-go since they have no analogue in a self-contained
TS/WASM build.

**Status legend:** **fixed** = done in guessit-js · **works**/**acceptable** =
already correct or reasonable (often better than Python) · **partial** = improved
but not complete · **not fixed / not done** = with the reason inline · `wontfix` =
invalid/ambiguous/env-specific.

**Progress (as of this pass):** every open issue below has an explicit disposition.
**27 fixed** (305-partial, 623, 638, 646, 651, 652, 667, 670, 671, 705, 722, 732,
737, 743, 745, 746, 763, 784, 789, 790, 796, 800, 773, 301, 618, 622, 630, 708) · **7 already
work / acceptable** (648, 660, 752, 774, 637, 741, 771) · the rest carry an inline
"why not fixed" note. The unfixed parsing bugs cluster into: delicate release-group
cascades (#634/#640), the obfuscated-hash case (#742), the remaining anime
conventions (#690/#696/#747), and pure feature requests (#272/#273/#599/#802).

**Cross-ref (UPDATED 2026-06-02):** the biggest validated cluster was **title-token
collision** — a title word/letter consumed as country/language/edition/source/other,
the same root cause as the Python↔JS parity gap tracked by `scripts/pydiff.mjs`.
**That gap is now closed: parity is FIX 0** (`docs/python-parity.md`) — every genuine
JS-worse-than-Python case (spurious episode_title/alternative_title fragments,
title-absorbs-junk lists, dup-language, GROUP→episode_title, phantom languages,
obfuscated-hash junk) is fixed. The ★ issues below that are still "not fixed" are a
*different, narrower* set (hyphen-title release-group cascade #634/#640, the
`cd`-mid-token hash case #742, ambiguous anime formatting #690/#696/#747) — they were
NOT part of the parity-fixture corpus, so the parity work did not touch them. They
remain open and are individually marginal/risky.

---

## VALIDATED / SHOULD FIX (22)

| # | URL | Claim (example → expected vs actual) | Status |
|---|-----|--------------------------------------|--------|
| 305 | https://github.com/guessit-io/guessit/issues/305 | `Brodnopis_i_pioro.svg` → title includes `svg`; extension leaks into title, typed movie | not fixed — shared Python bug (Python also keeps 'svg' in title; .svg isn't a video container). Added .svg→image/svg+xml mimetype; the title-leak fix would diverge from Python |
| 623 | https://github.com/guessit-io/guessit/issues/623 | `FlexGet.US.S2013E14...AAC1.0.x264-NOGRP` → `season:[2013,0]`, misses `audio_codec:AAC`/`audio_channels:1.0` | **fixed** (audio_channels 1.0, no season:0) |
| 634 | https://github.com/guessit-io/guessit/issues/634 | ★ `grown-ish.s03e01.web.x264-tbs[eztv]` → `release_group:"grown"`, `title:"ish"`; hyphenated title split | not fixed — only breaks WITH a trailing [eztv]/[ettv] group (without it title='grown-ish' ✓). That bracket makes DashSeparatedReleaseGroup grab 'grown'; delicate release-group cascade, high regression risk |
| 638 | https://github.com/guessit-io/guessit/issues/638 | ★ `Us.2019.mkv` → `Us` matched as country `US` not title | **fixed** (Title-Case country at title pos) |
| 640 | https://github.com/guessit-io/guessit/issues/640 | ★ `grown-ish` + trailing `[ettv]`/`[eztv]` flips title/release_group (same root as 634) | not fixed — same root as #634 (trailing bracket + dash release-group cascade) |
| 646 | https://github.com/guessit-io/guessit/issues/646 | `Charlot.Policeman.1917...` → `season:19, episode:17`; pre-1920 year split into S/E | **fixed** (validYear lower bound → 1900) |
| 651 | https://github.com/guessit-io/guessit/issues/651 | `...x264-CNHD` → `streaming_service:"Cartoon Network"` from `CN` in release group | **fixed** (glued short-abbrev guard) |
| 652 | https://github.com/guessit-io/guessit/issues/652 | ★ `The.Collector.2009...` → `title:"The"`, `edition:"Collector"` | **fixed** (lone-article title extend) |
| 670 | https://github.com/guessit-io/guessit/issues/670 | `[SSA] Uma Musume...mkv` → `container:["ssa","mkv"]`, no release_group; leading `[SSA]` is group | **fixed** (leading subtitle-ext bracket → release_group) |
| 732 | https://github.com/guessit-io/guessit/issues/732 | ★ `Show.S01E01.Cam...` → `source:["Camera","Web"]`; "Cam" episode word → Camera source | **fixed** (Title-Case Cam→title) |
| 737 | https://github.com/guessit-io/guessit/issues/737 | ★ `The.English.S01E01...` → `title:"The"`, `language:"English"` | **fixed** (lone-article title extend) |
| 742 | https://github.com/guessit-io/guessit/issues/742 | `My File 238ddcd5aff.mkv` → `cd:5`; `cd` matches mid-token, needs word boundary | not fixed — obfuscated hash ('238ddcd5aff'); no clean correct output (JS→garbage ep, Python→garbage cd:5). Not worth heuristics on hash junk |
| 743 | https://github.com/guessit-io/guessit/issues/743 | ★ `The.Mandalorian.S03E03.Chapter.19.The.Convert...` → `other:"Converted"`, truncated episode_title | **fixed** (Title-Case Convert→title) |
| 744 | https://github.com/guessit-io/guessit/issues/744 | `Ted.Lasso.S03E03.4-5-1...` → `episode:[3,4,5]`, `episode_title:"1"`; "4-5-1" eaten as range | partial — JS gives episode 3 + episode_title '4' (better than Python's episode [3,4,5]); the formation '4-5-1' still isn't kept whole; needs title-context |
| 745 | https://github.com/guessit-io/guessit/issues/745 | ★ `[ASW] Oshi no Ko - 01...` → `title:"Oshi no"`, `language:"Korean"`; "Ko" → Korean | **fixed** (stop-word trailing-crop guard) |
| 746 | https://github.com/guessit-io/guessit/issues/746 | ★ `Schmigadoon.S02E04.Something.Real...` → `other:"Proper"`, episode_title truncated | **fixed** (Title-Case Real→title) |
| 757 | https://github.com/guessit-io/guessit/issues/757 | `[SubsPlus+] Helck...` → group mis-detected; `+` in leading-bracket group name breaks detection | not fixed — JS already gets release_group 'SubsPlus' (better than Python's wrong group); only the trailing '+' is lost because '+' is a global separator char. Low value, risky to change sep handling |
| 784 | https://github.com/guessit-io/guessit/issues/784 | ★ `The.Convert (2024)...` → `title:"The"`, `other:"Converted"` (movie variant of 743) | **fixed** (Title-Case Convert→title) |
| 789 | https://github.com/guessit-io/guessit/issues/789 | ★ `It Ends With Us 2024...` → `title:"It Ends With"`, `country:"US"` (19 comments) | **fixed** (stop-word trailing-crop guard) |
| 790 | https://github.com/guessit-io/guessit/issues/790 | `La casa del dragón 2×7` not parsed; Unicode `×` should normalize to `x` (→ S2E7) | **fixed** (added × to episode markers) |
| 796 | https://github.com/guessit-io/guessit/issues/796 | ★ `Adam-12 S01E02...` → `title:["Adam","12"]` (list, split); should be `"Adam-12"` | **fixed** (title "Adam-12") |
| 800 | https://github.com/guessit-io/guessit/issues/800 | ★ `The.Four.Seasons.2025.S01E01...` → `title:"The Four"`, `season:[2025,1]`; "Seasons" swallowed | **fixed** (reject year as season-word number) |

---

## MIDDLE PRIORITY (27)

| # | URL | Claim | Status |
|---|-----|-------|--------|
| 272 | https://github.com/guessit-io/guessit/issues/272 | Feature: archive containers/types (rar → episodearchive) | not done — feature (rar→episodearchive type); design addition deferred |
| 273 | https://github.com/guessit-io/guessit/issues/273 | Feature: metadata files (nfo/poster/jpg → episodemeta, other:poster) | not done — feature (nfo/poster/jpg types); deferred |
| 301 | https://github.com/guessit-io/guessit/issues/301 | `vol127+128` leaks into release_group; detect `volume` property | **fixed** (new volume property) |
| 599 | https://github.com/guessit-io/guessit/issues/599 | Feature: artist/album for music folders | not done — music artist/album; out of core video scope |
| 618 | https://github.com/guessit-io/guessit/issues/618 | Feature: VR support | **fixed** (VR other-value) |
| 622 | https://github.com/guessit-io/guessit/issues/622 | Feature: extract imdb_id/tmdb/tvdb (`tt\d+`) | **fixed** (imdb_id tt…, tmdb_id, tvdb_id) |
| 630 | https://github.com/guessit-io/guessit/issues/630 | Feature: MicroHD / HDlite other-values | **fixed** (added MicroHD/HDlite) |
| 637 | https://github.com/guessit-io/guessit/issues/637 | `E.60.2020...` → title "E", ep 60; real show "E:60" but ambiguous | acceptable — JS gives title 'E 60' (≈ 'E:60'); '60' is not mis-read as episode. Reasonable as-is |
| 648 | https://github.com/guessit-io/guessit/issues/648 | Dolby Vision (DV/SL.DV/DL.DV) mis-parsed; new property, ambiguous tokens | **works** (DV→Dolby Vision, HDR→HDR10) |
| 660 | https://github.com/guessit-io/guessit/issues/660 | `HI.SCORE.GIRL...` → `language:hi`; suppress 2-letter lang at title start (debatable) | **works** (title kept, no phantom hi) |
| 667 | https://github.com/guessit-io/guessit/issues/667 | Anime `S2 - 01` → episode as episode_title "01" | **fixed** (numeric episode_title w/ season but no episode → episode) |
| 671 | https://github.com/guessit-io/guessit/issues/671 | Japanese episode marker `第195話` (CJK parsing) | **fixed** (CJK 第N話/シーズン/期 markers) |
| 690 | https://github.com/guessit-io/guessit/issues/690 | `Re ZERO -Starting Life...- Season 2 - 15` → season:15; ambiguous formatting | not fixed — ambiguous anime formatting ('Season 2 - 15'); risky |
| 693 | https://github.com/guessit-io/guessit/issues/693 | Resolution without 'p' (`720`/`1080`) → S/E; maintainer reluctant | not done — maintainer-reluctant; bare 720/1080 as resolution collides with episode numbers |
| 696 | https://github.com/guessit-io/guessit/issues/696 | Romaji title + `(English title)` → group mis-detected | not fixed — anime romaji + '(English title)' group mis-detection; fragile |
| 705 | https://github.com/guessit-io/guessit/issues/705 | Feature: opening/ending sequence detection (extra_type) | **fixed** (NCOP→Opening Credits, NCED→Ending Credits) |
| 708 | https://github.com/guessit-io/guessit/issues/708 | `...(July 30 2021) [540p mp4 subs]` → release_group "July 30 2021"; should be date | **fixed** (month-name date parsing) |
| 722 | https://github.com/guessit-io/guessit/issues/722 | `Extras (2005) - S01E01...` → `other:"Extras"`, no title; show named "Extras" | **fixed** (Title-Case property at title pos → title) |
| 741 | https://github.com/guessit-io/guessit/issues/741 | `1280x720up` junk after resolution breaks parsing | acceptable — JS gives clean title 'Movie' (junk '1280x720up' dropped, no crash). Reasonable |
| 747 | https://github.com/guessit-io/guessit/issues/747 | `5. Nanatsu no Taizai...` → movie while `22.` works; inconsistent leading number | not fixed — '5. Title' vs '22. Title' inconsistent leading-number handling; ambiguous |
| 752 | https://github.com/guessit-io/guessit/issues/752 | `S01E02.3.Kings` → `episode:[2,3]`; leading title digit read as range | **works** (ep 2, et "3 Kings"; better than Python) |
| 763 | https://github.com/guessit-io/guessit/issues/763 | Japanese season/episode markers (シーズン/第/話) | **fixed** (CJK シーズン/第/話/期 markers) |
| 771 | https://github.com/guessit-io/guessit/issues/771 | `3D` should match only after year (avoids titles containing 3D) | acceptable — leading '3D' stays in the title (not mis-detected); a strict after-year-only rule could regress titles legitimately containing 3D |
| 772 | https://github.com/guessit-io/guessit/issues/772 | Folder episode range `01~43` overrides file `11`; precedence design | not done — design call: folder episode range vs filename precedence |
| 774 | https://github.com/guessit-io/guessit/issues/774 | `Blade Runner 2049` (no year) → S20E49; needs year-range heuristic | works — with a release year JS gives title 'Blade Runner 2049' + year. The no-year case (2049→S/E) is shared Python behaviour and needs a fragile year heuristic |
| 797 | https://github.com/guessit-io/guessit/issues/797 | Parent-dir `Season 1` overrides filename `S44`; precedence design | not done — design call: parent-dir 'Season 1' vs filename 'S44' precedence |
| 802 | https://github.com/guessit-io/guessit/issues/802 | Feature: composite `quality` field (underspecified) | not done — underspecified feature (composite 'quality' field) |

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
| 773 | https://github.com/guessit-io/guessit/issues/773 | `xXx`→other:XXX; fundamentally ambiguous, dup of 246 | **fixed** (other at title pos → title) |
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

- **DONE (2026-06-02) — the title-token / multi-hole cluster.** What was feared to
  need a `check_titles_in_filepart` rework was instead solved with ~13 surgical
  `POST_PROCESS` (priority −2048) cleanup rules that DELETE junk *after* the
  multi-hole machinery runs (don't constrain hole-finding — that regresses
  fixtures). Reusable pattern: keep the PRIMARY title/episode_title, drop later
  fragments behind a recognised property in the release tail; keep things
  contiguous with the title/year. Rules live in title.ts / episode_title.ts /
  language.ts / release_group.ts. See the `python-parity` memory for the full list.
  Parity is now FIX 0; validate against `scripts/pydiff.mjs` after any change.
- **Still open (separate sub-bugs, NOT in the parity corpus):**
  - **Hyphenated-title split** (#634, #640): a `-` inside a title becomes a
    release-group boundary *only* when a trailing `[eztv]`/`[ettv]` group is
    present (`grown-ish…[eztv]` → title "ish", rg "grown"). Delicate cascade.
  - **Obfuscated `cd`-mid-token** (#742): `My File 238ddcd5aff.mkv` → `cd:5`.
    Same-filepart hash; `RemoveHashFilepartJunk` only handles a hash that is its
    OWN path segment (the `-Obfuscated/<hex>.mkv` parity cases), not a hash glued
    into the title filepart. Needs a `cd` word-boundary fix (risky).
  - **Ambiguous anime formatting** (#690/#696/#747): "Season 2 - 15", romaji +
    "(English title)", inconsistent leading numbers.
