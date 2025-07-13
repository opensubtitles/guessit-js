/**
 * Exception classes for GuessIt JS
 */

/**
 * Exception raised when guessit fails to perform a guess because of an internal error
 */
export class GuessItException extends Error {
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
export class ConfigurationException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigurationException';
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigurationException);
        }
    }
}