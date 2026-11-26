# Python ↔ JS parity — measured, not asserted

Every name in the fixture corpus run through both parsers and compared field
by field. Regenerate with `scripts/python-diff.mts` (usage in its header);
languages compare as alpha3, since Python's encoder writes their English names.

- **2253 of 2609 inputs identical** (86.4%)
- **356 differ**: 206 pinned — a fixture of ours asserts the differing field itself,
  29 in `test/fixtures/upstream-rules-pending.yml` (tracked backlog),
  121 untested — the name is in our corpus but the differing field is not asserted,
  0 unexamined — the name is not in our corpus at all

Differing fields, most frequent first:

| Field | Inputs |
|---|---|
| `title` | 106 |
| `mimetype` | 79 |
| `episode` | 69 |
| `season` | 68 |
| `episode_title` | 60 |
| `release_group` | 57 |
| `alternative_title` | 52 |
| `type` | 37 |
| `language` | 30 |
| `other` | 18 |
| `subtitle_language` | 18 |
| `year` | 17 |
| `source` | 14 |
| `date` | 11 |
| `streaming_service` | 9 |
| `video_codec` | 9 |
| `episode_details` | 6 |
| `bonus` | 4 |
| `container` | 4 |
| `audio_codec` | 4 |
| `edition` | 4 |
| `absolute_episode` | 3 |
| `screen_size` | 3 |
| `country` | 3 |
| `audio_channels` | 2 |
| `volume` | 2 |
| `proper_count` | 2 |
| `uuid` | 1 |
| `part` | 1 |
| `version` | 1 |
| `website` | 1 |

## Untested (121)

The name is in our corpus, but no fixture asserts the field that differs — so the JS value here is incidental, not a decision. These are where a real divergence could be hiding.

`[7.1.7.8.5] Foo Bar - 11 (H.264) [5235532D].mkv`
  - `release_group`: python `"7.8.5"` · js `undefined`

`[CMS] Magical☆Star Kanon 100% OVA[DVD][E9F43685].mkv`
  - `release_group`: python `"DVD"` · js `"CMS"`
  - `source`: python `undefined` · js `"DVD"`

`[Deep] Tegami Bachi (REVERSE) - Letter Bee - 29 (04) [E56A4C7B].mkv`
  - `episode_title`: python `"Letter Bee - 29"` · js `"REVERSE"`
  - `alternative_title`: python `undefined` · js `"Letter Bee"`

`[Erai-raws] Show Name - 02 [720p][Multi].srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`[GroupName].Show.Name.-.02.5.(Special).[BD.1080p]`
  - `episode_title`: python `"5"` · js `undefined`

`[Grp] Some Heroine Maid desu (Proud)! - S01E04 [1080p].mkv`
  - `episode_title`: python `"!"` · js `"Proud"`

`[Hatsuyuki] Dragon Ball Kai (2014) - 002 (100) [1280x720][DD66AFB7].mkv`
  - `season`: python `2014` · js `undefined`

`[SubsPlease] Fairy Tail - 100 Years Quest - 05 (1080p) [1107F3A9].mkv`
  - `title`: python `"Fairy Tail"` · js `"Fairy Tail - 100 Years Quest"`
  - `episode_title`: python `"100 Years Quest"` · js `undefined`

`[XCT].Le.Prestige.(The.Prestige).DVDRip.[x264.HP.He-Aac.{Fr-Eng}.St{Fr-Eng}.Chaps].mkv`
  - `alternative_title`: python `undefined` · js `"The Prestige"`

`1080`
  - `season`: python `10` · js `undefined`
  - `episode`: python `80` · js `1080`

`13 days 13 nights - 13 Days 13 Nights (2025).mkv`
  - `alternative_title`: python `"13 Days 13 Nights"` · js `undefined`

`1919`
  - `year`: python `1919` · js `undefined`
  - `title`: python `undefined` · js `"1919"`

`2015.01.31`
  - `season`: python `2015` · js `undefined`
  - `episode`: python `1` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`

`2030`
  - `year`: python `2030` · js `undefined`
  - `title`: python `undefined` · js `"2030"`

`2160`
  - `season`: python `21` · js `undefined`
  - `episode`: python `60` · js `2160`

`555.S01.1080p.VMEO.WEBRip.AAC2.0.x264-BTN`
  - `absolute_episode`: python `555` · js `undefined`
  - `title`: python `undefined` · js `"555"`

`A Bout Portant (The Killers).PAL.Multi.DVD-R-KZ`
  - `alternative_title`: python `undefined` · js `"The Killers"`

`AAC`
  - `mimetype`: python `undefined` · js `"audio/aac"`

`Annika.Bengtzon.2012.E01.Le.Testament.De.Nobel.FRENCH.DVDRiP.XViD-STVFRV.avi`
  - `season`: python `2012` · js `undefined`

`Another Film Title-f01-Series Title.mkv`
  - `alternative_title`: python `undefined` · js `"Series Title"`

`Apollo 18 Temporada 2`
  - `episode`: python `18` · js `undefined`

`Avengers.Infinity.War.2018.3D.Hybrid.REPACK.1080p.BluRay.REMUX.AVC.Atmos-EPSiLON.mk3d`
  - `mimetype`: python `undefined` · js `"video/x-matroska"`

`avi`
  - `mimetype`: python `undefined` · js `"video/x-msvideo"`

`Bad Boys 2 1080i.mpg2.rus.eng.ts`
  - `mimetype`: python `"text/vnd.trolltech.linguist"` · js `"video/mp2t"`

`Battle Royale (2000)/Battle.Royale.(Batoru.Rowaiaru).(2000).(Special.Edition).CD1of2.DVDRiP.XviD-[ZeaL].avi`
  - `alternative_title`: python `undefined` · js `"Batoru Rowaiaru"`

`Bones.S12E02.The.Brain.In.The.Bot.1080p.WEB-DL.DD5.1.H.264-R2D2/161219_06.mkv`
  - `date`: python `undefined` · js `"2016-12-19"`

`cam.rip`
  - `mimetype`: python `"audio/vnd.rip"` · js `undefined`

`D:\TV\SITCOMS (CLASSIC)\That '70s Show\Season 07\That '70s Show - S07E22 - 2000 Light Years from Home.mkv`
  - `release_group`: python `"CLASSIC"` · js `undefined`

`Despicable.Me.2.2013.1080p.BluRay.x264-VeDeTT.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Dexter Saison sept FRENCH.BDRip.XviD-MiND.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Dexter Saison VII FRENCH.BDRip.XviD-MiND.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Django Unchained 2012 DVDSCR X264 AAC-P2P.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Dr.No.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`DTS-ES`
  - `language`: python `"spa"` · js `undefined`

`DTS-HD.HR`
  - `other`: python `undefined` · js `"High Resolution"`

`DTSHD.HR`
  - `other`: python `undefined` · js `"High Resolution"`

`Ejecutiva.En.Apuros(2009).BLURAY.SCR.Xvid.Spanish.LanzamientosD.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Flac`
  - `mimetype`: python `undefined` · js `"audio/flac"`

`frasier.s8e6-768660.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`French.Immersion.2011.STV.READNFO.QC.ENGLISH.NTSC.DVDR.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Fullmetal_Alchemist_Brotherhood_ED2v2_Clean_[BD_1080p][AtsA][0F81F8F7].mkv`
  - `episode_title`: python `"Clean"` · js `undefined`

`Game of Thrones S03E06 1080i HDTV DD5.1 MPEG2-TrollHD.ts`
  - `mimetype`: python `"text/vnd.trolltech.linguist"` · js `"video/mp2t"`

`Garfield.It.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`gossip.girl.s01e18.hdtv.xvid-2hd.eng.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`HD-Cam.rip`
  - `mimetype`: python `"audio/vnd.rip"` · js `undefined`

`Hd.Ts`
  - `mimetype`: python `"text/vnd.trolltech.linguist"` · js `"video/mp2t"`

`HD.TS`
  - `mimetype`: python `"text/vnd.trolltech.linguist"` · js `"video/mp2t"`

`Hostages.S01E01.Pilot.for.Air.720p.WEB-DL.DD5.1.H.264-NTb.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Immersion.French.2011.STV.READNFO.QC.FRENCH.ENGLISH.NTSC.DVDR.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Immersion.French.2011.STV.READNFO.QC.FRENCH.NTSC.DVDR.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Immersion.French.2011.STV.READNFO.QC.NTSC.DVDR.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Its.A.Wonderful.Life.1946.Colorized.720p.BRRip.999MB.MkvCage.com`
  - `mimetype`: python `"application/x-msdos-program"` · js `undefined`

