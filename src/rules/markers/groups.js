/**
 * Group markers for content in brackets, parentheses, etc.
 */

import { Rule } from '../rebulk.js';

export function groupRules(config) {
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