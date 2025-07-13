/**
 * GuessIt JS - Bundled Version
 * Generated at 2025-07-13T22:05:17.604Z
 */

// === Exceptions Module ===
/**
 * Exception classes for GuessIt JS
 */

/**
 * Exception raised when guessit fails to perform a guess because of an internal error
 */
class GuessItException extends Error {
    constructor(inputString, options, originalError = null) {
        const version = "1.0.0"; // TODO: Get from package.json
        
        const message = [
            "An internal error has occurred in guessit-js.",
            "===================== Guessit Exception Report =====================",
            `version=${version}`,
            `string=${inputString}`,
            `options=${JSON.stringify(options)}`,
            "--------------------------------------------------------------------",
            originalError ? originalError.stack || originalError.message : "Unknown error",
            "--------------------------------------------------------------------",
            "Please report at https://github.com/guessit-io/guessit/issues.",
            "===================================================================="
        ].join('\n');
        
        super(message);
        
        this.name = 'GuessItException';
        this.inputString = inputString;
        this.options = options;
        this.originalError = originalError;
        
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GuessItException);
        }
    }
}

/**
 * Exception related to configuration
 */
class ConfigurationException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigurationException';
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigurationException);
        }
    }
}

// === Configuration Module ===
/**
 * Default configuration for GuessIt JS
 * Ported from guessit/config/options.json
 */

