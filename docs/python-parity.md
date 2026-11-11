# Python ↔ JS parity — measured, not asserted

Every name in the fixture corpus run through both parsers and compared field
by field. Regenerate with `scripts/python-diff.mts` (usage in its header);
languages compare as alpha3, since Python's encoder writes their English names.

- **2247 of 2490 inputs identical** (90.2%)
- **243 differ**: 138 pinned — a fixture of ours asserts the differing field itself,
  38 in `test/fixtures/upstream-rules-pending.yml` (tracked backlog),
  65 untested — the name is in our corpus but the differing field is not asserted,
  2 unexamined — the name is not in our corpus at all

Differing fields, most frequent first:

| Field | Inputs |
|---|---|
| `title` | 94 |
| `episode` | 55 |
| `season` | 45 |
| `episode_title` | 41 |
| `release_group` | 40 |
| `type` | 29 |
| `alternative_title` | 29 |
| `language` | 20 |
| `mimetype` | 19 |
| `subtitle_language` | 19 |
| `other` | 18 |
| `year` | 13 |
| `source` | 12 |
| `date` | 9 |
| `container` | 4 |
| `audio_codec` | 4 |
| `edition` | 4 |
| `bonus` | 3 |
| `absolute_episode` | 3 |
| `video_codec` | 3 |
| `country` | 3 |
| `streaming_service` | 3 |
| `screen_size` | 2 |
| `volume` | 2 |
| `proper_count` | 2 |
| `episode_details` | 2 |
| `audio_channels` | 2 |
| `part` | 1 |
| `version` | 1 |
| `website` | 1 |

## Untested (65)

The name is in our corpus, but no fixture asserts the field that differs — so the JS value here is incidental, not a decision. These are where a real divergence could be hiding.

`[7.1.7.8.5] Foo Bar - 11 (H.264) [5235532D].mkv`
  - `release_group`: python `"7.8.5"` · js `undefined`

`[CMS] Magical☆Star Kanon 100% OVA[DVD][E9F43685].mkv`
  - `release_group`: python `"DVD"` · js `"CMS"`
  - `source`: python `undefined` · js `"DVD"`

`[Deep] Tegami Bachi (REVERSE) - Letter Bee - 29 (04) [E56A4C7B].mkv`
  - `title`: python `"Tegami Bachi"` · js `["Tegami Bachi","Letter Bee"]`
  - `episode_title`: python `"Letter Bee - 29"` · js `"REVERSE"`

`[GroupName].Show.Name.-.02.5.(Special).[BD.1080p]`
  - `episode_title`: python `"5"` · js `undefined`

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

`Another Film Title-f01-Series Title.mkv`
  - `alternative_title`: python `undefined` · js `"Series Title"`

`Apollo 18 Temporada 2`
  - `episode`: python `18` · js `undefined`

`Apollo 18 Temporada 2`
  - `episode`: python `18` · js `undefined`

`avi`
  - `mimetype`: python `undefined` · js `"video/x-msvideo"`

`Battle Royale (2000)/Battle.Royale.(Batoru.Rowaiaru).(2000).(Special.Edition).CD1of2.DVDRiP.XviD-[ZeaL].avi`
  - `alternative_title`: python `undefined` · js `"Batoru Rowaiaru"`

`Bones.S12E02.The.Brain.In.The.Bot.1080p.WEB-DL.DD5.1.H.264-R2D2/161219_06.mkv`
  - `date`: python `undefined` · js `"2016-12-19"`

`BR`
  - `language`: python `"por"` · js `"por-BR"`

`cam.rip`
  - `mimetype`: python `"audio/vnd.rip"` · js `undefined`

`D:\TV\SITCOMS (CLASSIC)\That '70s Show\Season 07\That '70s Show - S07E22 - 2000 Light Years from Home.mkv`
  - `release_group`: python `"CLASSIC"` · js `undefined`

`DTS-ES`
  - `language`: python `"spa"` · js `undefined`

`DTS-HD.HR`
  - `other`: python `undefined` · js `"High Resolution"`

`DTSHD.HR`
  - `other`: python `undefined` · js `"High Resolution"`

`Flac`
  - `mimetype`: python `undefined` · js `"audio/flac"`