`Justin Timberlake - MTV Video Music Awards 2013 1080i 32 Mbps DTS-HD 5.1.ts`
  - `mimetype`: python `"text/vnd.trolltech.linguist"` · js `"video/mp2t"`

`Katy Perry - Pepsi & Billboard Summer Beats Concert Series 2012 1080i HDTV 20 Mbps DD2.0 MPEG2-TrollHD.ts`
  - `mimetype`: python `"text/vnd.trolltech.linguist"` · js `"video/mp2t"`

`Katy Perry - Pepsi & Billboard Summer Beats Concert Series 2012 1080i HDTV 20 Mbps DD2.0 MPEG2-TrollHD.ts`
  - `mimetype`: python `"text/vnd.trolltech.linguist"` · js `"video/mp2t"`

`Le.Prestige[x264.{Fr-Eng}.St{Fr-Eng}.Chaps].mkv`
  - `video_codec`: python `undefined` · js `"H.264"`

`Masala (2013) Telugu Movie HD DVDScr XviD - Exclusive.avi`
  - `language`: python `undefined` · js `"tel"`

`Mind.Field.S02E06.The.Power.of.Suggestion.1440p.H264.WEBDL.Subtitles/The Power of Suggestion - Mind Field S2 (Ep 6) (1440p_24fps_H264-384kbit_AAC 6Ch).mp4`
  - `episode_title`: python `"The Power of Suggestion"` · js `undefined`

`Mind.Field.S02E06.The.Power.of.Suggestion.1440p.H264.WEBDL.Subtitles/The Power of Suggestion - Mind Field S2 (Ep 6) (English).srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Mind.Field.S02E06.The.Power.of.Suggestion.1440p.H264.WEBDL.Subtitles/The Power of Suggestion - Mind Field S2 (Ep 6) (Korean).srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`mkv`
  - `mimetype`: python `undefined` · js `"video/x-matroska"`

`MotoGP.2016x03.USA.Race.BTSportHD.1080p25`
  - `episode_title`: python `"USA Race BTSportHD"` · js `"Race BTSportHD"`
  - `country`: python `undefined` · js `"US"`

`Movie.2020.1080p.BluRay.x264-GRP.fre.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Movie.2020.1080p.BluRay.x264-GRP.ger.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Movie.2020.1080p.BluRay.x264-GRP.hi.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Movie.2024.1080p/sub/Movie.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Movies/Bunker Palace Hôtel (Enki Bilal) (1989)/Enki Bilal - Bunker Palace Hotel (Fr Vhs Rip).avi`
  - `release_group`: python `"Enki Bilal"` · js `undefined`
  - `alternative_title`: python `"Bunker Palace Hotel"` · js `"Enki Bilal"`

`Movies/Ratatouille/video_ts-ratatouille.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`MP3`
  - `mimetype`: python `undefined` · js `"audio/mpeg"`

`PlayboyPlus.com_16.01.23.Eleni.Corfiate.Playboy.Romania.XXX.iMAGESET-OHRLY`
  - `title`: python `"PlayboyPlus com"` · js `undefined`
  - `website`: python `undefined` · js `"PlayboyPlus.com"`

`PutaLocura.15.12.22.Spanish.Luzzy.XXX.720p.MP4-oRo`
  - `language`: python `undefined` · js `"spa"`

`Re ZERO -Starting Life in Another World- Season 2 - 15 [1080p].mkv`
  - `title`: python `"Re ZERO"` · js `"Re ZERO -Starting Life in Another World"`
  - `alternative_title`: python `"Starting Life in Another World"` · js `undefined`

`S01D02.3-5-GROUP`
  - `title`: python `"GROUP"` · js `"S01D02.3-5-GROUP"`

`s01e02 - nl - some show (2022) (be) - s01e02 - aflevering 2.strm`
  - `release_group`: python `"be"` · js `undefined`

`s01e04 - nl- some show (2024) (be) - s01e04 - aflevering 4.strm`
  - `release_group`: python `"be"` · js `undefined`

`S07E06 Some Episode - AV1 1080p GRP.mkv`
  - `episode_title`: python `"AV1"` · js `undefined`
  - `video_codec`: python `undefined` · js `"AV1"`

`Series/Duckman/Duckman - 101 (01) - 20021107 - I, Duckman.avi`
  - `absolute_episode`: python `undefined` · js `1`

`Series/Duckman/Duckman - 110 (10) - 20021218 - Cellar Beware.avi`
  - `absolute_episode`: python `undefined` · js `10`

`series/Freaks And Geeks/Season 1/Episode 4 - Kim Kelly Is My Friend-eng(1).srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`series/Psych/Psych S02 Season 2 Complete English DVD/Psych.S02E03.Psy.Vs.Psy.Français.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Show!.Name.2.-.10.(2016).[HorribleSubs][WEBRip]..[HD.720p]`
  - `season`: python `2016` · js `undefined`

`Show.Name.-.07.(2016).[RH].[English.Dubbed][WEBRip]..[HD.1080p]`
  - `season`: python `2016` · js `undefined`

`Show.Name.-.476-479.(2007).[HorribleSubs][WEBRip]..[HD.720p]`
  - `season`: python `2007` · js `undefined`

`Show.Name.E02.2010`
  - `season`: python `2010` · js `undefined`

`Show.Name.E02.2010.mkv`
  - `season`: python `2010` · js `undefined`

`Show.Name.S01.Season.Complet.WEBRiP.Ro.Subbed.TM`
  - `mimetype`: python `"text/texmacs"` · js `undefined`

`Show.Name.S01E01.720p.HDTV.x264-GRP.rar`
  - `mimetype`: python `"application/vnd.rar"` · js `"application/x-rar-compressed"`

`Show.Name.S01E02.1080p-NINJA.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Show.Name.S01E03.HDTV.Subtitulado.Esp.SC`
  - `mimetype`: python `"application/vnd.ibm.secure-container"` · js `undefined`

`Show.Name.S01E03.HDTV.Subtitulado.Espanol.SC`
  - `mimetype`: python `"application/vnd.ibm.secure-container"` · js `undefined`

`Show.Name.S01E03.HDTV.Subtitulado.Español.SC`
  - `mimetype`: python `"application/vnd.ibm.secure-container"` · js `undefined`

`Show.Name.S01E07.Super, Title.WEB-DL 720p.br.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Show.Name.S02E01.Super.Title.720p.WEB-DL.DD5.1.H.264-ABC.nzb`
  - `mimetype`: python `undefined` · js `"application/x-nzb"`

`Show.Name.S03.1080p.BlurayMUX.AVC.DTS-HD.MA`
  - `mimetype`: python `"application/mathematica"` · js `undefined`

`Show.Name.S06E05.1080p.WEBRip.Legendado.PT`
  - `mimetype`: python `"application/vnd.snesdev-page-table"` · js `undefined`

`Show.Name.s10e15(233).480p.BDRip-AVC.Ukr.hurtom`
  - `episode_title`: python `undefined` · js `"233"`

`Some Name 2 (Other Name- Chapter 2) (2017) - [1080p WEB-DL AVC] {SK AAC 2.0}.mkv`
  - `alternative_title`: python `undefined` · js `"Other Name- Chapter 2"`

`Some Saga (5) Second Part CZ dabing 1080p 2007.mkv`
  - `alternative_title`: python `"Second Part"` · js `["5","Second Part"]`
  - `release_group`: python `"dabing"` · js `undefined`

`some show - ep. 18 - some title (1998 - 480p dvdrip)`
  - `season`: python `1998` · js `undefined`

`Some Show (1995) - S01E01 - Pilot (1080p WEB-DL x264 8bit AAC 2.0 GRP).svt_av1.mkv`
  - `video_codec`: python `"H.264"` · js `["H.264","AV1"]`
  - `release_group`: python `"GRP).svt_av1"` · js `"GRP).svt"`

`Some Show (2016) - 07.mkv`
  - `season`: python `2016` · js `undefined`

`Some Show (BBC) TV Series S2E4 The Episode.mkv`
  - `episode_title`: python `"TV Series"` · js `"The Episode"`
  - `alternative_title`: python `undefined` · js `"TV Series"`

`Some.Movie.2020.en.srt`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Some.Release.2020.1080p.x264-GRP.ace`
  - `mimetype`: python `undefined` · js `"application/x-ace-compressed"`

`Some.Release.2020.1080p.x264-GRP.cb7`
  - `mimetype`: python `undefined` · js `"application/x-cbr"`