const defaultConfig = {
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

// === Options Module ===
/**
 * Options parsing and configuration management
 */




/**
 * Parse command line style options string or object
 * @param {string|Object|Array} options - Options to parse
 * @param {boolean} api - Whether this is for API use
 * @returns {Object} Parsed options object
 */
function parseOptions(options = null, api = false) {
    if (typeof options === 'string') {
        // Simple string parsing - in real implementation you'd want a proper CLI parser
        const args = options.split(/\s+/).filter(arg => arg.length > 0);
        return parseArgs(args);
    } else if (options === null || options === undefined) {
        return api ? {} : {};
    } else if (Array.isArray(options)) {
        return parseArgs(options);
    } else if (typeof options === 'object') {
        return { ...options };
    }
    
    return {};
}

/**
 * Simple argument parser for basic CLI-style options
 * @param {Array} args - Array of argument strings
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg.startsWith('--')) {
            const key = arg.slice(2).replace(/-/g, '_');
            if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                options[key] = args[++i];
            } else {
                options[key] = true;
            }
        } else if (arg.startsWith('-') && arg.length === 2) {
            const key = getShortOptionKey(arg[1]);
            if (key) {
                if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                    options[key] = args[++i];
                } else {
                    options[key] = true;
                }
            }
        } else if (!arg.startsWith('-')) {
            // Positional argument (filename)
            if (!options.filename) {
                options.filename = [arg];
            } else {
                options.filename.push(arg);
            }
        }
    }
    
    return options;
}

/**
 * Map short options to their full names
 * @param {string} shortOpt - Single character option
 * @returns {string} Full option name
 */
function getShortOptionKey(shortOpt) {
    const mapping = {
        't': 'type',
        'n': 'name_only',
        'Y': 'date_year_first',
        'D': 'date_day_first',
        'L': 'allowed_languages',
        'C': 'allowed_countries',
        'E': 'episode_prefer_number',
        'T': 'expected_title',
        'G': 'expected_group',
        'f': 'input_file',
        'v': 'verbose',
        'P': 'show_property',
        'a': 'advanced',
        's': 'single_value',
        'l': 'enforce_list',
        'j': 'json',
        'y': 'yaml',
        'i': 'output_input_string',
        'c': 'config',
        'p': 'properties',
        'V': 'values'
    };
    return mapping[shortOpt];
}

/**
 * Load configuration from various sources
 * @param {Object} options - Options that may specify config sources
 * @returns {Object} Merged configuration
 */
function loadConfig(options = {}) {
    const configurations = [];
    
    // Load default configuration unless disabled
    if (!options.no_default_config) {
        configurations.push(defaultConfig);
    }
    
    // In a real implementation, you'd load from:
    // - ~/.guessit/options.json
    // - ~/.config/guessit/options.json
    // - Custom config files from options.config
    
    let config = {};
    if (configurations.length > 0) {
        config = mergeOptions(...configurations);
    }
    
    // Ensure advanced_config is always present
    if (!config.advanced_config && defaultConfig.advanced_config) {
        config.advanced_config = defaultConfig.advanced_config;
    }
    
    return config;
}

/**
 * Merge multiple options objects
 * @param {...Object} optionsArray - Multiple options objects to merge
 * @returns {Object} Merged options
 */
function mergeOptions(...optionsArray) {
    let merged = {};
    
    for (const options of optionsArray) {
        if (!options) continue;
        
        const pristine = options.pristine;
        
        if (pristine === true) {
            merged = {};
        } else if (Array.isArray(pristine)) {
            for (const key of pristine) {
                delete merged[key];
            }
        }
        
        for (const [key, value] of Object.entries(options)) {
            mergeOptionValue(key, value, merged);
        }
    }
    
    return merged;
}

/**
 * Merge a single option value into the merged object
 * @param {string} option - Option key
 * @param {*} value - Option value
 * @param {Object} merged - Target object to merge into
 */
function mergeOptionValue(option, value, merged) {
    if (value !== null && value !== undefined && option !== 'pristine') {
        if (merged[option] && Array.isArray(merged[option])) {
            const values = Array.isArray(value) ? value : [value];
            for (const val of values) {
                if (val !== null && val !== undefined && !merged[option].includes(val)) {
                    merged[option].push(val);
                }
            }
        } else if (merged[option] && typeof merged[option] === 'object' && typeof value === 'object') {
            merged[option] = mergeOptions(merged[option], value);
        } else if (Array.isArray(value)) {
            merged[option] = [...value];
        } else {
            merged[option] = value;
        }
    }
}

// === Rebulk Engine ===
/**
 * JavaScript implementation of Rebulk pattern matching engine
 * Simplified version focusing on the core pattern matching functionality
 */

/**
 * Represents a single match found in the input string
 */
class Match {
    constructor(start, end, value = null, name = null, options = {}) {
        this.start = start;
        this.end = end;
        this.value = value !== null ? value : '';
        this.name = name;
        this.tags = options.tags || [];
        this.private = options.private || false;
        this.children = options.children || [];
        this.parent = options.parent || null;
        this.raw = options.raw || '';
        this.initiator = options.initiator || null;
        this.formatter = options.formatter || null;
        this.validator = options.validator || null;
    }

    /**
     * Get the span (start, end) of this match
     */
    get span() {
        return [this.start, this.end];
    }

    /**
     * Get the length of this match
     */
    get length() {
        return this.end - this.start;
    }

    /**
     * Apply formatter to the match value
     */
    format() {
        if (this.formatter && typeof this.formatter === 'function') {
            try {
                this.value = this.formatter(this.value);
            } catch (error) {
                // If formatting fails, keep original value
                console.warn('Formatting failed for match:', this, error);
            }
        }
    }

    /**
     * Validate the match
     */
    validate() {
        if (this.validator && typeof this.validator === 'function') {
            try {
                return this.validator(this);
            } catch (error) {
                console.warn('Validation failed for match:', this, error);
                return false;
            }
        }
        return true;
    }

    /**
     * Split this match using separators
     */
    split(separators, valueFunction = null) {
        const parts = [];
        let currentStart = this.start;
        
        for (let i = this.start; i < this.end; i++) {
            const char = this.raw[i - this.start];
            if (separators.includes(char)) {
                if (currentStart < i) {
                    const part = new Match(currentStart, i);
                    part.raw = this.raw.slice(currentStart - this.start, i - this.start);
                    part.value = valueFunction ? valueFunction(part) : part.raw;
                    parts.push(part);
                }
                currentStart = i + 1;
            }
        }
        
        // Add final part
        if (currentStart < this.end) {
            const part = new Match(currentStart, this.end);
            part.raw = this.raw.slice(currentStart - this.start);
            part.value = valueFunction ? valueFunction(part) : part.raw;
            parts.push(part);
        }
        
        return parts;
    }
}

/**
 * Collection of matches with utility methods
 */
class Matches {
    constructor(inputString = '') {
        this.inputString = inputString;
        this.matches = [];
        this.markers = new Markers();
    }

    /**
     * Add a match to the collection
     */
    add(match) {
        if (match instanceof Match) {
            this.matches.push(match);
        }
    }

    /**
     * Get matches by name
     */
    named(name, predicate = null) {
        const filtered = this.matches.filter(match => match.name === name);
        return predicate ? filtered.filter(predicate) : filtered;
    }

    /**
     * Get matches with specific tags
     */
    tagged(tag, predicate = null) {
        const filtered = this.matches.filter(match => match.tags.includes(tag));
        return predicate ? filtered.filter(predicate) : filtered;
    }

    /**
     * Get matches in a specific range
     */
    range(start, end, predicate = null, index = null) {
        let filtered = this.matches.filter(match => 
            match.start >= start && match.end <= end
        );
        
        if (predicate) {
            filtered = filtered.filter(predicate);
        }
        
        if (index !== null) {
            return filtered[index] || null;
        }
        
        return filtered;
    }

    /**
     * Get previous match
     */
    previous(match, predicate = null, index = 0) {
        let candidates = this.matches.filter(m => m.end <= match.start);
        if (predicate) {
            candidates = candidates.filter(predicate);
        }
        candidates.sort((a, b) => b.end - a.end); // Sort by end position descending
        return candidates[index] || null;
    }

    /**
     * Get next match
     */
    next(match, predicate = null, index = 0) {
        let candidates = this.matches.filter(m => m.start >= match.end);
        if (predicate) {
            candidates = candidates.filter(predicate);
        }
        candidates.sort((a, b) => a.start - b.start); // Sort by start position ascending
        return candidates[index] || null;
    }

    /**
     * Find holes (unmatched parts) in the input string
     */
    holes(start, end, options = {}) {
        const holes = [];
        const rangeMatches = this.range(start, end).sort((a, b) => a.start - b.start);
        
        let currentPos = start;
        
        for (const match of rangeMatches) {
            if (match.start > currentPos) {
                const hole = new Match(currentPos, match.start);
                hole.raw = this.inputString.slice(currentPos, match.start);
                hole.value = hole.raw;
                holes.push(hole);
            }
            currentPos = Math.max(currentPos, match.end);
        }
        
        // Final hole
        if (currentPos < end) {
            const hole = new Match(currentPos, end);
            hole.raw = this.inputString.slice(currentPos, end);
            hole.value = hole.raw;
            holes.push(hole);
        }
        
        return holes;
    }

    /**
     * Convert matches to dictionary format
     */
    toDict(advanced = false, singleValue = false, enforceList = false) {
        const result = {};
        const propertyGroups = {};
        
        // Group matches by property name
        for (const match of this.matches) {
            if (match.private) continue;
            
            if (!propertyGroups[match.name]) {
                propertyGroups[match.name] = [];
            }
            propertyGroups[match.name].push(match.value);
        }
        
        // Process each property
        for (const [property, values] of Object.entries(propertyGroups)) {
            // Remove duplicates while preserving order
            const uniqueValues = [...new Set(values)];
            
            if (singleValue && uniqueValues.length > 0) {
                result[property] = uniqueValues[0];
            } else if (enforceList || uniqueValues.length > 1) {
                result[property] = uniqueValues;
            } else if (uniqueValues.length === 1) {
                result[property] = uniqueValues[0];
            }
        }
        
        return result;
    }
}

/**
 * Markers for structural elements like groups and paths
 */
class Markers {
    constructor() {
        this.markerList = [];
    }

    /**
     * Add a marker
     */
    add(marker) {
        this.markerList.push(marker);
    }

    /**
     * Get markers by name
     */
    named(name) {
        return this.markerList.filter(marker => marker.name === name);
    }

    /**
     * Get marker at specific match position
     */
    atMatch(match, predicate = null, index = 0) {
        let candidates = this.markerList.filter(marker => 
            marker.start <= match.start && marker.end >= match.end
        );
        
        if (predicate) {
            candidates = candidates.filter(predicate);
        }
        
        return candidates[index] || null;
    }

    /**
     * Get markers starting at position
     */
    starting(position, predicate = null) {
        let candidates = this.markerList.filter(marker => marker.start === position);
        if (predicate) {
            candidates = candidates.filter(predicate);
        }
        return candidates;
    }
}

/**
 * Rule for pattern matching
 */
class Rule {
    constructor(pattern, options = {}) {
        this.pattern = pattern;
        this.name = options.name || null;
        this.value = options.value || null;
        this.tags = options.tags || [];
        this.formatter = options.formatter || null;
        this.validator = options.validator || null;
        this.private = options.private || false;
        this.children = options.children || false;
        this.conflictSolver = options.conflictSolver || null;
    }

    /**
     * Apply this rule to input string
     */
    apply(inputString, matches, options = {}) {
        let regex;
        
        if (this.pattern instanceof RegExp) {
            regex = this.pattern;
        } else if (typeof this.pattern === 'string') {
            // Handle case insensitive matching
            const flags = options.ignoreCase ? 'gi' : 'g';
            regex = new RegExp(this.pattern, flags);
        } else {
            return [];
        }

        const newMatches = [];
        let match;
        
        while ((match = regex.exec(inputString)) !== null) {
            const matchObj = new Match(
                match.index,
                match.index + match[0].length,
                this.value || match[0],
                this.name,
                {
                    tags: [...this.tags],
                    private: this.private,
                    raw: match[0],
                    formatter: this.formatter,
                    validator: this.validator
                }
            );
            
            // Apply formatting
            matchObj.format();
            
            // Validate
            if (matchObj.validate()) {
                newMatches.push(matchObj);
            }
        }
        
        return newMatches;
    }
}

/**
 * Main Rebulk class - coordinates pattern matching
 */
class Rebulk {
    constructor(options = {}) {
        this.rules = [];
        this.options = {
            ignoreCase: options.ignoreCase || false,
            ...options
        };
    }

    /**
     * Add rules to this Rebulk instance
     */
    addRules(rules) {
        if (Array.isArray(rules)) {
            this.rules.push(...rules);
        } else if (rules) {
            this.rules.push(rules);
        }
    }

    /**
     * Add a string pattern rule
     */
    string(pattern, options = {}) {
        const rule = new Rule(pattern, options);
        this.rules.push(rule);
        return this;
    }

    /**
     * Add a regex pattern rule
     */
    regex(pattern, options = {}) {
        const rule = new Rule(new RegExp(pattern, this.options.ignoreCase ? 'gi' : 'g'), options);
        this.rules.push(rule);
        return this;
    }

    /**
     * Apply all rules to input string and return matches
     */
    matches(inputString, options = {}) {
        const matches = new Matches(inputString);
        const mergedOptions = { ...this.options, ...options };
        
        // Add path markers (simplified)
        this.addPathMarkers(matches, inputString);
        
        // Apply all rules
        for (const rule of this.rules) {
            const ruleMatches = rule.apply(inputString, matches, mergedOptions);
            for (const match of ruleMatches) {
                matches.add(match);
            }
        }
        
        // Post-process matches (remove conflicts, apply final formatting, etc.)
        this.postProcessMatches(matches);
        
        return matches;
    }

    /**
     * Add basic path markers for file structure
     */
    addPathMarkers(matches, inputString) {
        // Split by common path separators and file extensions
        const pathSeparators = /[\/\\]/g;
        const parts = inputString.split(pathSeparators);
        
        let currentPos = 0;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.length > 0) {
                const marker = new Match(currentPos, currentPos + part.length);
                marker.name = 'path';
                marker.private = true;
                matches.markers.add(marker);
            }
            currentPos += part.length + 1; // +1 for separator
        }
    }

    /**
     * Post-process matches to resolve conflicts and clean up
     */
    postProcessMatches(matches) {
        // Remove overlapping matches based on priorities and conflict solvers
        // Sort matches by start position
        matches.matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
        
        // Simple conflict resolution - keep longer matches
        const filtered = [];
        for (const match of matches.matches) {
            const overlapping = filtered.filter(existing => 
                !(match.end <= existing.start || match.start >= existing.end)
            );
            
            if (overlapping.length === 0) {
                filtered.push(match);
            } else {
                // Keep the match with higher priority (longer for now)
                const longer = overlapping.find(existing => existing.length < match.length);
                if (longer) {
                    const index = filtered.indexOf(longer);
                    filtered.splice(index, 1);
                    filtered.push(match);
                }
            }
        }
        
        matches.matches = filtered;
    }

    /**
     * Introspect the rebulk to get available properties
     */
    introspect(options = {}) {
        const properties = {};
        
        for (const rule of this.rules) {
            if (rule.name && !rule.private) {
                if (!properties[rule.name]) {
                    properties[rule.name] = new Set();
                }
                if (rule.value) {
                    properties[rule.name].add(rule.value);
                }
            }
        }
        
        return { properties };
    }
}

