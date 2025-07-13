/**
 * Options parsing and configuration management
 */

import { ConfigurationException } from './exceptions.js';
import { defaultConfig } from './config/options.js';

/**
 * Parse command line style options string or object
 * @param {string|Object|Array} options - Options to parse
 * @param {boolean} api - Whether this is for API use
 * @returns {Object} Parsed options object
 */
export function parseOptions(options = null, api = false) {
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
export function loadConfig(options = {}) {
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
export function mergeOptions(...optionsArray) {
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