# Python ↔ JS parity triage — fix / keep / neutral

Verdict for every current divergence between guessit-js and Python guessit 3.8.0.
Goal is **"JS should be correct"**, not blind parity — Python has real bugs too.
Regenerate the raw diff with `node --import tsx scripts/pydiff.mjs --cat`; format is
`key: <python> vs <js>`.

**Verdict counts:** FIX = 52 · KEEP (JS better) = 31 · NEUTRAL (debatable) = 33
(total 116 inputs; some inputs appear in two buckets).

Legend:
- **FIX** — JS is wrong (junk/phantom/duplicate field). Make JS match Python.
- **KEEP** — JS is more correct than Python. Leave as-is; mark intentional.
- **NEUTRAL** — genuinely debatable; no clear winner. Decide later.

---

## FIX — JS emits junk we should remove (Python is right)

### Languages: duplicates & phantoms (`dup-language`, `language`)
All FIX — a language is listed twice, or a non-language word is read as one.
- `Criminal.Minds…ENG.-.sub.FR…` — `subtitle_language ["fra","fra"]` → should be `fra`
- `Le Cinquieme…SUBFORCED FRENCH…` — `["fra","fra"]`
- `Dexter.5x02…ENG.-.sub.FR…` — `["fra","fra"]`
- `The.Mentalist.2x21…ENG.-.sub.FR…` — `["fra","fra"]`
- `Show.Name.S06E05…Legenda.PT-BR` (×3: Legenda/Legendado/Legendas) — `subtitle_language ["por","por"]`
- `Underworld Quadrilogie VO+VFF+VFQ…` — `language ["fra","fra"]`
- `Fear.the.Walking.Dead…Eng.Ac3…sub.ita.eng…` — `["eng","eng"]`
- `Ejecutiva.En.Apuros…Spanish…` — phantom `eng` (from "En") → should be `spa` only
- `Fear the Walking Dead - 01x02 - En Close, Yet En Far…French…` — phantom `["eng","eng","fra"]`
- `French.Immersion…ENGLISH…` — phantom `fra` (from title word "French") → `eng` only
- `Elle.s.en.va.720p` — phantom `language eng` (from "en")
- `The_Italian_Job.mkv` — phantom `language ita` (from title word "Italian")
- `Fantastic Mr Fox…{Fr-Eng}{Sub.Fr-Eng}` — `subtitle_language ["eng","fra","fra"]` (dup fra)
- `S.W.A.T…German.Dubbed.DL…` — `language ["deu","mul","mul"]` (dup mul)
- `Bienvenue.Au.Gondwana…` — phantom `country au` (from French "Au")

### alternative_title that is really a director / edition / region / format code
- `La petite bande (Michel Deville - 1983)…` — alt "michel deville" (**director**)
- `Mise à Sac (Alain Cavalier, 1967)…` — alt "alain cavalier" (**director**)
- `El.Bosque.Animado.[Jose.Luis.Cuerda.1987]…` (×2) — alt "jose luis cuerda" (**director**)
- `Heathers…ARROW…Plus.Comm…` — alt ["arrow","plus comm"] (**label + commentary**)
- `Picnic.at.Hanging.Rock…Criterion.Collection…` — alt "collection" (**edition**)
- `The.Stranger.1946.US.(Kino.Classics)…` — alt "kino classics" (**label**)
- `InDefinitely.Maybe…EUR.BluRay…` — alt "eur" (**region code**)
- `Suicide Squad EXTENDED…(HEVC 10bit BT709)…` — alt "bt" (**color-space fragment**)
- `TEST…3D.BluRay.Half-OU…` (×2) — alt "half-ou" (**3D format; should be other/format**)
- `TEST…3D.BluRay.Half-SBS…` (×2) — alt "half" (**3D format**)
- `Hacksaw Ridge…& ATMOS…` — alt "&" (**junk punctuation**)
- `MASH.(1970).[Divx.5.02]…` — alt "5" (**codec version fragment**)
- `Dead Man Down…Custom NLSubs…` — alt "custom" (**release descriptor**)

