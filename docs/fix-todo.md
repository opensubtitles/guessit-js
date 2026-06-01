# What's left to FIX — actionable checklist

Only the cases where **guessit-js is wrong** (defects). KEEP cases (where JS is
*more* correct than Python — mimetypes, legit alt titles, Telugu/Spanish, Half-OU,
etc.) are NOT here — see `docs/python-parity-triage.md` for those.

- Live raw list of every difference: `node --import tsx scripts/pydiff.mjs --cat`
- `[x]` = done · `[ ]` = todo. Each shows `current (wrong) → desired`.

**Snapshot:** 88 inputs differ vs Python 3.8.0; 77 excluding env-specific mimetype.
Of those, roughly **~55 are real defects to fix** (the rest are KEEP/NEUTRAL).

---

## ✅ DONE this session

- [x] Range over-expansion — `S01E01E07 → [1,2,..7]` → **`[1,7]`**
- [x] Uppercase language pulled into title — `…FRENCH… → episode_title "FRENCH"` → dropped
- [x] Language/country cropped from episode_title holes (incl. `[Espanol Castellano]`)
- [x] Duplicate identical languages — `["deu","deu","deu"]` → `"deu"`
- [x] Common-word phantom langs — `"De" → German` removed
- [x] Affix-word steal — `"Sub"/"Subbed"/"Subtitulado" → language` phantom removed
- [x] Romanian code `rum → ron`
- [x] mimetypes: `.srt`/`.iso`/`.torrent`/`.ts` added (correct values)
- [x] 3D layouts `Half-OU`/`Half-SBS` → captured as `other`, not alt_title
- [x] Director parentheticals — `(Michel Deville - 1983)`, `(Alain Cavalier, 1967)`,
      `[Jose.Luis.Cuerda.1987]` → no longer alt_title (year-in-group guard)

---