`Fullmetal_Alchemist_Brotherhood_ED2v2_Clean_[BD_1080p][AtsA][0F81F8F7].mkv`
  - `episode_title`: python `"Clean"` · js `undefined`

`HD-Cam.rip`
  - `mimetype`: python `"audio/vnd.rip"` · js `undefined`

`Its.A.Wonderful.Life.1946.Colorized.720p.BRRip.999MB.MkvCage.com`
  - `mimetype`: python `"application/x-msdownload"` · js `undefined`

`Le.Prestige[x264.{Fr-Eng}.St{Fr-Eng}.Chaps].mkv`
  - `video_codec`: python `undefined` · js `"H.264"`

`Masala (2013) Telugu Movie HD DVDScr XviD - Exclusive.avi`
  - `language`: python `undefined` · js `"tel"`

`mkv`
  - `mimetype`: python `undefined` · js `"video/x-matroska"`

`MotoGP.2016x03.USA.Race.BTSportHD.1080p25`
  - `episode_title`: python `"USA Race BTSportHD"` · js `"Race BTSportHD"`
  - `country`: python `undefined` · js `"US"`

`Movies/Bunker Palace Hôtel (Enki Bilal) (1989)/Enki Bilal - Bunker Palace Hotel (Fr Vhs Rip).avi`
  - `release_group`: python `"Enki Bilal"` · js `undefined`
  - `alternative_title`: python `"Bunker Palace Hotel"` · js `"Enki Bilal"`

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

`Series/Duckman/Duckman - 101 (01) - 20021107 - I, Duckman.avi`
  - `absolute_episode`: python `undefined` · js `1`

`Series/Duckman/Duckman - 110 (10) - 20021218 - Cellar Beware.avi`
  - `absolute_episode`: python `undefined` · js `10`

`Show!.Name.2.-.10.(2016).[HorribleSubs][WEBRip]..[HD.720p]`
  - `season`: python `2016` · js `undefined`

`Show.Name.-.07.(2016).[RH].[English.Dubbed][WEBRip]..[HD.1080p]`
  - `season`: python `2016` · js `undefined`

`Show.Name.-.476-479.(2007).[HorribleSubs][WEBRip]..[HD.720p]`
  - `season`: python `2007` · js `undefined`

`Show.Name.S01E03.HDTV.Subtitulado.Esp.SC`
  - `mimetype`: python `"application/vnd.ibm.secure-container"` · js `undefined`

`Show.Name.S01E03.HDTV.Subtitulado.Espanol.SC`
  - `mimetype`: python `"application/vnd.ibm.secure-container"` · js `undefined`

`Show.Name.S01E03.HDTV.Subtitulado.Español.SC`
  - `mimetype`: python `"application/vnd.ibm.secure-container"` · js `undefined`

`Show.Name.S03.1080p.BlurayMUX.AVC.DTS-HD.MA`
  - `mimetype`: python `"application/mathematica"` · js `undefined`

`Show.Name.s10e15(233).480p.BDRip-AVC.Ukr.hurtom`
  - `episode_title`: python `undefined` · js `"233"`

`Some.Title.XViD-by.Artik[SEDG].avi`
  - `alternative_title`: python `undefined` · js `["by Artik","SEDG"]`

`Something 2 mar 2013)`
  - `title`: python `"Something 2 mar"` · js `"Something 2"`
  - `language`: python `undefined` · js `"mar"`

`Special`
  - `title`: python `"Special"` · js `undefined`
  - `type`: python `"movie"` · js `"episode"`
  - `episode_details`: python `undefined` · js `"Special"`

`srt`
  - `mimetype`: python `undefined` · js `"application/x-subrip"`

`Studio 60 Сезон 5 1080p`
  - `episode`: python `60` · js `undefined`

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

`xrv40`
  - `title`: python `"xrv40"` · js `"xr"`

`Youth.In.Revolt.(Be.Bad).2009.MULTI.1080p.LAME3*92-MEDIOZZ`
  - `alternative_title`: python `undefined` · js `"Be Bad"`

`Zoo.S02E05.1080p.WEB-DL.DD5.1.H.264.HKD/160725_02.mkv`
  - `date`: python `undefined` · js `"2016-07-25"`