### alternative_title / episode_title that is an episode/absolute number
- `Show!.Name.2.-.10.(2016)…` — alt "10" (duplicates `episode: 10`)
- `Show.Name.-.07.(2016)…` — alt "07" (episode)
- `Show.Name.-.476-479.(2007)…` — alt "476-479" (**absolute episodes**)
- `Show.Name.s10e15(233)…` — episode_title "233" (**absolute episode**)

### episode_title that is a tag / broadcaster / release credit
- `Bleach.s16e03-04.313-314-GROUP` — episode_title "group" (should be release_group; 313-314 absolute)
- `Show.Name.16x03-05.313-315-GROUP` — episode_title "group" (same)
- `Blue.Bloods…Obfuscated/afaae96…` — episode_title ["0e","ae7a","ced2a"] (**hash junk**)
- `Show Name 445 VOSTFR par Fansub-Resistance…` — episode_title "par fansub-resistance" (**release credit**)
- `Show Name S01e10[Mux…]` / `S02e19 [Mux…]` — episode_title "mux" (**container tag**)
- `Show.Name…Eng.Soft.Subtitles…` — episode_title "soft" (**"soft subtitles"**)
- `Show.Name…[Cap.112_114.Final]…` — episode_title "final" (episode_details)
- `[Ayako-Shikkaku]…[LQ]…` — episode_title "lq" (**low-quality tag**)
- `[ShinBunBu-Subs] Bleach - 02-03 (CX…)` — episode_title "cx" (**broadcaster tag**)

### title that absorbed junk tokens
- `From [WWW.TORRENTING.COM] - White.Rabbit.Project…` — title gains "from"
- `Show.Name.Part.1.and.Part.2.Blah-Group` — title gains "and","blah-group"
- `The.Arrival…MadVR…` — title gains "madvr"
- `Show-A (US) - Episode Title S02E09…` — title gains "episode title" (should be episode_title)
- `French Maid Services…SPLIT SCENES…` (×2) — title gains "split scenes" + phantom `language fra`

### episode_title given as a LIST with an extra fragment (`other:episode_title`)
- `Ep. 02 - Soul Hunter` — ["ep","soul hunter"] → "soul hunter"
- `NHL…Away.Feed…` — ["away feed", …]
- `NHL…Home.Feed…` — ["home feed", …]
- `Show.Name.1x01.eps1.0…By.Malaguita…` — ["by malaguita", …]
- `Show.Name.S04E21…German.Custom.Subbed…` — [title,"custom"]
- `Tales S01E08…BET WEBRip…` — [title,"bet"] (**broadcaster**)

