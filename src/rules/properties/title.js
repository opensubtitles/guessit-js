/**
 * Title detection rules
 */

import { Rule } from '../rebulk.js';

export function titleRules(config) {
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