## Unexamined (2)

No fixture of ours covers these and they are not in the backlog file. Each needs a verdict: adopt Python, or pin ours with a fixture that says why.

`Dark.Net.S01E06.720p.HDTV.x264-BATV -Dark.Net.2015.720p.HDTV.x264-BATV`
  - `episode_title`: python `undefined` · js `"BATV -Dark Net"`

`Dark.Net.S01E06.720p.HDTV.x264-BATV Dark.Net.2015.720p.HDTV.x264-BATV`
  - `episode_title`: python `undefined` · js `"BATV Dark Net"`

## Tracked backlog (38)

Parked in `test/fixtures/upstream-rules-pending.yml`, which is deliberately absent from `FIXTURE_FILES`. See `docs/upstream-issues.md` for the gap/divergence split.

`(1920)`
  - `year`: python `1920` · js `undefined`
  - `title`: python `undefined` · js `"1920"`

`[Deep] Tegami Bachi (REVERSE) - Letter Bee - 29 (04) test`
  - `title`: python `"Tegami Bachi"` · js `["Tegami Bachi","Letter Bee"]`
  - `episode_title`: python `"Letter Bee - 29"` · js `"test"`

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

`51`
  - `audio_channels`: python `undefined` · js `"5.1"`

`ben`
  - `title`: python `"ben"` · js `undefined`
  - `language`: python `undefined` · js `"ben"`

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

`est`
  - `title`: python `"est"` · js `undefined`
  - `language`: python `undefined` · js `"est"`

`ice`
  - `title`: python `"ice"` · js `undefined`
  - `language`: python `undefined` · js `"isl"`

`mal`
  - `title`: python `"mal"` · js `undefined`
  - `language`: python `undefined` · js `"mal"`

`mar`
  - `title`: python `"mar"` · js `undefined`
  - `language`: python `undefined` · js `"mar"`

`may`
  - `title`: python `"may"` · js `undefined`
  - `language`: python `undefined` · js `"msa"`

`mon`
  - `title`: python `"mon"` · js `undefined`
  - `language`: python `undefined` · js `"mon"`

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

`Show.S01E01.Some.Title.it.srt`
  - `episode_title`: python `"Some Title"` · js `"Some Title it"`
  - `subtitle_language`: python `"ita"` · js `undefined`

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

`sr`
  - `title`: python `"sr"` · js `undefined`
  - `language`: python `undefined` · js `"srp"`

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

## Pinned — deliberate (138)

A fixture of ours asserts the JS value and passes, so the difference is a decision this port has already made and tests. Grounds are in `CHANGELOG.md` and `docs/upstream-issues.md`.

`[ACX]Neon_Genesis_Evangelion_-_Platinum_-_06_-_Showdown_in_Tokyo_3_[SaHa]_[66A8FB7D].mkv`
  - `title`: python `"Neon Genesis Evangelion"` · js `"Neon Genesis Evangelion - Platinum"`
  - `alternative_title`: python `"Platinum"` · js `undefined`

`[BOIL] Inazuma Eleven - Choujigen Dream Match (DVDrip 1280x720up) [B97A2B39].mkv`
  - `title`: python `"Inazuma Eleven"` · js `"Inazuma Eleven - Choujigen Dream Match"`
  - `episode_title`: python `"Choujigen Dream Match"` · js `undefined`

`[DB]_Bleach_264_[012073FE].avi`
  - `episode`: python `undefined` · js `264`

`[Doremi].Ro-Kyu-Bu!.SS.01.[C1B5CE5D].mkv`
  - `language`: python `"ron"` · js `undefined`
  - `title`: python `"Kyu-Bu! SS"` · js `"Ro-Kyu-Bu! SS"`

`[FFF] Seirei Tsukai no Blade Dance - SP01 [BD][720p-AAC][F1FB50A9].mkv`
  - `episode_title`: python `"SP01"` · js `undefined`
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

`2012.AC3.720p.BluRay.x264-XXL`
  - `year`: python `2012` · js `undefined`
  - `title`: python `undefined` · js `"2012"`