`Some.Release.2020.1080p.x264-GRP.cbr`
  - `mimetype`: python `"application/vnd.comicbook-rar"` · js `"application/x-cbr"`

`Some.Release.2020.1080p.x264-GRP.cbz`
  - `mimetype`: python `"application/vnd.comicbook+zip"` · js `"application/x-cbr"`

`Some.Release.2020.1080p.x264-GRP.webp`
  - `mimetype`: python `undefined` · js `"image/webp"`

`Some.Title.XViD-by.Artik[SEDG].avi`
  - `alternative_title`: python `undefined` · js `["by Artik","SEDG"]`

`Space Battleship Yamato 2199 (2012) episode 18`
  - `season`: python `2012` · js `undefined`

`Special`
  - `title`: python `"Special"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `episode_details`: python `undefined` · js `"Special"`

`srt`
  - `mimetype`: python `undefined` · js `"application/x-subrip"`

`Studio 60 Сезон 5 1080p`
  - `episode`: python `60` · js `undefined`

`ts`
  - `mimetype`: python `undefined` · js `"video/mp2t"`

`TS`
  - `mimetype`: python `undefined` · js `"video/mp2t"`

`VHS.RIP`
  - `mimetype`: python `"audio/vnd.rip"` · js `undefined`

`VHS.RIP`
  - `mimetype`: python `"audio/vnd.rip"` · js `undefined`

`x265`
  - `bonus`: python `265` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `title`: python `undefined` · js `"x265"`

`XVID.NTSC.DVDR.nfo`
  - `mimetype`: python `undefined` · js `"text/x-nfo"`

`Youth.In.Revolt.(Be.Bad).2009.MULTI.1080p.LAME3*92-MEDIOZZ`
  - `alternative_title`: python `undefined` · js `"Be Bad"`

`Zoo.S02E05.1080p.WEB-DL.DD5.1.H.264.HKD/160725_02.mkv`
  - `date`: python `undefined` · js `"2016-07-25"`

## Unexamined (0)

No fixture of ours covers these and they are not in the backlog file. Each needs a verdict: adopt Python, or pin ours with a fixture that says why.

## Tracked backlog (29)

Parked in `test/fixtures/upstream-rules-pending.yml`, which is deliberately absent from `FIXTURE_FILES`. See `docs/upstream-issues.md` for the gap/divergence split.

`(1920)`
  - `year`: python `1920` · js `undefined`
  - `title`: python `undefined` · js `"1920"`

`[Deep] Tegami Bachi (REVERSE) - Letter Bee - 29 (04) test`
  - `episode_title`: python `"Letter Bee - 29"` · js `"test"`
  - `alternative_title`: python `undefined` · js `"Letter Bee"`

`[Golumpa] Star Blazers 2202 - 22 (a.k.a. Yamato 2022) whatever`
  - `season`: python `2022` · js `undefined`

`[Hatsuyuki] Dragon Ball Kai (2014) - 002 (100) test`
  - `season`: python `2014` · js `undefined`

`[SubsPlease] Fairy Tail - 100 Years Quest - 05 (1080p)`
  - `title`: python `"Fairy Tail"` · js `"Fairy Tail - 100 Years Quest"`
  - `alternative_title`: python `"100 Years Quest"` · js `undefined`

`2012`
  - `year`: python `2012` · js `undefined`
  - `title`: python `undefined` · js `"2012"`

`2029`
  - `year`: python `2029` · js `undefined`
  - `title`: python `undefined` · js `"2029"`

`Cam`
  - `source`: python `"Camera"` · js `undefined`
  - `title`: python `undefined` · js `"Cam"`

`Cam_Rip`
  - `source`: python `"Camera"` · js `undefined`

`CamRip`
  - `source`: python `"Camera"` · js `undefined`

`Complete`
  - `title`: python `"Complete"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `other`: python `undefined` · js `"Complete"`

`Movie.AAC.2.0.2008`
  - `audio_channels`: python `"2.0"` · js `undefined`

`Show 12 - 24`
  - `title`: python `"Show"` · js `"Show 12"`
  - `episode`: python `[12,24]` · js `24`

`Show.Name.Season.4.Episodes.1-12`
  - `episode`: python `[1,2,3,4,5,6,7,8,9,10,11,12]` · js `1`
  - `release_group`: python `undefined` · js `"12"`

`Show.S01E01.DBRETAiL.no.srt`
  - `episode_title`: python `"DBRETAiL"` · js `"DBRETAiL no"`
  - `subtitle_language`: python `"nor"` · js `undefined`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Show.S01E01.Some.Title.it.srt`
  - `episode_title`: python `"Some Title"` · js `"Some Title it"`
  - `subtitle_language`: python `"ita"` · js `undefined`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`

`Some Dummy Directory/S02 Some Series/E01-Episode title.mkv`
  - `title`: python `"Some Series"` · js `"Some Dummy Directory"`
  - `episode_title`: python `"Episode title"` · js `"Some Series"`

`Some Dummy Directory/Season 02/Some Series-E01-Episode title.mkv`
  - `title`: python `"Some Series"` · js `"Some Dummy Directory"`
  - `episode_title`: python `"Episode title"` · js `["Some Series","Episode title"]`

`Some Dummy Directory/Season 02/Some Series-E01.mkv`
  - `title`: python `"Some Series"` · js `"Some Dummy Directory"`
  - `episode_title`: python `undefined` · js `"Some Series"`

`Some Series E01 02 03`
  - `episode`: python `[1,2,3]` · js `1`
  - `episode_title`: python `undefined` · js `"02 03"`

`Some Series E01 02 04`
  - `episode`: python `[1,2,4]` · js `1`
  - `episode_title`: python `undefined` · js `"02 04"`

`Some Series S01 02 03`
  - `season`: python `[1,2,3]` · js `1`
  - `episode_title`: python `undefined` · js `"02 03"`

`Something 1 x 2-FlexGet`
  - `episode_title`: python `"FlexGet"` · js `undefined`
  - `release_group`: python `undefined` · js `"FlexGet"`

`Something.2.5.2007`
  - `title`: python `"Something"` · js `"Something 2.5"`
  - `date`: python `"2007-05-02"` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `year`: python `undefined` · js `2007`

`STFr`
  - `subtitle_language`: python `"fra"` · js `undefined`
  - `title`: python `undefined` · js `"STFr"`

`SubFr`
  - `subtitle_language`: python `"fra"` · js `undefined`
  - `title`: python `undefined` · js `"SubFr"`

`SubFrench`
  - `subtitle_language`: python `"fra"` · js `undefined`
  - `title`: python `undefined` · js `"SubFrench"`

`The complete movie`
  - `title`: python `"The complete movie"` · js `"movie"`
  - `type`: python `"movie"` · js `"episode"`
  - `other`: python `undefined` · js `"Complete"`

`UHD HQ 8bit Bluray`
  - `other`: python `"High Quality"` · js `["Ultra HD","High Quality"]`
  - `source`: python `"Ultra HD Blu-ray"` · js `"Blu-ray"`

## Pinned — deliberate (206)

A fixture of ours asserts the JS value and passes, so the difference is a decision this port has already made and tests. Grounds are in `CHANGELOG.md` and `docs/upstream-issues.md`.

`"1670" Rise of Something`
  - `title`: python `"\"1670\" Rise of Something"` · js `"1670"`
  - `type`: python `"movie"` · js `"episode"`
  - `episode_title`: python `undefined` · js `"Rise of Something"`

`"30 Show" Some Guest, Some Topic`
  - `title`: python `"\"30 Show\" Some Guest, Some Topic"` · js `"30 Show"`
  - `type`: python `"movie"` · js `"episode"`
  - `episode_title`: python `undefined` · js `"Some Guest, Some Topic"`

`"Os 12 Signos" Episode #1.4`
  - `title`: python `"\"Os"` · js `"Os 12 Signos"`
  - `episode`: python `[12,1]` · js `4`
  - `episode_title`: python `"Signos\""` · js `undefined`
  - `season`: python `undefined` · js `1`

`"Quoted Series" Episode #1.2`
  - `title`: python `"\"Quoted Series\""` · js `"Quoted Series"`
  - `episode`: python `1` · js `2`
  - `episode_title`: python `"2"` · js `undefined`
  - `season`: python `undefined` · js `1`

`"Some Series" 1.3`
  - `title`: python `"\"Some Series\" 1.3"` · js `"Some Series"`
  - `type`: python `"movie"` · js `"episode"`
  - `season`: python `undefined` · js `1`
  - `episode`: python `undefined` · js `3`

