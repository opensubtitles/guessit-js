/**
 * Post-processing rules
 */

import { Rule } from './rebulk.js';

export function processorsRules(config) {
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