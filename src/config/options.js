/**
 * Default configuration for GuessIt JS
 * Ported from guessit/config/options.json
 */

export const defaultConfig = {
    "expected_title": [
        "OSS 117",
        "This is Us"
    ],
    "allowed_countries": [
        "au", "gb", "us"
    ],
    "allowed_languages": [
        "ca", "cs", "de", "en", "es", "fr", "he", "hi", "hu", "it", 
        "ja", "ko", "mul", "nl", "no", "pl", "pt", "ro", "ru", "sv", 
        "te", "uk", "und"
    ],
    "advanced_config": {
        "common_words": [
            "ca", "cat", "de", "he", "it", "no", "por", "rum", "se", "st", "sub"
        ],
        "groups": {
            "starting": "([{",
            "ending": ")]}"
        },
        "audio_codec": {
            "audio_codec": {
                "MP3": { "patterns": ["MP3", "LAME"], "regex": ["LAME(?:\\d)+-?(?:\\d)+"] },
                "MP2": { "patterns": ["MP2"] },
                "Dolby Digital": { "patterns": ["Dolby", "DolbyDigital"], "regex": ["Dolby-Digital", "DD", "AC-?3D?"] },
                "Dolby Atmos": { "patterns": ["Atmos"], "regex": ["Dolby-?Atmos"] },
                "AAC": { "patterns": ["AAC"] },
                "Dolby Digital Plus": { "patterns": ["DDP", "DD+"], "regex": ["E-?AC-?3"] },
                "FLAC": { "patterns": ["Flac"] },
                "DTS": { "patterns": ["DTS"] },
                "DTS-HD": { "regex": ["DTS-?HD", "DTS(?=-?MA)"] },
                "DTS:X": { "patterns": ["DTS:X", "DTS-X", "DTSX"] },
                "Dolby TrueHD": { "regex": ["True-?HD"] },
                "Opus": { "patterns": ["Opus"] },
                "Vorbis": { "patterns": ["Vorbis"] },
                "PCM": { "patterns": ["PCM"] },
                "LPCM": { "patterns": ["LPCM"] }
            }
        },
        "container": {
            "subtitles": ["srt", "idx", "sub", "ssa", "ass"],
            "info": ["nfo"],
            "videos": [
                "3g2", "3gp", "3gp2", "asf", "avi", "divx", "flv", "iso", "m4v",
                "mk2", "mk3d", "mka", "mkv", "mov", "mp4", "mp4a", "mpeg", "mpg",
                "ogg", "ogm", "ogv", "qt", "ra", "ram", "rm", "ts", "m2ts", "vob",
                "wav", "webm", "wma", "wmv"
            ],
            "torrent": ["torrent"],
            "nzb": ["nzb"]
        },
        "episodes": {
            "season_max_range": 100,
            "episode_max_range": 100,
            "max_range_gap": 1,
            "season_markers": ["s"],
            "season_ep_markers": ["x"],
            "disc_markers": ["d"],
            "episode_markers": ["xe", "ex", "ep", "e", "x"],
            "range_separators": ["-", "~", "to", "a"],
            "discrete_separators": ["+", "&", "and", "et"],
            "season_words": [
                "season", "saison", "seizoen", "seasons", "saisons", "tem",
                "temp", "temporada", "temporadas", "stagione"
            ],
            "episode_words": [
                "episode", "episodes", "eps", "ep", "episodio", "episodios",
                "capitulo", "capitulos"
            ],
            "of_words": ["of", "sur"],
            "all_words": ["All"]
        },
        "language": {
            "synonyms": {
                "ell": ["gr", "greek"],
                "spa": ["esp", "español", "espanol"],
                "fra": ["français", "vf", "vff", "vfi", "vfq"],
                "swe": ["se"],
                "por_BR": ["po", "pb", "pob", "ptbr", "br", "brazilian"],
                "deu_CH": ["swissgerman", "swiss german"],
                "nld_BE": ["flemish"],
                "cat": ["català", "castellano", "espanol castellano", "español castellano"],
                "ces": ["cz"],
                "ukr": ["ua"],
                "zho": ["cn"],
                "jpn": ["jp"],
                "hrv": ["scr"],
                "mul": ["multi", "multiple", "dl"]
            }
        },
        "screen_size": {
            "frame_rates": [
                "23\\.976", "24(?:\\.0{1,3})?", "25(?:\\.0{1,3})?", "29\\.970",
                "30(?:\\.0{1,3})?", "48(?:\\.0{1,3})?", "50(?:\\.0{1,3})?",
                "60(?:\\.0{1,3})?", "120(?:\\.0{1,3})?"
            ],
            "min_ar": 1.333,
            "max_ar": 1.898,
            "interlaced": ["360", "480", "540", "576", "900", "1080"],
            "progressive": ["360", "480", "540", "576", "900", "1080", "368", "720", "1440", "2160", "4320"]
        },
        "source": {
            "rip_prefix": "(?P<other>Rip)-?",
            "rip_suffix": "-?(?P<other>Rip)"
        },
        "website": {
            "safe_tlds": ["com", "net", "org"],
            "safe_subdomains": ["www"],
            "safe_prefixes": ["co", "com", "net", "org"],
            "prefixes": ["from"]
        }
    }
};