`[ACX]Neon_Genesis_Evangelion_-_Platinum_-_06_-_Showdown_in_Tokyo_3_[SaHa]_[66A8FB7D].mkv`
  - `title`: python `"Neon Genesis Evangelion"` · js `"Neon Genesis Evangelion - Platinum"`
  - `alternative_title`: python `"Platinum"` · js `undefined`

`[BOIL] Inazuma Eleven - Choujigen Dream Match (DVDrip 1280x720up) [B97A2B39].mkv`
  - `title`: python `"Inazuma Eleven"` · js `"Inazuma Eleven - Choujigen Dream Match"`
  - `episode_title`: python `"Choujigen Dream Match"` · js `undefined`

`[DB]_Bleach_264_[012073FE].avi`
  - `episode`: python `undefined` · js `264`

`[DB]86_-_SP01_(10bit_BD1080p_x265).mkv`
  - `episode`: python `86` · js `1`
  - `title`: python `"SP01"` · js `"86"`
  - `episode_details`: python `undefined` · js `"Special"`

`[DB]Haikyuu_-_SP01_(10bit_BD1080p_x265).mkv`
  - `alternative_title`: python `"SP01"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `episode_details`: python `undefined` · js `"Special"`
  - `episode`: python `undefined` · js `1`

`[Doremi].Ro-Kyu-Bu!.SS.01.[C1B5CE5D].mkv`
  - `language`: python `"ron"` · js `undefined`
  - `title`: python `"Kyu-Bu! SS"` · js `"Ro-Kyu-Bu! SS"`

`[FFF] Seirei Tsukai no Blade Dance - SP01 [BD][720p-AAC][F1FB50A9].mkv`
  - `episode_title`: python `"SP01"` · js `undefined`
  - `episode_details`: python `undefined` · js `"Special"`
  - `episode`: python `undefined` · js `1`

`[FFF] Some Anime Show - SP01 [BD][720p-AAC][F2F4B7A3].mkv`
  - `episode_title`: python `"SP01"` · js `undefined`
  - `episode_details`: python `undefined` · js `"Special"`
  - `episode`: python `undefined` · js `1`

`[FuktLogik][Sayonara_Zetsubou_Sensei][01][DVDRip][x264_ogg].avi`
  - `container`: python `["ogg","avi"]` · js `"avi"`
  - `title`: python `undefined` · js `"Sayonara Zetsubou Sensei"`
  - `audio_codec`: python `undefined` · js `"Vorbis"`

`[Golumpa] Star Blazers 2202 - 22 (Uchuu Senkan Yamato 2202) [FuniDub 1080p x264 AAC].mkv`
  - `episode`: python `[22,2202]` · js `22`

`[Group].Show.Name.S2.-.19.[1080p]`
  - `title`: python `"Show Name S2"` · js `"Show Name"`
  - `season`: python `undefined` · js `2`

`[Grp] Some Anime 4th Season Part 1 - 09 [1080p].mkv`
  - `title`: python `"Some Anime 4th Season"` · js `"Some Anime"`
  - `season`: python `undefined` · js `4`

`[Grp] Some Show S1 - 12 - The Name [BD][1080p] [D5044E6D].mkv`
  - `episode_title`: python `"12 - The Name"` · js `"The Name"`
  - `episode`: python `undefined` · js `12`

`[Grp] Some Show S3 - 12 END (WEB 1920x1080 AVC AAC).mkv`
  - `episode_title`: python `"12 END"` · js `"END"`
  - `episode`: python `undefined` · js `12`

`[GS] Classroom Crisis Vol.1&2 (BD 1080p 10bit FLAC)`
  - `title`: python `"Classroom Crisis Vol 1&2"` · js `"Classroom Crisis"`
  - `volume`: python `undefined` · js `1`

`[HorribleSubs] Garo - Vanishing Line - 01 [1080p].mkv`
  - `title`: python `"Garo"` · js `"Garo - Vanishing Line"`
  - `alternative_title`: python `"Vanishing Line"` · js `undefined`

`[HorribleSubs] Gintama - 111C [1080p].mkv`
  - `alternative_title`: python `"111C"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `episode`: python `undefined` · js `111`
  - `episode_title`: python `undefined` · js `"C"`

`[HorribleSubs] Tower of Druaga - Sword of Uruk - 04 [480p].mkv`
  - `title`: python `"Tower of Druaga"` · js `"Tower of Druaga - Sword of Uruk"`
  - `alternative_title`: python `"Sword of Uruk"` · js `undefined`

`[HorribleSubs] Yowamushi Pedal - Glory Line - 01 [1080p].mkv`
  - `title`: python `"Yowamushi Pedal"` · js `"Yowamushi Pedal - Glory Line"`
  - `alternative_title`: python `"Glory Line"` · js `undefined`

`[Judas] Aharen-san wa Hakarenai - S01E06v2.mkv`
  - `alternative_title`: python `"S01E06v2"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `season`: python `undefined` · js `1`
  - `episode`: python `undefined` · js `6`
  - `version`: python `undefined` · js `2`

`[Juuni.Kokki]-(Les.12.Royaumes)-[Ep.24]-[x264+OGG].mkv`
  - `release_group`: python `"Juuni.Kokki"` · js `undefined`
  - `episode`: python `[12,24]` · js `24`
  - `container`: python `["ogg","mkv"]` · js `"mkv"`
  - `title`: python `undefined` · js `"Juuni Kokki"`
  - `alternative_title`: python `undefined` · js `"Les 12 Royaumes"`
  - `audio_codec`: python `undefined` · js `"Vorbis"`

`[Keroro].148.[Xvid.mp3].[FE68D5F1].avi`
  - `release_group`: python `"Keroro"` · js `undefined`
  - `title`: python `undefined` · js `"Keroro"`

`[KTXP][Fate][24][GB][1080P].mp4`
  - `country`: python `"GB"` · js `undefined`
  - `title`: python `undefined` · js `"Fate"`

`[Mobile Suit Gundam Seed Destiny HD REMASTER][07][Big5][720p][AVC_AAC].mp4`
  - `episode`: python `7` · js `undefined`
  - `release_group`: python `"Big5"` · js `"[07][Big5]"`
  - `title`: python `undefined` · js `"Mobile Suit Gundam Seed Destiny"`

`[N LogN Fansubs] Angel Beats (9).mkv`
  - `type`: python `"movie"` · js `"episode"`
  - `episode`: python `undefined` · js `9`

`[Seto_Otaku]_AIKa_ZERO_OVA_-_01_[BD][1920x1080_H264-Flac][6730D40A].mkv`
  - `title`: python `"AIKa ZERO"` · js `"AIKa ZERO OVA"`
  - `other`: python `"Original Animated Video"` · js `undefined`

`[SpoonSubs]_Hidamari_Sketch_x365_-_04.1_(DVD)[B6CE8458].mkv`
  - `title`: python `"Hidamari Sketch"` · js `"Hidamari Sketch x365"`
  - `bonus`: python `365` · js `undefined`

`[SuperGroup].Show.Name.-.Still.Name.-.11.[1080p]`
  - `title`: python `"Show Name"` · js `"Show Name - Still Name"`
  - `alternative_title`: python `"Still Name"` · js `undefined`

`[tlacatlc6] Natsume Yuujinchou Shi Vol. 1v2 & Vol. 2 (BD 1280x720).mkv`
  - `title`: python `"Natsume Yuujinchou Shi Vol 1v2 & Vol 2"` · js `"Natsume Yuujinchou Shi"`
  - `volume`: python `undefined` · js `[1,2]`

`[tr] some channel 1 hd`
  - `release_group`: python `"tr"` · js `undefined`
  - `language`: python `undefined` · js `"tur"`

`[Urusai]_Bokura_Ga_Ita_01_[DVD_h264_AC3]_[BFCE1627][Fixed].mkv`
  - `title`: python `"Bokura Ga"` · js `"Bokura Ga Ita"`
  - `language`: python `"ita"` · js `undefined`
  - `proper_count`: python `undefined` · js `-1`

`[UTW]_Accel_World_-_EX01_[BD][h264-720p_AAC][3E56EE18].mkv`
  - `episode_title`: python `"EX01"` · js `undefined`
  - `episode`: python `undefined` · js `1`

`【MMZYSUB】★【Golden Time】[24（END）][GB][720P_MP4]`
  - `alternative_title`: python `"【MMZYSUB】★【Golden"` · js `undefined`
  - `title`: python `"Time】"` · js `"Golden Time"`
  - `release_group`: python `"24（END）"` · js `"MMZYSUB"`
  - `country`: python `"GB"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `episode`: python `undefined` · js `24`
  - `other`: python `undefined` · js `"Complete"`