`2047 - Sights of Death (2014) 720p BrRip x264 - YIFY`
  - `title`: python `"2047"` · js `"2047 - Sights of Death"`
  - `alternative_title`: python `"Sights of Death"` · js `undefined`

`22.Jump.Street.GERMAN.DL.AC3.Dubbed.1080p.BluRay.x264-SOV`
  - `episode`: python `22` · js `undefined`
  - `title`: python `"Jump Street"` · js `"22 Jump Street"`
  - `type`: python `"episode"` · js `"movie"`

`a*b*c.mkv`
  - `title`: python `"a b c"` · js `"a*b*c"`

`a*b*c*d.mkv`
  - `title`: python `"a b*c*d"` · js `"a*b*c*d"`

`Apocalypse.Now.Redux.2001.1080p.BluRay.x264-GRP.mkv`
  - `title`: python `"Apocalypse Now Redux"` · js `"Apocalypse Now"`
  - `edition`: python `undefined` · js `"Redux"`

`Apollo 13 (1995) [1080p] [WEB-DL] [x264] [E-AC3-S78] [Lektor PL].mkv`
  - `season`: python `78` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`

`Avatar La Voie de l'eau.FRENCH.CAMHD.H264.AAC`
  - `release_group`: python `"CAMHD"` · js `undefined`
  - `mimetype`: python `"audio/x-aac"` · js `"audio/aac"`
  - `source`: python `undefined` · js `"HD Camera"`

`Avatar The Way of Water (2022) 1080p HQ S-Print Dual Audio.mkv`
  - `release_group`: python `"S-Print"` · js `undefined`
  - `source`: python `undefined` · js `"Camera"`

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

`Evangelion.3.0.1.11.Thrice.Upon.A.Time.2021.COMPLETE.UHD.BLURAY-NERV`
  - `title`: python `"Evangelion 3"` · js `"Evangelion 3.0.1.11 Thrice Upon A Time"`
  - `date`: python `"2000-11-01"` · js `undefined`
  - `episode_title`: python `"Thrice Upon A Time 2021"` · js `undefined`
  - `type`: python `"episode"` · js `"movie"`
  - `year`: python `undefined` · js `2021`

`Evangelion.3.0.1.11.Thrice.Upon.A.Time.2021.COMPLETE.UHD.BLURAY-NERV`
  - `title`: python `"Evangelion 3.0.1 11 Thrice Upon A Time"` · js `"Evangelion 3.0.1.11 Thrice Upon A Time"`

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
  - `episode_title`: python `"2"` · js `undefined`
  - `episode`: python `undefined` · js `2`

`Foo.2.2.bar`
  - `title`: python `"Foo 2"` · js `"Foo"`
  - `episode_title`: python `"2 bar"` · js `"bar"`
  - `episode`: python `undefined` · js `2`

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

`M*A*S*H.mkv`
  - `title`: python `"M A*S*H"` · js `"M*A*S*H"`

`M*A*S*H.S01E01.mkv`
  - `title`: python `"M*A*S H"` · js `"M*A*S*H"`

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

`Mit.dem.Bauch.durch.die.Wand.SWiSSGERMAN.DOKU.DVDRiP.x264-DEFLOW`
  - `language`: python `"deu"` · js `"deu-CH"`

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
  - `subtitle_language`: python `undefined` · js `"ara"`

`Movie.2020.1080p.BluRay.x264-GRP.chi.srt`
  - `release_group`: python `"GRP.chi"` · js `"GRP"`
  - `subtitle_language`: python `undefined` · js `"zho"`

`Movie.2020.1080p.BluRay.x264-GRP.eng.forced.srt`
  - `release_group`: python `"forced"` · js `"GRP"`
  - `other`: python `undefined` · js `"Forced"`

`Movie.2020.1080p.BluRay.x264-GRP.eng.hi.srt`
  - `language`: python `"eng"` · js `undefined`
  - `subtitle_language`: python `"hin"` · js `"eng"`
  - `other`: python `undefined` · js `"SDH"`

`Movie.2020.1080p.BluRay.x264-GRP.eng.sdh.srt`
  - `release_group`: python `"sdh"` · js `"GRP"`
  - `other`: python `undefined` · js `"SDH"`