### episode_details / release_group / version phantoms
- `Special.Correspondents.2016…` (×2) — phantom `episode_details "special"` (it's the movie title)
- `Ouija.Seance.The.Final.Game…` — phantom `episode_details "final"` ("The Final Game" is title)
- `03-Criminal.Minds.avi` — phantom `release_group "03"` (index prefix)
- `Westworld…[Season.2.Full]…` — `release_group "[season.2.full]"` (junk bracket)
- `We.Bare.Bears…Obfuscated/mxN…3PHD` — phantom `version 3` (from hash)

---

## KEEP — JS is more correct than Python (mark intentional)

### mimetype (26) — Python's values come from the host OS `/etc/mime.types`
All KEEP. Examples: `.srt`→"text/plain", `.ts`→"text/vnd.trolltech.linguist",
`.torrent`→"application/x-bittorrent", `.iso`→"application/x-iso9660-image",
`.sc`→"application/vnd.ibm.secure-container". These are environment-specific and
semantically wrong for media files; JS returning `undefined` is cleaner. Already
excluded from the "real" count in `pydiff.mjs`.
(Note: 4 of these inputs *also* carry a dup-language bug — fix those separately;
they're listed under FIX above.)

### Genuinely better parses
- `Masala…Telugu Movie…` — JS detects `language: tel` (**Telugu is a language**); Python misses it
- `PutaLocura…Spanish…` — JS detects `language: spa`; Python misses it
- `60.Minutes.2008…` — JS title "60 Minutes" (**correct show name**); Python drops "60" → "minutes"
- `TEST…HC.WEBRip…` — JS `other: "Hardcoded Subtitles"` (**HC = hardcoded, correct**); Python omits
- `Deadpool…UHD…` — JS `other` adds "Ultra HD" from UHD (reasonable); Python omits
- `[XCT].Le.Prestige.(The.Prestige)…` — alt "the prestige" (**legit English title**)
- `Battle.Royale.(Batoru.Rowaiaru)…` — alt "batoru rowaiaru" (**legit romaji title**)
- `A Bout Portant (The Killers)…` — alt "the killers" (**legit English title**)
- `PlayboyPlus.com_…` — JS extracts `website: playboyplus.com`; Python keeps it in title
- `Duckman - 101 (01)…` / `Duckman - 110 (10)…` — JS `absolute_episode` 1/10 (reasonable)
- `The Big Bang Theory S01E00…Unaired Pilot…` — JS episode_title "Unaired Pilot" (reasonable)

---

## NEUTRAL — debatable, no clear winner (decide later)

### Python's `season = <year>` quirk (year doubled as season)
JS omits it; arguably cleaner, but inconsistent — JS *does* emit it in some other
cases (e.g. `Annika…2012` → season 2012). Decide: drop year-as-season everywhere, or keep.
- `Show!.Name.2.-.10.(2016)` — `season: 2016` (py) vs none (js)
- `Show.Name.-.07.(2016)` — `season: 2016`
- `Show.Name.-.476-479.(2007)` — `season: 2007`

### Messy / both-wrong cases
- `11.22.63.106.hdtv-abc` — show "11.22.63": py `episode [11,22,63]`+`date 1963-11-22`; js `[11,22,6,63]`+title "06"
- `MacGyver…CD-ROM.and.Hoagie.Foil…Scrambled/…` — js partial episode_title "rom and hoagie foil"; py none
- `MotoGP.2016x03.USA.Race…` — js `country: us` + episode_title "race…"; py episode_title "usa race…"
- `Bunker Palace Hôtel (Enki Bilal)…` — the known accent case; alt "enki bilal" (js) vs "bunker palace hotel" (py)
- `Something…1&3-1to12ep` — py episode_title "1to12ep"; js `episode 12` + ["1to","ep"]
- `FooBar.7v3.PDTV` — js `version 3` + title "foobar 7"; py title "foobar 7v3"
- `555.S01…` — py `absolute_episode 555`; js `title "555"`
- `[GroupName]…02.5.(Special)` — py episode_title "5"; js "5 special"
- `[7.1.7.8.5] Foo Bar - 11 [5235532D]` — py `release_group "7.8.5"`; js none
- `BarFood christmas special HDTV` — title/type/episode_details disagreement
- `A.Common.Title.Special.2014` — js `episode_details "special"`; "Special" may be title
- `Cuerpo de Elite…desca202.mkv` — py episode_title "desca202"; js "p" (both poor)

---

## Suggested order of work (FIX bucket only)

1. **alternative_title / episode_title overlapping an episode number** (`10`, `07`,
   `476-479`, `233`) — a title field must not duplicate an episode. Likely one rule.
2. **dup-language** (12) — finish the duplicate/phantom language cleanup.
3. **alternative_title = director/edition/region** — the parenthetical/trailing-token
   handling that turns directors and labels into alt titles.
4. **episode_title = tag/broadcaster/credit** (`mux`, `bet`, `cx`, `lq`, `soft`, `group`).
5. **title absorbing junk** (`from`, `and`, `madvr`, `split scenes`).
6. **stray phantoms** (`version` from hash, `country` from "Au", `release_group` "03").
