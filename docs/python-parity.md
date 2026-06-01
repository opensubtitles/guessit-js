# Python ↔ JS parity — one-page status

How **guessit-js** differs from reference **Python guessit 3.8.0**, every case shown
in full `[filename]` + `key: <python> vs <js>` format so you can judge each yourself.
Grouped by verdict: ① TO FIX (we're wrong) · ② NEUTRAL (undecided) · ③ WON'T FIX
(we're already more correct). `»` lines are the proposed action / reason.

- Golden snapshot of Python output: `test/fixtures/python-reference.json` (1009 inputs)
- **This whole section is auto-generated** — regenerate with:
  `node --import tsx scripts/pydiff.mjs --verdicts`
  (verdicts live as data in `scripts/pydiff.mjs`; edit there, not here)
- Diff format: `key: <python value> vs <js value>`; `undefined` = absent on that side.
    ----
    Total diverging: 88  (known-OK skipped: 1)  of 1009 (vs Python 3.8.0)
    Real (excl. 11 env-specific mimetype): 77
    Verdicts: FIX 48 · NEUTRAL 12 · KEEP 28

```


############## ① TO FIX — guessit-js is wrong (48) ##############

===== episode_details / rg / version / country phantom =====
[-Special.Correspondents.2016.iTA.ENG.4K.2160p.NetflixUHD.TeamPremium.mp4]
    episode_details: undefined vs "special"
    » drop episode_details "special" (movie title)
[03-Criminal.Minds.avi]
    release_group: undefined vs "03"
    » drop release_group "03"
[Ouija.Seance.The.Final.Game.2018.1080p.WEB-DL.DD5.1.H264-CMRG]
    episode_details: undefined vs "final"
    » drop episode_details "final"
[Special.Correspondents.2016.iTA.ENG.4K.2160p.NetflixUHD.TeamPremium.mp4]
    episode_details: undefined vs "special"
    » drop episode_details "special" (movie title)
[We.Bare.Bears.S01E14.Brother.Up.1080p.WEB-DL.AAC2.0.H.264-TVSmash/mxNMuJWeO7PUWCMEwqKSsS6D8Vs9S6V3PHD.mkv]
    version: undefined vs 3
    » drop version 3 (from hash)
[[TorrentCouch.com].Westworld.S02.Complete.720p.WEB-DL.x264.[MP4].[5.3GB].[Season.2.Full]/[TorrentCouch.com].Westworld.S02E03.720p.WEB-DL.x264.mp4]
    release_group: undefined vs "[season.2.full]"
    » drop junk release_group "[season.2.full]"
[[nextorrent.org] Bienvenue.Au.Gondwana.2016.FRENCH.DVDRiP.XViD-AViTECH.avi]
    country: undefined vs "au"
    » drop country au (French "Au")

===== ep_title → list w/ stray fragment =====
[/mnt/NAS/NoSubsTVShows/Babylon 5/Season 01/Ep. 02 - Soul Hunter]
    episode_title: "soul hunter" vs ["ep","soul hunter"]
    » drop leading "ep"
[NHL.2015.10.09.Leafs.vs.Red.Wings.Condensed.Game.720p.Away.Feed.GC.WEBRip.AAC2.0.H.264-BTW]
    episode_title: "leafs vs red wings condensed game" vs ["away feed","leafs vs red wings condensed game"]
    » drop "away feed"
[NHL.2016.01.26.Maple.Leafs.vs.Panthers.720p.Home.Feed.GC.WEBRip.AAC2.0.H.264-BTW]
    episode_title: "maple leafs vs panthers" vs ["home feed","maple leafs vs panthers"]
    » drop "home feed"
[Show.Name.1x01.eps1.0.hellofriend.(HDiTunes.Ac3.Esp).(2015).By.Malaguita.avi]
    episode_title: "eps1 0 hellofriend" vs ["by malaguita","eps1 0 hellofriend"]
    » drop credit "by malaguita"
[Show.Name.S04E21.Aint.Nothing.Like.the.Real.Thing.German.Custom.Subbed.720p.HDTV.x264.iNTERNAL-BaCKToRG]
    episode_title: "aint nothing like the real thing" vs ["aint nothing like the real thing","custom"]
    » drop "custom"
[Tales S01E08 All I Need Method Man Featuring Mary J Blige 720p BET WEBRip AAC2 0 x264-RTN-xpost]
    episode_title: "all i need method man featuring mary j blige" vs ["all i need method man featuring mary j blige","bet"]
    » drop broadcaster "bet"

===== alt → label/edition/region/junk =====
[/share/Download/movie/Dead Man Down (2013) BRRiP XViD DD5_1 Custom NLSubs =-_lt Q_o_Q gt-=_/XD607ebb-BRc59935-5155473f-1c5f49/XD607ebb-BRc59935-5155473f-1c5f49.avi]
    alternative_title: undefined vs "custom"
    » release descriptor "custom" → drop
[Hacksaw Ridge 2016 Multi 2160p UHD BluRay Hevc10 HDR10 DTSHD & ATMOS 7.1 -DDR.mkv]
    alternative_title: undefined vs "&"
    » punctuation "&" → drop
[Heathers.1988.1080p.BluRay.ARROW.4K.RESTORED.Plus.Comm.DTS.x264-MaG]
    alternative_title: undefined vs ["arrow","plus comm"]
    » label "arrow" + "plus comm" → drop
[InDefinitely.Maybe.2008.1080p.EUR.BluRay.VC-1.DTS-HD.MA.5.1-FGT]
    alternative_title: undefined vs "eur"
    » region "eur" → drop
[Movies/M.A.S.H. (1970)/MASH.(1970).[Divx.5.02][Dual-Subtitulos][DVDRip].ogm]
    alternative_title: undefined vs "5"
    » codec-version "5" → drop
[Movies/Picnic.at.Hanging.Rock.1975.Criterion.Collection.1080p.BluRay.x264.DTS-WiKi]
    alternative_title: undefined vs "collection"
    » edition "collection" → drop
[Suicide Squad EXTENDED (2016) 2160p 4K UltraHD Blu-Ray x265 (HEVC 10bit BT709) Dolby Atmos 7.1 -DDR]
    alternative_title: undefined vs "bt"
    » colour-space "bt" (BT709) → drop
[The.Stranger.1946.US.(Kino.Classics).Bluray.1080p.LPCM.DD-2.0.x264-Grym@BTNET]
    alternative_title: undefined vs "kino classics"
    » label → drop

===== ep_title → tag/broadcaster/credit =====
[Bleach.s16e03-04.313-314-GROUP]
    release_group: "group" vs undefined
    episode_title: undefined vs "group"
    » "group" → release_group
[Blue.Bloods.S08E09.1080p.HEVC.x265-MeGusta-Obfuscated/afaae96ae7a140e0981ced2a79221751.mkv]
    episode_title: undefined vs ["0e","ae7a","ced2a"]
    » obfuscation hash → drop
[Show Name 445 VOSTFR par Fansub-Resistance (1280*720) - version MQ]
    episode_title: undefined vs "par fansub-resistance"
    » fansub credit → drop
[Show Name S01e10[Mux - 1080p - H264 - Ita Eng Ac3 - Sub Ita Eng]DLMux By GiuseppeTnT Littlelinx]
    episode_title: undefined vs "mux"
    » "mux" container tag → drop
[Show Name S02e19 [Mux - H264 - Ita Aac] DLMux by UBi]
    episode_title: undefined vs "mux"
    » "mux" container tag → drop
[Show.Name.(2013).Season.3.-.Eng.Soft.Subtitles.720p.WEBRip.x264.[MKV,AC3,5.1].Ehhhh]
    episode_title: undefined vs "soft"
    » "soft" → drop
[Show.Name.-.Tem.1.720p.HDTV.x264[Cap.112_114.Final]SPANISH.AUDIO-NEWPCT]
    episode_title: undefined vs "final"
    » "final" → drop
[Show.Name.16x03-05.313-315-GROUP]
    release_group: "group" vs undefined
    episode_title: undefined vs "group"
    » "group" → release_group
[[Ayako-Shikkaku] Oniichan no Koto Nanka Zenzen Suki Janain Dakara ne - 10 [LQ][h264][720p] [8853B21C]]
    episode_title: undefined vs "lq"
    » "lq" quality tag → drop
[[ShinBunBu-Subs] Bleach - 02-03 (CX 1280x720 x264 AAC)]
    episode_title: undefined vs "cx"
    » "cx" broadcaster → drop

===== phantom language =====
[Ejecutiva.En.Apuros(2009).BLURAY.SCR.Xvid.Spanish.LanzamientosD.nfo]
    language: "spa" vs ["eng","spa"]
    » drop phantom eng (from "En")
[Elle.s.en.va.720p.mkv]
    language: undefined vs "eng"
    » drop phantom eng
[Fear the Walking Dead - 01x02 - En Close, Yet En Far.REPACK-KILLERS.French.C.updated.Addic7ed.com.mkv]
    language: "fra" vs ["eng","eng","fra"]
    » drop phantom eng (from "En")
[Fear.the.Walking.Dead.-.Season.2.epi.02.XviD.Eng.Ac3-5.1.sub.ita.eng.iCV-MIRCrew]
    language: "eng" vs ["eng","eng"]
    » dedup eng
[French.Immersion.2011.STV.READNFO.QC.ENGLISH.NTSC.DVDR.nfo]
    language: "eng" vs ["eng","fra"]
    » drop phantom fra (from title "French")
[The_Italian_Job.mkv]
    language: undefined vs "ita"
    » drop phantom ita (from title "Italian")
[Underworld Quadrilogie VO+VFF+VFQ 1080p HDlight.x264~Tonyk~Monde Infernal]
    language: "fra" vs ["fra","fra"]
    » dedup fra (VFF+VFQ)

===== title absorbs junk =====
[French Maid Services - Lola At Your Service - Marc Dorcel WEB-DL SPLIT SCENES MP4-RARBG]
    title: "french maid services" vs ["french maid services","split scenes"]
    language: undefined vs "fra"
    » drop "split scenes" + phantom language fra
[French Maid Services - Lola At Your Service WEB-DL SPLIT SCENES MP4-RARBG]
    title: "french maid services" vs ["french maid services","split scenes"]
    language: undefined vs "fra"
    » drop "split scenes" + phantom language fra
[From [ WWW.TORRENTING.COM ] - White.Rabbit.Project.S01E08.1080p.NF.WEBRip.DD5.1.x264-ViSUM/White.Rabbit.Project.S01E08.1080p.NF.WEBRip.DD5.1.x264-ViSUM.mkv]
    title: "white rabbit project" vs ["from","white rabbit project"]
    » drop "from"
[Show-A (US) - Episode Title S02E09 hdtv]
    title: "show-a" vs ["episode title","show-a"]
    » "episode title" → episode_title
[Show.Name.Part.1.and.Part.2.Blah-Group]
    title: "show name" vs ["and","blah-group","show name"]
    » drop "and","blah-group"
[The.Arrival.4K.HDR.HEVC.10bit.BT2020.DTS.HD-MA-MadVR.HDR10.Dolby.Vision-VISIONPLUSHDR1000]
    title: "the arrival" vs ["madvr","the arrival"]
    » drop "madvr"

===== alt/ep_title → episode number =====
[Show!.Name.2.-.10.(2016).[HorribleSubs][WEBRip]..[HD.720p]]
    season: 2016 vs undefined
    alternative_title: undefined vs "10"
    » alt "10" duplicates episode 10 → drop
[Show.Name.-.07.(2016).[RH].[English.Dubbed][WEBRip]..[HD.1080p]]
    season: 2016 vs undefined
    alternative_title: undefined vs "07"
    » alt "07" → drop
[Show.Name.-.476-479.(2007).[HorribleSubs][WEBRip]..[HD.720p]]
    season: 2007 vs undefined
    alternative_title: undefined vs "476-479"
    » alt "476-479" → absolute_episode
[Show.Name.s10e15(233).480p.BDRip-AVC.Ukr.hurtom]
    episode_title: undefined vs "233"
    » episode_title "233" → absolute_episode


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
[A.Common.Title.Special.2014.avi]
    episode_details: undefined vs "special"
    » "Special" may be the title
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
[Something.Other.Season.1&3-1to12ep.avi]
    episode_title: "1to12ep" vs ["1to","ep"]
    episode: undefined vs 12
    » py "1to12ep" vs js episode 12 + ["1to","ep"]
[[7.1.7.8.5] Foo Bar - 11 (H.264) [5235532D].mkv]
    release_group: "7.8.5" vs undefined
    » py release_group "7.8.5" vs js none
[[GroupName].Show.Name.-.02.5.(Special).[BD.1080p]]
    episode_title: "5" vs "5 special"
    » py "5" vs js "5 special"


############## ③ WON'T FIX — guessit-js is already more correct (28) ##############

===== JS better — Python misses it =====
[60.Minutes.2008.12.14.HDTV.XviD-YT]
    title: "minutes" vs "60 minutes"
    » title "60 Minutes" (py drops the "60")
[Deadpool.2016.4K.2160p.UHD.HQ.8bit.BluRay.8CH.x265.HEVC-MZABI.mkv]
    other: "high quality" vs ["high quality","ultra hd"]
    » UHD → Ultra HD (py omits)
[Masala (2013) Telugu Movie HD DVDScr XviD - Exclusive.avi]
    language: undefined vs "tel"
    » Telugu detected (py misses)
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

----- category counts -----
  15  spurious-alternative_title
  14  spurious-episode_title
  11  mimetype
  10  title
   8  other:episode_title
   5  dup-language
   4  other:episode_details
   4  other:other
   4  language
   3  release_group
   2  other:absolute_episode
   2  other:other,streaming_service
   1  episode-range
   1  other:country,episode_title
   1  other:alternative_title
   1  other:episode,episode_title
   1  other:version
   1  other:country
----
Total diverging: 88  (known-OK skipped: 1)  of 1009 (vs Python 3.8.0)
Real (excl. 11 env-specific mimetype): 77
Verdicts: FIX 48 · NEUTRAL 12 · KEEP 28
```
