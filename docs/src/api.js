/**
 * Main API class for GuessIt JS
 */

import { GuessItException } from './exceptions.js';
import { parseOptions, loadConfig, mergeOptions } from './options.js';
import { RebulkBuilder } from './rules/index.js';

/**
 * Main GuessIt API class
 */
export class GuessItApi {
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