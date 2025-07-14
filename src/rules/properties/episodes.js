/**
 * Episode and season detection rules
 */

import { Rule } from '../rebulk.js';

export function episodeRules(config) {
    const rules = [];
    
    const seasonMarkers = config.season_markers || ['s'];
    const episodeMarkers = config.episode_markers || ['e', 'ep', 'x'];
    const rangeSeparators = config.range_separators || ['-', '~', 'to'];
    const discreteSeparators = config.discrete_separators || ['+', '&', 'and'];
    
    // SxxExx patterns (S01E02, S01E02, 1x02, etc.)
    rules.push(new Rule(
        /([Ss])(\d{1,2})[\s\-\.]*([Ee])(\d{1,3})/g,
        {
            name: 'season_episode',
            formatter: (value) => {
                const match = value.match(/([Ss])(\d{1,2})[\s\-\.]*([Ee])(\d{1,3})/);
                if (match) {
                    return {
                        season: parseInt(match[2], 10),
                        episode: parseInt(match[4], 10)
                    };
                }
                return value;
            },
            tags: ['SxxExx']
        }
    ));
    
    // NxNN patterns (1x02, 2x10, etc.)
    rules.push(new Rule(
        /(\d{1,2})x(\d{1,3})/gi,
        {
            name: 'season_episode',
            formatter: (value) => {
                const match = value.match(/(\d{1,2})x(\d{1,3})/i);
                if (match) {
                    return {
                        season: parseInt(match[1], 10),
                        episode: parseInt(match[2], 10)
                    };
                }
                return value;
            },
            tags: ['NxNN']
        }
    ));
    
    // Season only patterns (S02, etc.)
    rules.push(new Rule(
        /[Ss](\d{1,2})/g,
        {
            name: 'season',
            formatter: (value) => {
                const match = value.match(/(\d+)/);
                return match ? parseInt(match[1], 10) : value;
            },
            tags: ['season-only']
        }
    ));
    
    // Episode only patterns (E02, etc.)
    rules.push(new Rule(
        /[Ee](\d{1,3})/g,
        {
            name: 'episode',
            formatter: (value) => {
                const match = value.match(/(\d+)/);
                return match ? parseInt(match[1], 10) : value;
            },
            tags: ['episode-only']
        }
    ));
    
    // Episode words (Episode 5, Episodio 3, etc.)
    rules.push(new Rule(
        /\b(?:episode|episodes)\s*(\d{1,3})\b/gi,
        {
            name: 'episode',
            formatter: (value) => {
                const match = value.match(/(\d+)/);
                return match ? parseInt(match[1], 10) : value;
            },
            tags: ['episode-word']
        }
    ));
    
    // Season words (Season 1, Temporada 2, etc.)
    rules.push(new Rule(
        /\b(?:season|seasons)\s*(\d{1,2})\b/gi,
        {
            name: 'season',
            formatter: (value) => {
                const match = value.match(/(\d+)/);
                return match ? parseInt(match[1], 10) : value;
            },
            tags: ['season-word']
        }
    ));
    
    // Episode details
    const episodeDetails = ['Special', 'Pilot', 'Unaired', 'Final'];
    for (const detail of episodeDetails) {
        rules.push(new Rule(
            detail,
            {
                name: 'episode_details',
                value: detail,
                tags: ['episode-detail']
            }
        ));
    }
    
    return rules;
}