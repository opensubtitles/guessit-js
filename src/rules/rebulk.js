/**
 * JavaScript implementation of Rebulk pattern matching engine
 * Simplified version focusing on the core pattern matching functionality
 */

/**
 * Represents a single match found in the input string
 */
export class Match {
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
export class Matches {
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
export class Markers {
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
export class Rule {
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
export class Rebulk {
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