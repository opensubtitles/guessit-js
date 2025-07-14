/**
 * Path structure markers
 */

import { Rule } from '../rebulk.js';

export function pathRules(config) {
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