// === Rule Modules ===
/**
 * Episode and season detection rules
 */



function episodeRules(config) {
    const rules = [];
    
    const seasonMarkers = config.season_markers || ['s'];
    const episodeMarkers = config.episode_markers || ['e', 'ep', 'x'];
    const rangeSeparators = config.range_separators || ['-', '~', 'to'];
    const discreteSeparators = config.discrete_separators || ['+', '&', 'and'];
    
    // SxxExx patterns (S01E02, 1x02, etc.)
    rules.push(new Rule(
        `([Ss])(\\d{1,2})[\\s\\-\\.]*([Ee]|x)(\\d{1,3})`,
        {
            name: 'season_episode',
            formatter: (value) => {
                const match = value.match(/([Ss])(\d{1,2})[\s\-\.]*([Ee]|x)(\d{1,3})/);
                if (match) {
                    return {
                        season: parseInt(match[2], 10),
                        episode: parseInt(match[4], 10)
                    };
                }
                return value;
            },
            tags: ['SxxExx']
        }
    ));
    
    // Season only patterns (Season 1, S02, etc.)
    for (const marker of seasonMarkers) {
        rules.push(new Rule(
            `${marker}(\\d{1,2})`,
            {
                name: 'season',
                formatter: (value) => {
                    const match = value.match(/\\d+/);
                    return match ? parseInt(match[0], 10) : value;
                },
                tags: ['season-only']
            }
        ));
    }
    
    // Episode only patterns (E02, Episode 5, etc.)
    for (const marker of episodeMarkers) {
        rules.push(new Rule(
            `${marker}(\\d{1,3})`,
            {
                name: 'episode',
                formatter: (value) => {
                    const match = value.match(/\\d+/);
                    return match ? parseInt(match[0], 10) : value;
                },
                tags: ['episode-only']
            }
        ));
    }
    
    // Episode words (Episode 5, Episodio 3, etc.)
    const episodeWords = config.episode_words || ['episode', 'episodes'];
    for (const word of episodeWords) {
        rules.push(new Rule(
            `${word}\\s*(\\d{1,3})`,
            {
                name: 'episode',
                formatter: (value) => {
                    const match = value.match(/\\d+/);
                    return match ? parseInt(match[0], 10) : value;
                },
                tags: ['episode-word']
            }
        ));
    }
    
    // Season words (Season 1, Temporada 2, etc.)
    const seasonWords = config.season_words || ['season', 'seasons'];
    for (const word of seasonWords) {
        rules.push(new Rule(
            `${word}\\s*(\\d{1,2})`,
            {
                name: 'season',
                formatter: (value) => {
                    const match = value.match(/\\d+/);
                    return match ? parseInt(match[0], 10) : value;
                },
                tags: ['season-word']
            }
        ));
    }
    
    // Weak episode patterns (just numbers that might be episodes)
    rules.push(new Rule(
        `\\b(\\d{2,4})\\b`,
        {
            name: 'episode',
            formatter: (value) => parseInt(value, 10),
            tags: ['weak-episode'],
            validator: (match) => {
                // Only valid if it looks like an episode number
                const num = parseInt(match.value, 10);
                return num > 0 && num <= (config.episode_max_range || 999);
            }
        }
    ));
    
    // Episode details
    const episodeDetails = ['Special', 'Pilot', 'Unaired', 'Final'];
    for (const detail of episodeDetails) {
        rules.push(new Rule(
            detail,
            {
                name: 'episode_details',
                value: detail,
                tags: ['episode-detail']
            }
        ));
    }
    
    return rules;
}
/**
 * Title detection rules
 */