`/mnt/user/noxxus/Hellboy.2019.1080p.BluRay.x265-NOXXUS.mkv`
  - `release_group`: python `"NOXXUS"` · js `"noxxus"`

`/mnt/user/noXxus/Hellboy.2019.1080p.BluRay.x265-NOXXUS.mkv`
  - `release_group`: python `"NOXXUS"` · js `"noXxus"`

`/Show Name S2/[Group].Show.Name.S2.-.19.[1080p]`
  - `title`: python `"Show Name S2"` · js `"Show Name"`
  - `season`: python `undefined` · js `2`

`/Show.Name.S2/[Group].Show.Name.S2.-.19.[1080p]`
  - `title`: python `"Show Name S2"` · js `"Show Name"`
  - `season`: python `undefined` · js `2`

`02x05`
  - `episode`: python `[2,5]` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `title`: python `undefined` · js `"02x05"`

`03. Some Show.S03.2026.WEB-DL 1080p.mkv`
  - `title`: python `"03 Some Show"` · js `"Some Show"`
  - `episode`: python `undefined` · js `3`

`1917.1080p.mkv`
  - `year`: python `1917` · js `undefined`
  - `title`: python `undefined` · js `"1917"`

`2012.AC3.720p.BluRay.x264-XXL`
  - `year`: python `2012` · js `undefined`
  - `title`: python `undefined` · js `"2012"`

`2026-06-08 23-23-59.mp4`
  - `year`: python `2026` · js `undefined`
  - `season`: python `2026` · js `undefined`
  - `date`: python `"2023-08-06"` · js `"2026-06-08"`
  - `episode`: python `[23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59]` · js `undefined`

`2047 - Sights of Death (2014) 720p BrRip x264 - YIFY`
  - `title`: python `"2047"` · js `"2047 - Sights of Death"`
  - `alternative_title`: python `"Sights of Death"` · js `undefined`

`22.Jump.Street.GERMAN.DL.AC3.Dubbed.1080p.BluRay.x264-SOV`
  - `episode`: python `22` · js `undefined`
  - `title`: python `"Jump Street"` · js `"22 Jump Street"`
  - `type`: python `"episode"` · js `"movie"`

`50 First Dates`
  - `episode`: python `50` · js `undefined`
  - `title`: python `"First Dates"` · js `"50 First Dates"`
  - `type`: python `"episode"` · js `"movie"`

`Apocalypse.Now.Redux.2001.1080p.BluRay.x264-GRP.mkv`
  - `title`: python `"Apocalypse Now Redux"` · js `"Apocalypse Now"`
  - `edition`: python `undefined` · js `"Redux"`

`Apollo 13 (1995) [1080p] [WEB-DL] [x264] [E-AC3-S78] [Lektor PL].mkv`
  - `season`: python `78` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`

`ar-bdy - مسلسل آخر - s01e21 - مسلسل آخر - s01e21.strm`
  - `title`: python `"ar-bdy"` · js `"مسلسل آخر"`
  - `alternative_title`: python `"مسلسل آخر"` · js `undefined`
  - `episode_title`: python `"مسلسل آخر"` · js `undefined`
  - `language`: python `undefined` · js `"ara"`

`ar-kh - مسلسل - s01e12 - مسلسل - s01e12.strm`
  - `title`: python `"ar-kh"` · js `"مسلسل"`
  - `alternative_title`: python `"مسلسل"` · js `undefined`
  - `episode_title`: python `"مسلسل"` · js `undefined`
  - `language`: python `undefined` · js `"ara"`

`Avatar La Voie de l'eau.FRENCH.CAMHD.H264.AAC`
  - `release_group`: python `"CAMHD"` · js `undefined`
  - `source`: python `undefined` · js `"HD Camera"`

`Avatar The Way of Water (2022) 1080p HQ S-Print Dual Audio.mkv`
  - `release_group`: python `"S-Print"` · js `undefined`
  - `source`: python `undefined` · js `"Camera"`

`Bar.3.3.x265`
  - `title`: python `"Bar 3"` · js `"Bar"`

`BDRip.[4K-2160p-UHD]`
  - `other`: python `"Rip"` · js `["Rip","Ultra HD"]`

`Bellator.300.1080p.WEB-DL.H264-GRP.mkv`
  - `season`: python `3` · js `undefined`
  - `episode`: python `0` · js `300`

`Blade.Runner.1982.Final.Cut.2160p.UHD.BluRay.x265-GRP.mkv`
  - `episode_title`: python `"Final Cut"` · js `undefined`
  - `episode_details`: python `"Final"` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `edition`: python `undefined` · js `"Final Cut"`

`Blood Diamond (2006) 1080p BluRay H264 DolbyD 5.1.mkv`
  - `release_group`: python `"DolbyD"` · js `undefined`
  - `audio_codec`: python `undefined` · js `"Dolby Digital"`

`BRRip.[4K-2160p-UHD]`
  - `other`: python `["Reencoded","Rip"]` · js `["Reencoded","Rip","Ultra HD"]`

`BRRip.2160p.UHD`
  - `other`: python `["Reencoded","Rip"]` · js `["Reencoded","Rip","Ultra HD"]`

`clny.3x11m720p.es.mkv`
  - `title`: python `"clny 3x11m720p"` · js `"clny"`
  - `type`: python `"movie"` · js `"episode"`
  - `season`: python `undefined` · js `3`
  - `episode`: python `undefined` · js `11`
  - `episode_title`: python `undefined` · js `"m720p"`

`Cuerpo de Elite  - Temporada 1 [HDTV 720p][Cap.113][AC3 5.1 Esp Castellano]\CuerpoDeElite720p_113_desca202.mkv`
  - `language`: python `["spa","cat"]` · js `"spa"`

`Deadpool.2016.4K.2160p.UHD.HQ.8bit.BluRay.8CH.x265.HEVC-MZABI.mkv`
  - `other`: python `"High Quality"` · js `["Ultra HD","High Quality"]`

`Desperate Housewives - Episode 1.22 - Goodbye for now.avi`
  - `episode`: python `[1,22]` · js `22`
  - `season`: python `undefined` · js `1`

`Desperation 2006 Multi Pal DvdR9-TBW1973`
  - `release_group`: python `"DvdR9-TBW1973"` · js `"TBW1973"`
  - `source`: python `undefined` · js `"DVD"`

`Dragon Ball [5.134] Preliminary Peril.mp4`
  - `season`: python `1` · js `5`
  - `episode`: python `34` · js `134`

`Dune.Part.Two.2024.2160p.WEB-DL.mkv`
  - `title`: python `"Dune"` · js `"Dune Part Two"`
  - `part`: python `2` · js `undefined`

`DVD.fix.XViD`
  - `proper_count`: python `undefined` · js `-1`

`en ★ some show - s04e06 - an episode.strm`
  - `title`: python `"★ some show"` · js `"some show"`

`En Fin [HDTV 1080p][Cap.103].mkv`
  - `language`: python `"eng"` · js `undefined`
  - `title`: python `"Fin"` · js `"En Fin"`

`Evangelion.3.0.1.11.Thrice.Upon.A.Time.2021.COMPLETE.UHD.BLURAY-NERV`
  - `title`: python `"Evangelion 3"` · js `"Evangelion 3.0.1.11 Thrice Upon A Time"`
  - `date`: python `"2000-11-01"` · js `undefined`
  - `episode_title`: python `"Thrice Upon A Time 2021"` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `year`: python `undefined` · js `2021`

`Eve no Jikan 2 [88F4F7F0].mkv`
  - `title`: python `"Eve no Jikan 2"` · js `"Eve no Jikan"`
  - `type`: python `"movie"` · js `"episode"`
  - `episode`: python `undefined` · js `2`

`Event.2024.1080p.FITE.WEB-DL.mkv`
  - `release_group`: python `"FITE"` · js `undefined`
  - `streaming_service`: python `undefined` · js `"FITE"`

`EvoBot.[Watakushi]_Akuma_no_Riddle_-_01v2_[720p][D0335AF6].mkv`
  - `title`: python `"EvoBot"` · js `"Akuma no Riddle"`
  - `episode_title`: python `"Akuma no Riddle"` · js `undefined`

`Example.Show.-.Saison.19.-.Requested.Episode.Title_Channel.5_2025_07_18_21_00.mp4`
  - `year`: python `2025` · js `undefined`
  - `episode`: python `7` · js `undefined`
  - `date`: python `undefined` · js `"2025-07-18"`

