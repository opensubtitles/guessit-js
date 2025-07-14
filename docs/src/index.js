/**
 * GuessIt JavaScript Implementation
 * Extracts metadata from video filenames
 */

import { GuessItApi } from './api.js';
import { parseOptions, loadConfig, mergeOptions } from './options.js';

// Default API instance
const defaultApi = new GuessItApi();

/**
 * Configure the default API instance
 * @param {Object} options - Configuration options
 * @param {Function} rulesBuilder - Custom rules builder function
 * @param {boolean} force - Force reconfiguration
 */
export function configure(options = null, rulesBuilder = null, force = false) {
    defaultApi.configure(options, rulesBuilder, force);
}

/**
 * Reset the default API instance
 */
export function reset() {
    defaultApi.reset();
}

/**
 * Main guessing function - extracts metadata from filename
 * @param {string} filename - The filename or release name to parse
 * @param {Object|string} options - Parsing options
 * @returns {Object} Extracted metadata
 */
export function guessit(filename, options = null) {
    return defaultApi.guessit(filename, options);
}

/**
 * Get all available properties that can be guessed
 * @param {Object|string} options - Options
 * @returns {Object} Available properties and their possible values
 */
export function properties(options = null) {
    return defaultApi.properties(options);
}

/**
 * Get suggested expected titles based on input titles
 * @param {Array|Set|Object} titles - List of titles to analyze
 * @param {Object|string} options - Options
 * @returns {Array} Suggested titles for expected_title option
 */
export function suggestedExpected(titles, options = null) {
    return defaultApi.suggestedExpected(titles, options);
}

// Export the main API class and utilities
export { GuessItApi, parseOptions, loadConfig, mergeOptions };

// Export exception classes
export { GuessItException } from './exceptions.js';

// Default export for CommonJS compatibility
export default {
    guessit,
    configure,
    reset,
    properties,
    suggestedExpected,
    GuessItApi,
    GuessItException: () => import('./exceptions.js').then(m => m.GuessItException)
};