function titleRules(config) {
    const rules = [];
    
    // Title is usually extracted from gaps between other matches
    // This is a simplified version - the real implementation would be much more complex
    
    // Basic title pattern - anything that doesn't match other patterns
    rules.push(new Rule(
        /([a-zA-Z0-9][a-zA-Z0-9\s\-\.\'\:]+)/g,
        {
            name: 'title',
            formatter: (value) => {
                // Clean up title
                return value
                    .replace(/[\.\-_]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            },
            validator: (match) => {
                // Don't match if it's too short or looks like other properties
                const value = match.value.toLowerCase();
                
                // Skip common non-title patterns
                const skipPatterns = [
                    /^(19|20)\d{2}$/,  // Years
                    /^\d{3,4}p$/,      // Resolution
                    /^[a-z]{2,3}$/,    // Short codes
                    /^(hd|sd|uhd|4k)$/i, // Quality
                    /^(x264|x265|h264|h265|xvid|divx)$/i, // Codecs
                    /^(dvd|bluray|webrip|hdtv|cam)$/i, // Source
                ];
                
                for (const pattern of skipPatterns) {
                    if (pattern.test(value)) {
                        return false;
                    }
                }
                
                return value.length > 2;
            },
            tags: ['title-candidate']
        }
    ));
    
    return rules;
}
/**
 * Video codec detection rules
 */



function videoCodecRules(config) {
    const rules = [];
    
    const videoCodecs = {
        'H.264': ['h264', 'h.264', 'x264', 'avc'],
        'H.265': ['h265', 'h.265', 'x265', 'hevc'],
        'XviD': ['xvid'],
        'DivX': ['divx'],
        'VP9': ['vp9'],
        'AV1': ['av1'],
        'MPEG-2': ['mpeg2', 'mpeg-2'],
        'VC-1': ['vc1', 'vc-1'],
        'WMV': ['wmv']
    };
    
    for (const [codecName, patterns] of Object.entries(videoCodecs)) {
        for (const pattern of patterns) {
            rules.push(new Rule(
                new RegExp(`\\b${pattern}\\b`, 'i'),
                {
                    name: 'video_codec',
                    value: codecName,
                    tags: ['video-codec']
                }
            ));
        }
    }
    
    return rules;
}
/**
 * Screen size/resolution detection rules
 */



function screenSizeRules(config) {
    const rules = [];
    
    // Common resolution patterns
    const resolutions = {
        '240p': ['240p'],
        '360p': ['360p'],
        '480p': ['480p', 'sd'],
        '720p': ['720p', 'hd'],
        '1080p': ['1080p', '1080i', 'fhd', 'fullhd', 'full hd'],
        '1440p': ['1440p', '2k'],
        '2160p': ['2160p', '4k', 'uhd', 'ultra hd'],
        '4320p': ['4320p', '8k']
    };
    
    for (const [size, patterns] of Object.entries(resolutions)) {
        for (const pattern of patterns) {
            rules.push(new Rule(
                new RegExp(`\\b${pattern}\\b`, 'i'),
                {
                    name: 'screen_size',
                    value: size,
                    tags: ['resolution']
                }
            ));
        }
    }
    
    // Width x Height patterns (1920x1080, 1280x720, etc.)
    rules.push(new Rule(
        /(\\d{3,4})x(\\d{3,4})/i,
        {
            name: 'screen_size',
            formatter: (value) => {
                const match = value.match(/(\\d{3,4})x(\\d{3,4})/i);
                if (match) {
                    const width = parseInt(match[1], 10);
                    const height = parseInt(match[2], 10);
                    
                    // Map common resolutions
                    if (width === 1920 && height === 1080) return '1080p';
                    if (width === 1280 && height === 720) return '720p';
                    if (width === 3840 && height === 2160) return '2160p';
                    if (width === 2560 && height === 1440) return '1440p';
                    
                    return `${width}x${height}`;
                }
                return value;
            },
            tags: ['resolution', 'dimensions']
        }
    ));
    
    return rules;
}
/**
 * Container/file extension detection rules
 */



function containerRules(config) {
    const rules = [];
    
    const containers = {
        videos: config.videos || [
            '3g2', '3gp', '3gp2', 'asf', 'avi', 'divx', 'flv', 'iso', 'm4v',
            'mk2', 'mk3d', 'mka', 'mkv', 'mov', 'mp4', 'mp4a', 'mpeg', 'mpg',
            'ogg', 'ogm', 'ogv', 'qt', 'ra', 'ram', 'rm', 'ts', 'm2ts', 'vob',
            'wav', 'webm', 'wma', 'wmv'
        ],
        subtitles: config.subtitles || ['srt', 'idx', 'sub', 'ssa', 'ass'],
        info: config.info || ['nfo'],
        torrent: config.torrent || ['torrent'],
        nzb: config.nzb || ['nzb']
    };
    
    for (const [type, extensions] of Object.entries(containers)) {
        for (const ext of extensions) {
            rules.push(new Rule(
                new RegExp(`\\.${ext}$`, 'i'),
                {
                    name: 'container',
                    value: ext.toLowerCase(),
                    tags: ['container', type]
                }
            ));
        }
    }
    
    return rules;
}


/**
 * Source detection rules (BluRay, HDTV, WEB, etc.)
 */



function sourceRules(config) {
    const rules = [];
    
    const sources = {
        'BluRay': ['bluray', 'blu-ray', 'bdrip', 'brrip'],
        'HDTV': ['hdtv'],
        'WEB': ['web', 'webrip', 'web-dl', 'webdl'],
        'DVD': ['dvd', 'dvdrip'],
        'CAM': ['cam', 'camrip'],
        'Telesync': ['ts', 'telesync'],
        'Telecine': ['tc', 'telecine'],
        'Screener': ['scr', 'screener'],
        'VHS': ['vhs']
    };
    
    for (const [sourceName, patterns] of Object.entries(sources)) {
        for (const pattern of patterns) {
            rules.push(new Rule(
                new RegExp(`\\b${pattern}\\b`, 'i'),
                {
                    name: 'source',
                    value: sourceName,
                    tags: ['source']
                }
            ));
        }
    }
    
    return rules;
}
/**
 * Audio codec detection rules
 */



function audioCodecRules(config) {
    const rules = [];
    
    const audioCodecs = {
        'DTS': ['dts'],
        'DTS-HD': ['dts-hd', 'dtshd'],
        'DTS:X': ['dts:x', 'dts-x', 'dtsx'],
        'Dolby Digital': ['dd', 'ac3', 'dolby'],
        'Dolby Digital Plus': ['dd+', 'ddp', 'e-ac3'],
        'Dolby Atmos': ['atmos'],
        'Dolby TrueHD': ['truehd', 'true-hd'],
        'AAC': ['aac'],
        'MP3': ['mp3'],
        'FLAC': ['flac'],
        'PCM': ['pcm'],
        'LPCM': ['lpcm']
    };
    
    for (const [codecName, patterns] of Object.entries(audioCodecs)) {
        for (const pattern of patterns) {
            rules.push(new Rule(
                new RegExp(`\\b${pattern}\\b`, 'i'),
                {
                    name: 'audio_codec',
                    value: codecName,
                    tags: ['audio-codec']
                }
            ));
        }
    }
    
    return rules;
}
/**
 * Stub implementations for remaining property modules
 */

// Stub implementations that return empty rules arrays
function websiteRules(config) { return []; }
function dateRules(config) { return []; }
function episodeTitleRules(config) { return []; }
function languageRules(config, commonWords) { return []; }
function countryRules(config, commonWords) { return []; }
function releaseGroupRules(config) { return []; }
function streamingServiceRules(config) { return []; }
function otherRules(config) { return []; }
function sizeRules(config) { return []; }
function bitRateRules(config) { return []; }
function editionRules(config) { return []; }
function cdRules(config) { return []; }
function bonusRules(config) { return []; }
function filmRules(config) { return []; }
function partRules(config) { return []; }
function crcRules(config) { return []; }
function mimetypeRules(config) { return []; }
function typeRules(config) { return []; }
/**
 * Path structure markers
 */



function pathRules(config) {
    const rules = [];
    
    // Basic path structure detection
    rules.push(new Rule(
        /([^\/\\]+)/g,
        {
            name: 'path',
            private: true,
            tags: ['path-segment']
        }
    ));
    
    return rules;
}
/**
 * Group markers for content in brackets, parentheses, etc.
 */



function groupRules(config) {
    const rules = [];
    
    const starting = config.starting || '([{';
    const ending = config.ending || ')]}';
    
    // Create pairs of opening/closing characters
    const pairs = [];
    for (let i = 0; i < Math.min(starting.length, ending.length); i++) {
        pairs.push([starting[i], ending[i]]);
    }
    
    for (const [open, close] of pairs) {
        rules.push(new Rule(
            new RegExp(`\\${open}([^\\${open}\\${close}]+)\\${close}`, 'g'),
            {
                name: 'group',
                private: true,
                tags: ['group-marker']
            }
        ));
    }
    
    return rules;
}
/**
 * Post-processing rules
 */



function processorsRules(config) {
    const rules = [];
    
    // Basic cleanup and validation rules
    rules.push(new Rule(
        /.*/,
        {
            name: 'cleanup',
            private: true,
            processor: true,
            apply: (matches) => {
                // Remove duplicate matches
                const seen = new Set();
                matches.matches = matches.matches.filter(match => {
                    const key = `${match.name}-${match.start}-${match.end}`;
                    if (seen.has(key)) {
                        return false;
                    }
                    seen.add(key);
                    return true;
                });
                
                return matches;
            }
        }
    ));
    
    return rules;
}

// === Rules Builder ===
/**
 * Main rules builder - JavaScript port of rebulk pattern matching
 */



// Import rule modules












/**
 * Main rebulk builder function
 * @param {Object} config - Configuration object
 * @returns {Rebulk} Configured Rebulk instance
 */
function RebulkBuilder(config) {
    function getConfig(name) {
        return config[name] || {};
    }

    const rebulk = new Rebulk();
    const commonWords = new Set(getConfig('common_words') || []);

    // Add all rule modules to rebulk
    rebulk.addRules(pathRules(getConfig('path')));
    rebulk.addRules(groupRules(getConfig('groups')));
    
    rebulk.addRules(episodeRules(getConfig('episodes')));
    rebulk.addRules(containerRules(getConfig('container')));
    rebulk.addRules(sourceRules(getConfig('source')));
    rebulk.addRules(videoCodecRules(getConfig('video_codec')));
    rebulk.addRules(audioCodecRules(getConfig('audio_codec')));
    rebulk.addRules(screenSizeRules(getConfig('screen_size')));
    rebulk.addRules(websiteRules(getConfig('website')));
    rebulk.addRules(dateRules(getConfig('date')));
    rebulk.addRules(titleRules(getConfig('title')));
    rebulk.addRules(episodeTitleRules(getConfig('episode_title')));
    rebulk.addRules(languageRules(getConfig('language'), commonWords));
    rebulk.addRules(countryRules(getConfig('country'), commonWords));
    rebulk.addRules(releaseGroupRules(getConfig('release_group')));
    rebulk.addRules(streamingServiceRules(getConfig('streaming_service')));
    rebulk.addRules(otherRules(getConfig('other')));
    rebulk.addRules(sizeRules(getConfig('size')));
    rebulk.addRules(bitRateRules(getConfig('bit_rate')));
    rebulk.addRules(editionRules(getConfig('edition')));
    rebulk.addRules(cdRules(getConfig('cd')));
    rebulk.addRules(bonusRules(getConfig('bonus')));
    rebulk.addRules(filmRules(getConfig('film')));
    rebulk.addRules(partRules(getConfig('part')));
    rebulk.addRules(crcRules(getConfig('crc')));
    
    rebulk.addRules(processorsRules(getConfig('processors')));
    
    rebulk.addRules(mimetypeRules(getConfig('mimetype')));
    rebulk.addRules(typeRules(getConfig('type')));

    // Custom properties transformation
    rebulk.customizeProperties = function(properties) {
        if (properties.count) {
            const count = properties.count;
            delete properties.count;
            properties.season_count = count;
            properties.episode_count = count;
        }
        return properties;
    };

    return rebulk;
}

// === API Module ===
/**
 * Main API class for GuessIt JS
 */





/**
 * Main GuessIt API class
 */
class GuessItApi {
    constructor() {
        this.rebulk = null;
        this.config = null;
        this.loadConfigOptions = null;
        this.advancedConfig = null;
    }

    /**
     * Reset the API to initial state
     */
    reset() {
        this.rebulk = null;
        this.config = null;
        this.loadConfigOptions = null;
        this.advancedConfig = null;
    }

    /**
     * Fix encoding issues (mainly for compatibility with Python version)
     * @param {*} value - Value to fix
     * @returns {*} Fixed value
     */
    static _fixEncoding(value) {
        if (Array.isArray(value)) {
            return value.map(item => GuessItApi._fixEncoding(item));
        }
        if (value && typeof value === 'object') {
            const result = {};
            for (const [k, v] of Object.entries(value)) {
                result[GuessItApi._fixEncoding(k)] = GuessItApi._fixEncoding(v);
            }
            return result;
        }
        // In JavaScript, we don't have the same encoding issues as Python
        return value;
    }

    /**
     * Check if two dictionaries have the same properties
     * @param {Object} dict1 - First dictionary
     * @param {Object} dict2 - Second dictionary
     * @param {Array} values - Properties to check
     * @returns {boolean} True if properties match
     */
    static _hasSameProperties(dict1, dict2, values) {
        for (const value of values) {
            if (dict1[value] !== dict2[value]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Configure the API
     * @param {Object|string} options - Configuration options
     * @param {Function} rulesBuilder - Custom rules builder
     * @param {boolean} force - Force reconfiguration
     * @param {boolean} sanitizeOptions - Whether to sanitize options
     * @returns {Object} Configuration object
     */
    configure(options = null, rulesBuilder = null, force = false, sanitizeOptions = true) {
        if (!rulesBuilder) {
            rulesBuilder = RebulkBuilder;
        }

        if (sanitizeOptions) {
            options = parseOptions(options, true);
            options = GuessItApi._fixEncoding(options);
        }

        // Check if we need to reload config
        const needsConfigReload = 
            !this.config || 
            !this.loadConfigOptions || 
            force ||
            !GuessItApi._hasSameProperties(
                this.loadConfigOptions,
                options,
                ['config', 'no_user_config', 'no_default_config']
            );

        let config;
        if (needsConfigReload) {
            config = loadConfig(options);
            config = GuessItApi._fixEncoding(config);
            this.loadConfigOptions = { ...options };
        } else {
            config = this.config;
        }

        const advancedConfig = mergeOptions(
            config.advanced_config || {},
            options.advanced_config || {}
        );

        // Check if we need to rebuild rebulk
        const needsRebulkRebuild = 
            force ||
            !this.rebulk ||
            !this.advancedConfig ||
            JSON.stringify(this.advancedConfig) !== JSON.stringify(advancedConfig);

        if (needsRebulkRebuild) {
            this.advancedConfig = JSON.parse(JSON.stringify(advancedConfig)); // Deep copy
            this.rebulk = rulesBuilder(advancedConfig);
        }

        this.config = config;
        return this.config;
    }

    /**
     * Main guessing function
     * @param {string} filename - Filename to parse
     * @param {Object|string} options - Parsing options
     * @returns {Object} Extracted information
     */
    guessit(filename, options = null) {
        try {
            // Handle path-like objects
            if (filename && typeof filename === 'object' && filename.toString) {
                filename = filename.toString();
            }

            options = parseOptions(options, true);
            options = GuessItApi._fixEncoding(options);
            
            const config = this.configure(options, null, false, false);
            options = mergeOptions(config, options);

            // JavaScript strings are already UTF-8, no encoding issues
            const matches = this.rebulk.matches(filename, options);
            
            const matchesDict = matches.toDict(
                options.advanced || false,
                options.single_value || false,
                options.enforce_list || false
            );

            if (options.output_input_string) {
                matchesDict.input_string = filename;
            }

            return matchesDict;
        } catch (error) {
            throw new GuessItException(filename, options, error);
        }
    }

    /**
     * Get all available properties and their possible values
     * @param {Object|string} options - Options
     * @returns {Object} Properties dictionary
     */
    properties(options = null) {
        options = parseOptions(options, true);
        options = GuessItApi._fixEncoding(options);
        
        const config = this.configure(options, null, false, false);
        options = mergeOptions(config, options);

        const unordered = this.rebulk.introspect(options).properties;
        
        // Sort properties alphabetically
        const ordered = {};
        const sortedKeys = Object.keys(unordered).sort();
        
        for (const key of sortedKeys) {
            ordered[key] = Array.from(unordered[key]).sort();
        }

        // Apply custom property transformations if available
        if (this.rebulk.customizeProperties) {
            return this.rebulk.customizeProperties(ordered);
        }

        return ordered;
    }

    /**
     * Get suggested expected titles
     * @param {Array|Set|Object} titles - Titles to analyze
     * @param {Object|string} options - Options
     * @returns {Array} Suggested titles
     */
    suggestedExpected(titles, options = null) {
        const suggested = [];
        
        for (const title of titles) {
            const guess = this.guessit(title, options);
            // If guess has more than just type and title, or no title, suggest it
            if (Object.keys(guess).length !== 2 || !guess.title) {
                suggested.push(title);
            }
        }

        return suggested;
    }
}

// === Main API ===
const defaultApi = new GuessItApi();

function configure(options = null, rulesBuilder = null, force = false) {
    defaultApi.configure(options, rulesBuilder, force);
}

function reset() {
    defaultApi.reset();
}

function guessit(filename, options = null) {
    return defaultApi.guessit(filename, options);
}

function properties(options = null) {
    return defaultApi.properties(options);
}

function suggestedExpected(titles, options = null) {
    return defaultApi.suggestedExpected(titles, options);
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    // CommonJS
    module.exports = {
        guessit,
        configure,
        reset,
        properties,
        suggestedExpected,
        GuessItApi,
        GuessItException,
        parseOptions,
        loadConfig,
        mergeOptions
    };
} else if (typeof window !== 'undefined') {
    // Browser global
    window.GuessIt = {
        guessit,
        configure,
        reset,
        properties,
        suggestedExpected,
        GuessItApi,
        GuessItException
    };
} else {
    // ES modules fallback
    globalThis.GuessIt = {
        guessit,
        configure,
        reset,
        properties,
        suggestedExpected,
        GuessItApi,
        GuessItException
    };
}
