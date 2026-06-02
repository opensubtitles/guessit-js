# Python ↔ JS parity — one-page status

How **guessit-js** differs from reference **Python guessit 3.8.0**, every case shown
in full `[filename]` + `key: <python> vs <js>` format. Grouped by verdict: ① TO FIX
(we're wrong) · ② NEUTRAL (undecided) · ③ WON'T FIX (we're already more correct).
Auto-generated — regenerate with `node --import tsx scripts/pydiff.mjs --verdicts`.
    ----
    Total diverging: 47  (known-OK skipped: 1)  of 1009 (vs Python 3.8.0)
    Real (excl. 11 env-specific mimetype): 36
    Verdicts: FIX 0 · NEUTRAL 12 · KEEP 35

```


############## ① TO FIX — guessit-js is wrong (0) ##############


############## ② NEUTRAL — undecided (12) ##############

===== undecided =====
[/11.22.63/Season 1/11.22.63.106.hdtv-abc]
    episode: [11,22,63] vs [11,22,6,63]
    title: "06" vs undefined
    date: undefined vs "1963-11-22"
    » date-show "11.22.63"; both parse imperfectly
[555.S01.1080p.VMEO.WEBRip.AAC2.0.x264-BTN]
    absolute_episode: 555 vs undefined
    title: undefined vs "555"
    » py absolute_episode 555 vs js title "555"
[BarFood christmas special HDTV]
    title: "barfood christmas special" vs "barfood christmas"
    type: "movie" vs "episode"
    episode_details: undefined vs "special"
    episode_title: undefined vs "special"
    » title/type/episode_details disagreement
[Cuerpo de Elite  - Temporada 1 [HDTV 720p][Cap.113][AC3 5.1 Esp Castellano]\CuerpoDeElite720p_113_desca202.mkv]
    episode_title: "desca202" vs "p"
    » py episode_title "desca202" vs js "p"; both poor
[FooBar.7v3.PDTV-FlexGet]
    title: "foobar 7v3" vs "foobar 7"
    version: undefined vs 3
    » version 3 vs title "foobar 7v3"
[MacGyver.2016.S02E09.CD-ROM.and.Hoagie.Foil.1080p.AMZN.WEBRip.DDP5.1.x264-NTb-Scrambled/c329b27187d44a94b4a25b21502db552.mkv]
    episode_title: undefined vs "rom and hoagie foil"
    » obfuscated; js partial episode_title, py none
[MotoGP.2016x03.USA.Race.BTSportHD.1080p25]
    episode_title: "usa race btsporthd" vs "race btsporthd"
    country: undefined vs "us"
    » js country US vs py "usa race…"
[Movies/Bunker Palace Hôtel (Enki Bilal) (1989)/Enki Bilal - Bunker Palace Hotel (Fr Vhs Rip).avi]
    alternative_title: "bunker palace hotel" vs "enki bilal"
    » accent case (also the 1 JS↔WASM diff)
[Show.Name.s10e15(233).480p.BDRip-AVC.Ukr.hurtom]
    episode_title: undefined vs "233"
    » js episode_title "233" (the absolute number) vs py drops it
[Something.Other.Season.1&3-1to12ep.avi]
    episode_title: "1to12ep" vs ["1to","ep"]
    episode: undefined vs 12
    » py "1to12ep" vs js episode 12 + ["1to","ep"]
[[7.1.7.8.5] Foo Bar - 11 (H.264) [5235532D].mkv]
    release_group: "7.8.5" vs undefined
    » py release_group "7.8.5" vs js none
[[GroupName].Show.Name.-.02.5.(Special).[BD.1080p]]
    episode_title: "5" vs undefined
    » py "5" vs js "5 special"


############## ③ WON'T FIX — guessit-js is already more correct (35) ##############

===== JS better — Python misses it =====
[/Show Name S2/[Group].Show.Name.S2.-.19.[1080p]]
    episode_title: "19" vs undefined
    episode: undefined vs 19
    » anime "S2 - 19" → episode 19 (Python leaves episode_title "19")
[/Show.Name.S2/[Group].Show.Name.S2.-.19.[1080p]]
    episode_title: "19" vs undefined
    episode: undefined vs 19
    » anime "S2 - 19" → episode 19 (Python leaves episode_title "19")
[60.Minutes.2008.12.14.HDTV.XviD-YT]
    title: "minutes" vs "60 minutes"
    » title "60 Minutes" (py drops the "60")
[Deadpool.2016.4K.2160p.UHD.HQ.8bit.BluRay.8CH.x265.HEVC-MZABI.mkv]
    other: "high quality" vs ["high quality","ultra hd"]
    » UHD → Ultra HD (py omits)
[Masala (2013) Telugu Movie HD DVDScr XviD - Exclusive.avi]
    language: undefined vs "tel"
    » Telugu detected (py misses)
[Outrageous.Acts.of.Science.S05E02.Is.This.for.Real.720p.HDTV.x264-DHD]
    episode_title: "is this for" vs "is this for real"
    other: "proper" vs undefined
    proper_count: 2 vs undefined
    » episode_title "Is This for Real" kept; Python truncates at a phantom Proper(real)
[PlayboyPlus.com_16.01.23.Eleni.Corfiate.Playboy.Romania.XXX.iMAGESET-OHRLY]
    title: "playboyplus com" vs undefined
    website: undefined vs "playboyplus.com"
    » website extracted (py keeps in title)
[PutaLocura.15.12.22.Spanish.Luzzy.XXX.720p.MP4-oRo]
    language: undefined vs "spa"
    » Spanish detected (py misses)
[Series/Duckman/Duckman - 101 (01) - 20021107 - I, Duckman.avi]
    absolute_episode: undefined vs 1
    » absolute_episode detected
[Series/Duckman/Duckman - 110 (10) - 20021218 - Cellar Beware.avi]
    absolute_episode: undefined vs 10
    » absolute_episode detected
[TEST.2015.1080p.3D.BluRay.Half-OU.x264.DTS-HD.MA.7.1-ABC]
    other: "3d" vs ["3d","half ou"]
    » stereoscopic 3D "Half OU" (py drops)
[TEST.2015.1080p.3D.BluRay.Half-OU.x264.DTS-HD.MA.TrueHD.7.1.Atmos-ABC]
    other: "3d" vs ["3d","half ou"]
    » stereoscopic 3D "Half OU" (py drops)
[TEST.2015.1080p.3D.BluRay.Half-SBS.x264.DTS-HD.MA.7.1-ABC]
    other: "3d" vs ["3d","half sbs"]
    streaming_service: "sbs" vs undefined
    » stereoscopic 3D "Half SBS" (py drops)
[TEST.2015.1080p.3D.BluRay.Half-SBS.x264.DTS-HD.MA.TrueHD.7.1.Atmos-ABC]
    other: "3d" vs ["3d","half sbs"]
    streaming_service: "sbs" vs undefined
    » stereoscopic 3D "Half SBS" (py drops)
[TEST.2015.1080p.HC.WEBRip.x264.AAC2.0-ABC]
    other: "rip" vs ["hardcoded subtitles","rip"]
    » HC = Hardcoded Subtitles (py omits)
[The Big Bang Theory S01E00 PROPER Unaired Pilot TVRip XviD-GIGGITY]
    episode_title: undefined vs "unaired pilot"
    » episode_title "Unaired Pilot"
[[Group].Show.Name.S2.-.19.[1080p]]
    episode_title: "19" vs undefined
    episode: undefined vs 19
    » anime "S2 - 19" → episode 19 (Python leaves episode_title "19")

===== legit alternative title (verified) =====
[A Bout Portant (The Killers).PAL.Multi.DVD-R-KZ]
    alternative_title: undefined vs "the killers"
    » "À bout portant" 1964 = "The Killers"
[Battle Royale (2000)/Battle.Royale.(Batoru.Rowaiaru).(2000).(Special.Edition).CD1of2.DVDRiP.XviD-[ZeaL].avi]
    alternative_title: undefined vs "batoru rowaiaru"
    » Japanese romaji of "Battle Royale"
[Youth.In.Revolt.(Be.Bad).2009.MULTI.1080p.LAME3*92-MEDIOZZ]
    alternative_title: undefined vs "be bad"
    » "Be Bad!" French/intl release title
[[XCT].Le.Prestige.(The.Prestige).DVDRip.[x264.HP.He-Aac.{Fr-Eng}.St{Fr-Eng}.Chaps].mkv]
    alternative_title: undefined vs "the prestige"
    » English original of "Le Prestige"

===== mimetype (OS-specific /etc/mime.types) =====
[Bad Boys 2 1080i.mpg2.rus.eng.ts]
    mimetype: "text/vnd.trolltech.linguist" vs "video/mp2t"
    » Python value is env-specific/bogus; JS undefined or correct
[Game of Thrones S03E06 1080i HDTV DD5.1 MPEG2-TrollHD.ts]
    mimetype: "text/vnd.trolltech.linguist" vs "video/mp2t"
    » Python value is env-specific/bogus; JS undefined or correct
[Its.A.Wonderful.Life.1946.Colorized.720p.BRRip.999MB.MkvCage.com]
    mimetype: "application/x-msdos-program" vs undefined
    » Python value is env-specific/bogus; JS undefined or correct
[Justin Timberlake - MTV Video Music Awards 2013 1080i 32 Mbps DTS-HD 5.1.ts]
    mimetype: "text/vnd.trolltech.linguist" vs "video/mp2t"
    » Python value is env-specific/bogus; JS undefined or correct
[Katy Perry - Pepsi & Billboard Summer Beats Concert Series 2012 1080i HDTV 20 Mbps DD2.0 MPEG2-TrollHD.ts]
    mimetype: "text/vnd.trolltech.linguist" vs "video/mp2t"
    » Python value is env-specific/bogus; JS undefined or correct
[Show.Name.S01.Season.Complet.WEBRiP.Ro.Subbed.TM]
    mimetype: "text/texmacs" vs undefined
    » Python value is env-specific/bogus; JS undefined or correct
[Show.Name.S01E03.HDTV.Subtitulado.Esp.SC]
    mimetype: "application/vnd.ibm.secure-container" vs undefined
    » Python value is env-specific/bogus; JS undefined or correct
[Show.Name.S01E03.HDTV.Subtitulado.Espanol.SC]
    mimetype: "application/vnd.ibm.secure-container" vs undefined
    » Python value is env-specific/bogus; JS undefined or correct
[Show.Name.S01E03.HDTV.Subtitulado.Español.SC]
    mimetype: "application/vnd.ibm.secure-container" vs undefined
    » Python value is env-specific/bogus; JS undefined or correct
[Show.Name.S03.1080p.BlurayMUX.AVC.DTS-HD.MA]
    mimetype: "application/mathematica" vs undefined
    » Python value is env-specific/bogus; JS undefined or correct
[Show.Name.S06E05.1080p.WEBRip.Legendado.PT]
    mimetype: "application/vnd.snesdev-page-table" vs undefined
    » Python value is env-specific/bogus; JS undefined or correct

===== JS better — Python year→season bug =====
[Show!.Name.2.-.10.(2016).[HorribleSubs][WEBRip]..[HD.720p]]
    season: 2016 vs undefined
    » numeric alt dropped; py reads 2016 as season
[Show.Name.-.07.(2016).[RH].[English.Dubbed][WEBRip]..[HD.1080p]]
    season: 2016 vs undefined
    » numeric alt dropped; py reads 2016 as season
[Show.Name.-.476-479.(2007).[HorribleSubs][WEBRip]..[HD.720p]]
    season: 2007 vs undefined
    » numeric alt dropped; py reads 2007 as season

----- category counts -----
  11  mimetype
   4  other:episode,episode_title
   4  title
   4  spurious-alternative_title
   4  spurious-episode_title
   4  other:other
   3  season
   2  other:episode_title
   2  language
   2  other:absolute_episode
   2  other:other,streaming_service
   1  episode-range
   1  other:country,episode_title
   1  other:alternative_title
   1  other:episode_title,other,proper_count
   1  release_group
----
Total diverging: 47  (known-OK skipped: 1)  of 1009 (vs Python 3.8.0)
Real (excl. 11 env-specific mimetype): 36
Verdicts: FIX 0 · NEUTRAL 12 · KEEP 35
```