## ☐ TODO — alternative_title that is a label / edition / region / junk
A trailing/parenthetical token that is a release label or format fragment, not a title.
- [ ] `…Criterion.Collection…` → alt **"collection"** → drop (it's an edition)
- [ ] `The.Stranger.1946.US.(Kino.Classics)…` → alt **"kino classics"** → drop (label)
- [ ] `Heathers…ARROW…Plus.Comm…` → alt **["arrow","plus comm"]** → drop (label + commentary)
- [ ] `InDefinitely.Maybe…EUR.BluRay…` → alt **"eur"** → drop (region code)
- [ ] `Suicide Squad…(HEVC 10bit BT709)…` → alt **"bt"** → drop (color-space fragment)
- [ ] `Dead Man Down…Custom NLSubs…` → alt **"custom"** → drop (release descriptor)
- [ ] `Hacksaw Ridge…& ATMOS…` → alt **"&"** → drop (punctuation)
- [ ] `MASH.(1970).[Divx.5.02]…` → alt **"5"** → drop (codec version fragment)

## ☐ TODO — alternative_title / episode_title that is an episode / absolute number
- [ ] `Show!.Name.2.-.10.(2016)…` → alt **"10"** → drop (duplicates `episode: 10`)
- [ ] `Show.Name.-.07.(2016)…` → alt **"07"** → drop (episode)
- [ ] `Show.Name.-.476-479.(2007)…` → alt **"476-479"** → should be `absolute_episode`, not alt
- [ ] `Show.Name.s10e15(233)…` → episode_title **"233"** → should be `absolute_episode`

## ☐ TODO — episode_title that is a tag / broadcaster / credit
- [ ] `Bleach.s16e03-04.313-314-GROUP` → episode_title **"group"** → should be `release_group`
- [ ] `Show.Name.16x03-05.313-315-GROUP` → episode_title **"group"** → `release_group`
- [ ] `…S01e10[Mux …]` / `…S02e19 [Mux …]` → episode_title **"mux"** → drop (container tag)
- [ ] `…Eng.Soft.Subtitles…` → episode_title **"soft"** → drop
- [ ] `…[Cap.112_114.Final]…` → episode_title **"final"** → drop (episode_details)
- [ ] `[Ayako-Shikkaku]…[LQ]…` → episode_title **"lq"** → drop (quality tag)
- [ ] `[ShinBunBu-Subs] Bleach …(CX …)` → episode_title **"cx"** → drop (broadcaster)
- [ ] `Show Name 445 VOSTFR par Fansub-Resistance…` → episode_title **"par fansub-resistance"** → drop (credit)
- [ ] `Blue.Bloods…Obfuscated/afaae96…` → episode_title **["0e","ae7a","ced2a"]** → drop (hash junk)

## ☐ TODO — episode_title returned as a LIST with an extra fragment
The real title is right; JS appends a stray broadcaster/credit token.
- [ ] `Ep. 02 - Soul Hunter` → **["ep","soul hunter"]** → `"soul hunter"`
- [ ] `NHL…Away.Feed…` → **["away feed", …]** → drop "away feed"
- [ ] `NHL…Home.Feed…` → **["home feed", …]** → drop "home feed"
- [ ] `Show.Name.1x01.eps1.0…By.Malaguita…` → **["by malaguita", …]** → drop credit
- [ ] `Show.Name.S04E21…German.Custom.Subbed…` → **[title,"custom"]** → drop "custom"
- [ ] `Tales S01E08…BET WEBRip…` → **[title,"bet"]** → drop broadcaster

## ☐ TODO — title that absorbed junk tokens
- [ ] `From [WWW.TORRENTING.COM] - White.Rabbit.Project…` → title gains **"from"** → drop
- [ ] `Show.Name.Part.1.and.Part.2.Blah-Group` → title gains **"and","blah-group"** → drop
- [ ] `The.Arrival…MadVR…` → title gains **"madvr"** → drop
- [ ] `Show-A (US) - Episode Title S02E09…` → title gains **"episode title"** → should be episode_title
- [ ] `French Maid Services…SPLIT SCENES…` (×2) → title gains **"split scenes"** + phantom `language fra` → drop both

## ☐ TODO — phantom languages (a word read as a language)
- [ ] `Ejecutiva.En.Apuros…` → `["eng","spa"]` → `"spa"` (phantom `eng` from "En")
- [ ] `Fear…En Close, Yet En Far…French…` → `["eng","eng","fra"]` → `"fra"`
- [ ] `Fear…Eng.Ac3…sub.ita.eng` → `["eng","eng"]` → `"eng"`
- [ ] `French.Immersion…ENGLISH…` → `["eng","fra"]` → `"eng"` (phantom `fra` from title "French")
- [ ] `Elle.s.en.va…` → phantom `language eng` → none
- [ ] `The_Italian_Job.mkv` → phantom `language ita` (from title "Italian") → none
- [ ] `Underworld…VFF+VFQ…` → `["fra","fra"]` → `"fra"` (the one real remaining dup)

## ☐ TODO — episode_details phantoms ("Special"/"Final" in a movie title)
- [ ] `Special.Correspondents.2016…` (×2) → phantom `episode_details "special"` → none (it's the title)
- [ ] `Ouija.Seance.The.Final.Game…` → phantom `episode_details "final"` → none

## ☐ TODO — stray phantoms (release_group / version / country)
- [ ] `03-Criminal.Minds.avi` → phantom `release_group "03"` → none
- [ ] `Westworld…[Season.2.Full]…` → `release_group "[season.2.full]"` → none (junk bracket)
- [ ] `We.Bare.Bears…Obfuscated/mxN…3PHD` → phantom `version 3` (from hash) → none
- [ ] `Bienvenue.Au.Gondwana…` → phantom `country au` (from French "Au") → none

---

## ☐ NEUTRAL — decide before touching (no clear winner)
See `docs/python-parity-triage.md` § NEUTRAL. Highlights:
- Python's `season = <year>` quirk (we're inconsistent — emit it sometimes)
- `11.22.63.106` date-show, `MacGyver…CD-ROM…`, `BarFood christmas special`, `MotoGP…USA`
- `FooBar.7v3` (version vs title), `555.S01` (title vs absolute_episode)

## ✋ WON'T FIX (KEEP — JS already better) — see triage doc
mimetypes (`.com`/`.sc`/`.tm`/`.ma`/`.pt`), `.ts`→video/mp2t, legit alt titles
(`The Killers`/`The Prestige`/`Batoru Rowaiaru`/`Be Bad`), `Telugu`/`Spanish`
detected, `60 Minutes`, `HC`→Hardcoded Subtitles, `Half-OU`/`Half-SBS`, website
extraction, X2.