`Fight.2024.1080p.DAZN.WEB-DL.mkv`
  - `release_group`: python `"DAZN"` · js `undefined`
  - `streaming_service`: python `undefined` · js `"DAZN"`

`Foo.2.2`
  - `title`: python `"Foo 2"` · js `"Foo"`

`Foo.2.2`
  - `title`: python `"Foo 2"` · js `"Foo"`

`Foo.2.2.bar`
  - `title`: python `"Foo 2"` · js `"Foo"`
  - `mimetype`: python `"application/vnd.qualcomm.brew-app-res"` · js `undefined`

`FooBar - 360 368p-Grp`
  - `episode`: python `360` · js `60`
  - `season`: python `undefined` · js `3`

`foobar.213.avi`
  - `episode`: python `213` · js `13`
  - `season`: python `undefined` · js `2`

`Formula.1.2024.Round.22.Las.Vegas.GP.Race.1080p.F1TV.WEB-DL.mkv`
  - `alternative_title`: python `"Round 22 Las Vegas GP Race"` · js `undefined`
  - `release_group`: python `"F1TV"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `season`: python `undefined` · js `2024`
  - `episode`: python `undefined` · js `22`
  - `episode_title`: python `undefined` · js `"Las Vegas GP Race"`
  - `streaming_service`: python `undefined` · js `"F1TV"`

`Formula.1.2026.E13.Practice.1080p.mkv`
  - `season`: python `2026` · js `undefined`

`fr+★+some+series`
  - `title`: python `"★"` · js `"some series"`
  - `alternative_title`: python `["some","series"]` · js `undefined`

`Hayate no Gotoku 2nd Season 24 (Blu-Ray 1080p) [Chihiro]`
  - `title`: python `"Hayate no Gotoku 2nd"` · js `"Hayate no Gotoku"`
  - `season`: python `24` · js `2`
  - `episode`: python `undefined` · js `24`

`House MD Season 7 Complete MKV`
  - `title`: python `"House"` · js `"House MD"`
  - `other`: python `["Mic Dubbed","Complete"]` · js `"Complete"`

`How I Met Your Mother Season 1, 2, 3, 4, 5, & 6 + Extras DVDRip`
  - `season`: python `[1,2,3,4,5]` · js `[1,2,3,4,5,6]`
  - `episode_title`: python `"& 6"` · js `undefined`

`how to rob a bank[cam]`
  - `release_group`: python `"cam"` · js `undefined`
  - `source`: python `undefined` · js `"Camera"`

`Jackass.2.5.2007.DVDRip.x264.AC3-DEEP`
  - `title`: python `"Jackass"` · js `"Jackass 2.5"`
  - `date`: python `"2007-05-02"` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `year`: python `undefined` · js `2007`

`Jackass.4.5.2022.1080p.NF.WEB-DL.DDP5.1.x264-KHN`
  - `title`: python `"Jackass"` · js `"Jackass 4.5"`
  - `date`: python `"2022-05-04"` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `year`: python `undefined` · js `2022`

`Jaws.1975.45th.Anniversary.Edition.1080p.BluRay.x264-GRP.mkv`
  - `alternative_title`: python `"45th Anniversary Edition"` · js `undefined`
  - `edition`: python `undefined` · js `"Anniversary"`

`Macross Frontier - Sayonara no Tsubasa (Central Anime, 720p) [46B35E25].mkv`
  - `title`: python `"Macross Frontier"` · js `"Macross Frontier - Sayonara no Tsubasa"`
  - `episode_title`: python `"Sayonara no Tsubasa"` · js `undefined`

`Mary Bell (DVD) - 02 [h-b].mkv`
  - `release_group`: python `"02 [h-b]"` · js `"h-b"`
  - `type`: python `"movie"` · js `"episode"`
  - `episode`: python `undefined` · js `2`

`Mash S10E01b Thats Show Biz Part 2 1080p H.264.mkv`
  - `title`: python `"Mash S10E01b Thats Show Biz"` · js `"Mash"`
  - `type`: python `"movie"` · js `"episode"`
  - `season`: python `undefined` · js `10`
  - `episode`: python `undefined` · js `1`
  - `episode_title`: python `undefined` · js `"Thats Show Biz"`

`MotoGP 2026 Round14 Somewhere Race WEB-DL 1080p H264-GRP.mkv`
  - `alternative_title`: python `"Round14 Somewhere Race"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `season`: python `undefined` · js `2026`
  - `episode`: python `undefined` · js `14`
  - `episode_title`: python `undefined` · js `"Somewhere Race"`

`MotoGP.2024.Round.15.Japan.Race.1080p.WEB-DL.mkv`
  - `alternative_title`: python `"Round 15 Japan Race"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `season`: python `undefined` · js `2024`
  - `episode`: python `undefined` · js `15`
  - `episode_title`: python `undefined` · js `"Japan Race"`

`Movie abc(AAC) x264`
  - `release_group`: python `"AAC"` · js `undefined`
  - `audio_codec`: python `undefined` · js `"AAC"`

`Movie abc(BluRay) x264-GRP`
  - `source`: python `undefined` · js `"Blu-ray"`

`Movie.2020.1080p.BluRay.x264-GRP.ara.srt`
  - `release_group`: python `"GRP.ara"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"ara"`

`Movie.2020.1080p.BluRay.x264-GRP.chi.srt`
  - `release_group`: python `"GRP.chi"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"zho"`

`Movie.2020.1080p.BluRay.x264-GRP.eng.forced.srt`
  - `release_group`: python `"forced"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `other`: python `undefined` · js `"Forced"`

`Movie.2020.1080p.BluRay.x264-GRP.eng.hi.srt`
  - `language`: python `"eng"` · js `undefined`
  - `subtitle_language`: python `"hin"` · js `"eng"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `other`: python `undefined` · js `"SDH"`

`Movie.2020.1080p.BluRay.x264-GRP.eng.sdh.srt`
  - `release_group`: python `"sdh"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `other`: python `undefined` · js `"SDH"`

`Movie.2020.1080p.BluRay.x264-GRP.gre.srt`
  - `release_group`: python `"GRP.gre"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"Modern Greek (1453-)"`

`Movie.2020.1080p.BluRay.x264-GRP.indonesian.srt`
  - `release_group`: python `"GRP.indonesian"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"ind"`

`Movie.2020.1080p.BluRay.x264-GRP.per.srt`
  - `release_group`: python `"GRP.per"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"per"`

`Movie.2020.1080p.BluRay.x264-GRP.tha.srt`
  - `release_group`: python `"GRP.tha"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"tha"`

`Movie.2020.1080p.BluRay.x264-GRP.turkish.srt`
  - `release_group`: python `"GRP.turkish"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"tur"`

`Movie.2020.1080p.BluRay.x264-GRP.vie.srt`
  - `release_group`: python `"GRP.vie"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"vie"`

