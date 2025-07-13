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
    
    // SxxExx patterns (S01E02, 1x02, etc.)
    rules.push(new Rule(
        `([Ss])(\\d{1,2})[\\s\\-\\.]*([Ee]|x)(\\d{1,3})`,
        {
            name: 'season_episode',
            formatter: (value) => {
                const match = value.match(/([Ss])(\d{1,2})[\s\-\.]*([Ee]|x)(\d{1,3})/);
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
    
    // Season only patterns (Season 1, S02, etc.)
    for (const marker of seasonMarkers) {
        rules.push(new Rule(
            `${marker}(\\d{1,2})`,
            {
                name: 'season',
                formatter: (value) => {
                    const match = value.match(/\\d+/);
                    return match ? parseInt(match[0], 10) : value;
                },
                tags: ['season-only']
            }
        ));
    }
    
    // Episode only patterns (E02, Episode 5, etc.)
    for (const marker of episodeMarkers) {
        rules.push(new Rule(
            `${marker}(\\d{1,3})`,
            {
                name: 'episode',
                formatter: (value) => {
                    const match = value.match(/\\d+/);
                    return match ? parseInt(match[0], 10) : value;
                },
                tags: ['episode-only']
            }
        ));
    }
    
    // Episode words (Episode 5, Episodio 3, etc.)
    const episodeWords = config.episode_words || ['episode', 'episodes'];
    for (const word of episodeWords) {
        rules.push(new Rule(
            `${word}\\s*(\\d{1,3})`,
            {
                name: 'episode',
                formatter: (value) => {
                    const match = value.match(/\\d+/);
                    return match ? parseInt(match[0], 10) : value;
                },
                tags: ['episode-word']
            }
        ));
    }
    
    // Season words (Season 1, Temporada 2, etc.)
    const seasonWords = config.season_words || ['season', 'seasons'];
    for (const word of seasonWords) {
        rules.push(new Rule(
            `${word}\\s*(\\d{1,2})`,
            {
                name: 'season',
                formatter: (value) => {
                    const match = value.match(/\\d+/);
                    return match ? parseInt(match[0], 10) : value;
                },
                tags: ['season-word']
            }
        ));
    }
    
    // Weak episode patterns (just numbers that might be episodes)
    rules.push(new Rule(
        `\\b(\\d{2,4})\\b`,
        {
            name: 'episode',
            formatter: (value) => parseInt(value, 10),
            tags: ['weak-episode'],
            validator: (match) => {
                // Only valid if it looks like an episode number
                const num = parseInt(match.value, 10);
                return num > 0 && num <= (config.episode_max_range || 999);
            }
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