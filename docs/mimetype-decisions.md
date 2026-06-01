# mimetype divergences — fix / don't-fix decisions

guessit-js uses a hardcoded extension→mimetype map (`src/rules/properties/mimetype.ts`,
no runtime dependency). Python derives mimetype from the host OS `/etc/mime.types`,
which yields several semantically-wrong values for media files. We only add entries
that are *correct*, and intentionally leave the bogus ones as `undefined`.

## ✅ FIX — add to the map (correct values)

| ext | value we use | vs Python | rationale |
|-----|--------------|-----------|-----------|
| `.srt` | `text/plain` | same | SubRip subtitles are plain text (9 cases) |
| `.ts`  | `video/mp2t` | **diverge** (Python: `text/vnd.trolltech.linguist`) | MPEG transport stream (Blu-ray/DVD/broadcast). `video/mp2t` is the correct IANA type; Python's value is a Qt-Linguist artifact |
| `.iso` | `application/x-iso9660-image` | same | ISO 9660 disc image — genuinely correct |
| `.torrent` | `application/x-bittorrent` | same | the real torrent mimetype (5 cases) |

## 🚫 DON'T FIX — leave `undefined` (Python's value is bogus)

| ext | Python's bogus value | why skip |
|-----|----------------------|----------|
| `.com` | `application/x-msdos-program` | it's a domain in the release name (`MkvCage.com`), not an executable |
| `.sc`  | `application/vnd.ibm.secure-container` | `Esp.SC` is a Spanish-subtitle release tag, not a file type |
| `.tm`  | `text/texmacs` | `…Subbed.TM` is a release-group/tag suffix, not a TeXmacs file |
| `.ma`  | `application/mathematica` | from `…DTS-HD.MA` (Master Audio), not a Mathematica file |
| `.pt`  | `application/vnd.snesdev-page-table` | from `…Legendado.PT` (Portuguese), not an SNES page table |

After this change, `.ts` still shows as a pydiff *difference* (our `video/mp2t`
vs Python's bogus value) but it is a **KEEP** (we're more correct), not a defect.

## Related non-mimetype fixes bundled with these cases

- **`.tm` case** `Show.Name.S01.Season.Complet.WEBRiP.Ro.Subbed.TM` — Romanian code:
  Python `ron`, JS `rum`. Same language (ISO 639-2/T `ron` vs /B `rum`); standardise
  on `ron` to match Python and modern usage.
- **`.sc` case** `Show.Name.S01E03.HDTV.Subtitulado.Esp.SC` — `subtitle_language`
  duplicated as `["spa","spa"]`; collapse to one `spa` (dup-language fix).
