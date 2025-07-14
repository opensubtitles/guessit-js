/**
 * Screen size/resolution detection rules
 */

import { Rule } from '../rebulk.js';

export function screenSizeRules(config) {
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
        /(\d{3,4})x(\d{3,4})/gi,
        {
            name: 'screen_size',
            formatter: (value) => {
                const match = value.match(/(\d{3,4})x(\d{3,4})/i);
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