`Movie.2020.1080p.BluRay.x264-GRP.zh-Hans.srt`
  - `release_group`: python `"GRP.zh-Hans"` · js `"GRP"`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"zho"`

`Movie.2020.AC3.51.mkv`
  - `audio_channels`: python `undefined` · js `"5.1"`

`Movie.2020.Castellano.1080p.WEB.H264-GRP`
  - `language`: python `"cat"` · js `"spa"`

`Movie.2020.SPANISH.Castellano.1080p.WEB.H264-GRP`
  - `language`: python `["spa","cat"]` · js `"spa"`

`Movie.2020.VFB.1080p.WEB.H264-GRP`
  - `alternative_title`: python `"VFB"` · js `undefined`
  - `language`: python `undefined` · js `"fra"`

`Movie.2024.1080p.AV2.mkv`
  - `release_group`: python `"AV2"` · js `undefined`
  - `video_codec`: python `undefined` · js `"AV2"`

`Movie.2024.1080p.WEB-DL.AV1.Opus-GRP.mkv`
  - `video_codec`: python `undefined` · js `"AV1"`

`Movie.2024.2160p.AV1.10bit.mkv`
  - `release_group`: python `"AV1"` · js `undefined`
  - `video_codec`: python `undefined` · js `"AV1"`

`my 720p show S01E02`
  - `title`: python `"my 720p show"` · js `"my"`
  - `screen_size`: python `undefined` · js `"720p"`
  - `release_group`: python `undefined` · js `"show"`

`my 720p show S01E02`
  - `title`: python `"my 720p show"` · js `"my"`
  - `screen_size`: python `undefined` · js `"720p"`
  - `release_group`: python `undefined` · js `"show"`

`my 720p show S01E02 720p`
  - `title`: python `"my 720p show"` · js `"my"`
  - `release_group`: python `undefined` · js `"show"`

`My Little Pony FiM - 6.01 - No Second Prances.mkv`
  - `alternative_title`: python `"6"` · js `undefined`
  - `season`: python `undefined` · js `6`

`nl ▎ some movie.strm`
  - `title`: python `"▎ some movie"` · js `"some movie"`

`One.Piece.1089.1080p.CR.WEB-DL.AAC2.0.H.264-VARYG.mkv`
  - `season`: python `10` · js `undefined`
  - `episode`: python `89` · js `1089`

`One.Piece.1089.1080p.WEB-DL.mkv`
  - `season`: python `10` · js `undefined`
  - `episode`: python `89` · js `1089`

`Paparazzi - Timsit/Lindon (MKV 1080p tvripHD)`
  - `title`: python `"Paparazzi"` · js `"Lindon"`
  - `alternative_title`: python `["Timsit","Lindon"]` · js `undefined`

`Planet.Earth.III.S01E01.Coasts.2160p.iP.WEB-DL.AAC2.0.HLG.H.265-RAWR.mkv`
  - `other`: python `undefined` · js `"HLG"`

`ponyo_on_the_cliff_by_the_sea[h264.dts][niizk].mkv`
  - `video_codec`: python `undefined` · js `"H.264"`

`Por Trece Razones - Temporada 2 [HDTV 720p][Cap.201][AC3 5.1 Castellano]/Por Trece Razones 2x01 [des202].mkv`
  - `language`: python `"cat"` · js `"spa"`

`s01e01 - nf - some show (2015) (us) - s01e01 - pilot.strm`
  - `title`: python `"nf"` · js `"some show"`
  - `alternative_title`: python `"some show"` · js `undefined`
  - `streaming_service`: python `undefined` · js `"Netflix"`

`s01e02 - 4k-a+ - third show (2022) (us) - s01e02 - half loop.strm`
  - `title`: python `"a"` · js `"third show"`
  - `alternative_title`: python `"third show"` · js `undefined`
  - `streaming_service`: python `undefined` · js `"AppleTV"`

`s01e03 - vp - fourth show - s01e03 - a storm.strm`
  - `title`: python `"vp"` · js `"fourth show"`
  - `alternative_title`: python `"fourth show"` · js `undefined`

`s01e04 - nf - other show (sa) - s01e04.strm`
  - `title`: python `"nf"` · js `"other show"`
  - `episode_title`: python `"other show"` · js `undefined`
  - `release_group`: python `"sa"` · js `undefined`
  - `streaming_service`: python `undefined` · js `"Netflix"`

`s01e04 - nf - some show (2025) (us) - s01e04 - the few.strm`
  - `title`: python `"nf"` · js `"some show"`
  - `alternative_title`: python `"some show"` · js `undefined`
  - `streaming_service`: python `undefined` · js `"Netflix"`

`Shes the one_2013(camrip)__TOPSIDER`
  - `release_group`: python `"camrip"` · js `"TOPSIDER"`
  - `alternative_title`: python `"TOPSIDER"` · js `undefined`
  - `source`: python `undefined` · js `"Camera"`
  - `other`: python `undefined` · js `"Rip"`

`Show Name - Temporada 4 [HDTV][Cap.408][Espanol Castellano]`
  - `language`: python `"cat"` · js `"spa"`

`Show Name - Temporada 4 [HDTV][Cap.408][Español Castellano]`
  - `language`: python `"cat"` · js `"spa"`

`Show Name 804 vostfr HD`
  - `episode`: python `804` · js `4`
  - `season`: python `undefined` · js `8`

`Show_2025_07_18_31_99.mkv`
  - `year`: python `2025` · js `undefined`
  - `season`: python `2025` · js `undefined`
  - `episode`: python `7` · js `[31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99]`
  - `episode_title`: python `"18 31 99"` · js `undefined`
  - `date`: python `undefined` · js `"2025-07-18"`

`Show_2025_07_18.mp4`
  - `year`: python `2025` · js `undefined`
  - `season`: python `2025` · js `undefined`
  - `episode`: python `7` · js `undefined`
  - `episode_title`: python `"18"` · js `undefined`
  - `date`: python `undefined` · js `"2025-07-18"`

`Show-A (US) - Episode Title S02E09 hdtv`
  - `alternative_title`: python `undefined` · js `"Episode Title"`

`Show.Name.-.Temporada1.[HDTV][Cap.105][Español.Castellano]`
  - `language`: python `"cat"` · js `"spa"`

`Show.Name.1089.1080p.WEB-DL.H.264-VARYG.mkv`
  - `season`: python `10` · js `undefined`
  - `episode`: python `89` · js `1089`

`Show.Name.S01E02.1080p-NINJA.txt`
  - `release_group`: python `"NINJA.txt"` · js `"NINJA"`
  - `mimetype`: python `"text/plain"` · js `undefined`
  - `container`: python `undefined` · js `"txt"`

`Show.Name.S01E02.1080p-NINJA.url`
  - `release_group`: python `"NINJA.url"` · js `"NINJA"`
  - `container`: python `undefined` · js `"url"`

`Show.Name.Season.2.AV1.1080p`
  - `episode_title`: python `"AV1"` · js `undefined`
  - `video_codec`: python `undefined` · js `"AV1"`

`Skins Season S01-S07 COMPLETE UK Soundtrack 720p WEB-DL`
  - `title`: python `"Skins Season"` · js `"Skins"`

`Solar.Opposites.S06E05.The.Family.Memories.Vhs.Mix.Tape.1080p.WEBRip.10bit.EAC3.5.1.x265-iVy.mkv`
  - `episode_title`: python `"The Family Memories"` · js `"The Family Memories Vhs Mix Tape"`
  - `source`: python `["VHS","Web"]` · js `"Web"`

`Some Anime - 08 CZ - Some Episode Words.mkv`
  - `release_group`: python `"Some Episode Words"` · js `undefined`
  - `episode_title`: python `undefined` · js `"Some Episode Words"`

`Some Anime (2026) - 07 CZ - Some Words.mkv`
  - `season`: python `2026` · js `undefined`
  - `release_group`: python `"Some Words"` · js `undefined`
  - `episode_title`: python `undefined` · js `"Some Words"`

`Some Anime S2 Part 2 - 13 [Grp].mkv`
  - `episode`: python `undefined` · js `13`

`Some Drama 2026 KOREAN E08 1080p.mp4`
  - `season`: python `2026` · js `undefined`

`Some Drama Episode #1.16`
  - `episode`: python `[1,16]` · js `16`
  - `season`: python `undefined` · js `1`

`Some Drama Episode #1.16.mkv`
  - `episode`: python `[1,16]` · js `16`
  - `season`: python `undefined` · js `1`

`Some Game Gameplay - Story Part 2 - recorder 2026-06-05 23-09-24-696.mp4`
  - `alternative_title`: python `["Story","09-24-696"]` · js `"Story"`
  - `year`: python `2026` · js `undefined`
  - `date`: python `"2023-05-06"` · js `"2026-06-05"`
  - `type`: python `"movie"` · js `"episode"`

`some movie (2016) malayalam hdrip`
  - `alternative_title`: python `"malayalam"` · js `undefined`
  - `language`: python `undefined` · js `"mal"`

`Some Movie (2020) CZ titulky.mkv`
  - `language`: python `"ces"` · js `undefined`
  - `release_group`: python `"titulky"` · js `undefined`
  - `subtitle_language`: python `undefined` · js `"ces"`

`Some Movie (2021) Tamil HD DVD Print 700MB.mkv`
  - `alternative_title`: python `"Tamil"` · js `undefined`
  - `language`: python `undefined` · js `"tam"`

`Some Movie 2020 (cz sk 1080p).mkv`
  - `language`: python `"ces"` · js `["ces","slk"]`
  - `release_group`: python `"sk"` · js `undefined`

`Some Movie 2020 SK dabing.mkv`
  - `alternative_title`: python `"SK dabing"` · js `undefined`
  - `language`: python `undefined` · js `"slk"`

`Some Movie CZ DABING 2025.1080p.mkv`
  - `title`: python `"Some Movie CZ DABING"` · js `"Some Movie"`
  - `language`: python `undefined` · js `"ces"`

`Some Movie cz tit (2020).mkv`
  - `title`: python `"Some Movie cz tit"` · js `"Some Movie"`
  - `subtitle_language`: python `undefined` · js `"ces"`

`some show - s05e01 - some show - s05e01 - the real episode.strm`
  - `episode_title`: python `"some show"` · js `"the real episode"`

`some show - s05e01 - some show - s05e01.strm`
  - `episode_title`: python `"some show"` · js `undefined`