`Movie.2020.1080p.BluRay.x264-GRP.gre.srt`
  - `release_group`: python `"GRP.gre"` · js `"GRP"`
  - `subtitle_language`: python `undefined` · js `"ell"`

`Movie.2020.1080p.BluRay.x264-GRP.indonesian.srt`
  - `release_group`: python `"GRP.indonesian"` · js `"GRP"`
  - `subtitle_language`: python `undefined` · js `"ind"`

`Movie.2020.1080p.BluRay.x264-GRP.per.srt`
  - `release_group`: python `"GRP.per"` · js `"GRP"`
  - `subtitle_language`: python `undefined` · js `"per"`

`Movie.2020.1080p.BluRay.x264-GRP.tha.srt`
  - `release_group`: python `"GRP.tha"` · js `"GRP"`
  - `subtitle_language`: python `undefined` · js `"tha"`

`Movie.2020.1080p.BluRay.x264-GRP.turkish.srt`
  - `release_group`: python `"GRP.turkish"` · js `"GRP"`
  - `subtitle_language`: python `undefined` · js `"tur"`

`Movie.2020.1080p.BluRay.x264-GRP.vie.srt`
  - `release_group`: python `"GRP.vie"` · js `"GRP"`
  - `subtitle_language`: python `undefined` · js `"vie"`

`Movie.2020.1080p.BluRay.x264-GRP.zh-Hans.srt`
  - `release_group`: python `"GRP.zh-Hans"` · js `"GRP"`
  - `subtitle_language`: python `undefined` · js `"zho"`

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

`Reizen.Waes.S03.FLEMISH.1080p.HDTV.MP2.H.264-NOGRP/Reizen.Waes.S03E05.China.PART1.FLEMISH.1080p.HDTV.MP2.H.264-NOGRP.mkv`
  - `language`: python `"nld"` · js `"nld-BE"`

`Shes the one_2013(camrip)__TOPSIDER`
  - `release_group`: python `"camrip"` · js `"TOPSIDER"`
  - `alternative_title`: python `"TOPSIDER"` · js `undefined`
  - `source`: python `undefined` · js `"Camera"`
  - `other`: python `undefined` · js `"Rip"`

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

`Show.Name.S01E07.Super, Title.WEB-DL 720p.br.srt`
  - `subtitle_language`: python `"por"` · js `"por-BR"`

`Show.Name.S06E05.1080p.WEBRip.Legenda.PT-BR`
  - `subtitle_language`: python `"por"` · js `"por-BR"`

`Show.Name.S06E05.1080p.WEBRip.Legendado.PT-BR`
  - `subtitle_language`: python `"por"` · js `"por-BR"`

`Show.Name.S06E05.1080p.WEBRip.Legendas.PT-BR`
  - `subtitle_language`: python `"por"` · js `"por-BR"`

`Show.Name.Season.2.AV1.1080p`
  - `episode_title`: python `"AV1"` · js `undefined`
  - `video_codec`: python `undefined` · js `"AV1"`

`Show.S01E01.1080p.pt-BR.mkv`
  - `language`: python `"por"` · js `"por-BR"`

`Skins Season S01-S07 COMPLETE UK Soundtrack 720p WEB-DL`
  - `title`: python `"Skins Season"` · js `"Skins"`

`Solar.Opposites.S06E05.The.Family.Memories.Vhs.Mix.Tape.1080p.WEBRip.10bit.EAC3.5.1.x265-iVy.mkv`
  - `episode_title`: python `"The Family Memories"` · js `"The Family Memories Vhs Mix Tape"`
  - `source`: python `["VHS","Web"]` · js `"Web"`

`SOME TITLE/Some.title.mkv`
  - `title`: python `"Some title"` · js `"SOME TITLE"`

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

`Thor Love and Thunder (2022) Hindi HQCAM x264 AAC.mkv`
  - `release_group`: python `"HQCAM"` · js `undefined`
  - `source`: python `undefined` · js `"Camera"`

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

`X2.2003.720p.DSNP.WEB-DL.DDP5.1.H.264-EVO.mkv`
  - `bonus`: python `2` · js `undefined`
  - `title`: python `undefined` · js `"X2"`