`Some Show 2nd Season - 08 - Some Title.mkv`
  - `title`: python `"Some Show 2nd Season"` · js `"Some Show"`
  - `season`: python `undefined` · js `2`

`Some Show CZ dabing S04E08 Episode Name.mkv`
  - `title`: python `"Some Show CZ dabing"` · js `"Some Show"`
  - `language`: python `undefined` · js `"ces"`

`Some Show E01 [2019].mkv`
  - `season`: python `2019` · js `undefined`

`Some Show S01E01 (Thailand, 2022, drama, BL).mkv`
  - `release_group`: python `"Thailand, 2022, drama, BL"` · js `undefined`
  - `year`: python `undefined` · js `2022`

`Some Show S03E04 CZ - Words Here - More Words.mkv`
  - `release_group`: python `"Words Here - More Words"` · js `undefined`
  - `episode_title`: python `undefined` · js `"Words Here - More Words"`

`Some Show Season 2 - 08.mkv`
  - `season`: python `[2,3,4,5,6,7,8]` · js `2`
  - `episode`: python `undefined` · js `8`

`SOME TITLE/Some.title.mkv`
  - `title`: python `"Some title"` · js `"SOME TITLE"`

`some-video-147cbe03-9a5c-421a-9f39-c316793151ae.mp4`
  - `uuid`: python `"some-video-147cbe03-9a5c-421a-9f39-c316793151ae"` · js `"147cbe03-9a5c-421a-9f39-c316793151ae"`
  - `title`: python `undefined` · js `"some-video"`

`Some.Movie.2006.VOQ.1080p.BluRay.x264-GRP.mkv`
  - `alternative_title`: python `"VOQ"` · js `undefined`
  - `language`: python `undefined` · js `"fra"`

`Some.Movie.2020.1080.BluRay.mkv`
  - `season`: python `10` · js `undefined`
  - `episode`: python `80` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `screen_size`: python `undefined` · js `"1080p"`

`Some.Movie.2020.CZ.SK.mkv`
  - `language`: python `"ces"` · js `["ces","slk"]`
  - `release_group`: python `"SK"` · js `undefined`

`Some.Movie.2020.Danish.1080p.WEB.H264-GRP`
  - `alternative_title`: python `"Danish"` · js `undefined`
  - `language`: python `undefined` · js `"dan"`

`Some.Movie.2020.zh-Hans.srt`
  - `alternative_title`: python `"zh-Hans"` · js `undefined`
  - `mimetype`: python `"text/plain"` · js `"application/x-subrip"`
  - `subtitle_language`: python `undefined` · js `"zho"`

`Some.Show.1991.E01.480p.AAC.x264-GRP.mp4`
  - `season`: python `1991` · js `undefined`

`Some.Show.S01E01.1080p.NF.WEB-DL.HIN-ENG-TAM-TEL.DDP5.1.H.264-GRP.mkv`
  - `language`: python `["hin","eng","tel"]` · js `["hin","eng","tam","tel"]`

`Some.Show.S02E03.1080p.WEB.AV1-GRP.mkv`
  - `release_group`: python `"AV1-GRP"` · js `"GRP"`
  - `video_codec`: python `undefined` · js `"AV1"`

`Some.Show.S06E05.The.Family.Memories.Vhs.Mix.Tape.1080p.WEBRip.x264-GRP.mkv`
  - `episode_title`: python `"The Family Memories"` · js `"The Family Memories Vhs Mix Tape"`
  - `source`: python `["VHS","Web"]` · js `"Web"`

`Sons of Anarchy Sn4 Ep14 HD-TV.mkv`
  - `title`: python `"Sons of Anarchy Sn4"` · js `"Sons of Anarchy"`
  - `season`: python `undefined` · js `4`

`South Park Complete Seasons 1: 11`
  - `season`: python `1` · js `[1,2,3,4,5,6,7,8,9,10,11]`
  - `episode`: python `11` · js `undefined`

`Spa Weekend 2026 1080p WEB-DL HEVC x265 5.1 BONE.mkv`
  - `language`: python `"spa"` · js `undefined`
  - `title`: python `"Weekend"` · js `"Spa Weekend"`

`Spider-Man.2002.1080p.mkv`
  - `release_group`: python `"Spider"` · js `undefined`
  - `title`: python `"Man"` · js `"Spider-Man"`

`Star Wars Episode 1 La Menace fantome 1999 Truefrench BDrip x264-BBer`
  - `title`: python `"Star Wars"` · js `"Star Wars Episode 1 La Menace fantome"`
  - `episode`: python `1` · js `undefined`
  - `episode_title`: python `"La Menace fantome"` · js `undefined`
  - `season`: python `1999` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`

`Star Wars Episode 6 Le Retour du Jedi 1983 Truefrench BDrip x264.mkv`
  - `title`: python `"Star Wars"` · js `"Star Wars Episode 6 Le Retour du Jedi"`
  - `episode`: python `6` · js `undefined`
  - `episode_title`: python `"Le Retour du Jedi"` · js `undefined`
  - `season`: python `1983` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`

`Ted.Lasso.S03E03.4-5-1.1080p.WEB.H264-GGWP.mkv`
  - `episode`: python `[3,4,5]` · js `3`
  - `episode_title`: python `"1"` · js `"4-5-1"`

`TEST.2015.1080p.HC.WEBRip.x264.AAC2.0-ABC`
  - `other`: python `"Rip"` · js `["Hardcoded Subtitles","Rip"]`

`The Killer's Game 2024 PL 1080p WEB-DL H264 DD5.1-S56`
  - `season`: python `56` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`

`The Twilight Zone 1985 S01E22c The Library.mp4`
  - `alternative_title`: python `"S01E22c The Library"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `season`: python `undefined` · js `1`
  - `episode`: python `undefined` · js `22`
  - `episode_title`: python `undefined` · js `"The Library"`

`The.Man.In.The.High.Castle1x01.HDTV.XviD.mkv`
  - `title`: python `"The Man In The High Castle1x01"` · js `"The Man In The High Castle"`
  - `type`: python `"movie"` · js `"episode"`
  - `season`: python `undefined` · js `1`
  - `episode`: python `undefined` · js `1`

`The.Show.S11E01.German.DL.EAC3.AMZN.WEB.H265-GRP.mkv`
  - `streaming_service`: python `undefined` · js `"Amazon Prime"`

`The.Show.S11E01.NF.WEB.H265-GRP.mkv`
  - `episode_title`: python `"NF"` · js `undefined`
  - `streaming_service`: python `undefined` · js `"Netflix"`

`Thor Love and Thunder (2022) Hindi HQCAM x264 AAC.mkv`
  - `release_group`: python `"HQCAM"` · js `undefined`
  - `source`: python `undefined` · js `"Camera"`

`Top Show Episode #24.3`
  - `episode`: python `24` · js `3`
  - `episode_title`: python `"3"` · js `undefined`
  - `season`: python `undefined` · js `24`

`UFC.247.PPV.Jones.vs.Reyes.HDTV.x264-PUNCH[TGx]`
  - `title`: python `"UFC"` · js `"UFC 247"`
  - `season`: python `2` · js `undefined`
  - `episode`: python `47` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `alternative_title`: python `undefined` · js `"Jones vs Reyes"`

`UFC.300.Early.Prelims.1080p.WEB-DL.H264-GRP.mkv`
  - `season`: python `3` · js `undefined`
  - `episode`: python `0` · js `300`

`UFC.Fight.Night.185.Prelims.FP.WEB-DL.H264-SHREDDiE`
  - `season`: python `1` · js `undefined`
  - `episode`: python `85` · js `185`

`UFC.Fight.Night.245.Prelims.1080p.WEB-DL.H264-GRP.mkv`
  - `season`: python `2` · js `undefined`
  - `episode`: python `45` · js `245`

`W2Test.123.HDTV.XViD-FlexGet`
  - `episode`: python `123` · js `23`
  - `season`: python `undefined` · js `1`

`Watchmen.2009.Ultimate.Cut.1080p.BluRay.x264-GRP.mkv`
  - `alternative_title`: python `"Ultimate Cut"` · js `undefined`
  - `edition`: python `undefined` · js `"Ultimate Cut"`

`X2.2003.1080p.BluRay.x264-GRP.mkv`
  - `bonus`: python `2` · js `undefined`
  - `title`: python `undefined` · js `"X2"`

`X2.2003.720p.DSNP.WEB-DL.DDP5.1.H.264-EVO.mkv`
  - `bonus`: python `2` · js `undefined`
  - `title`: python `undefined` · js `"X2"`

