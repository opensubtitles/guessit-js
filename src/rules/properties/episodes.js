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
    
    // Episode title patterns - match text after SxxExx pattern
    rules.push(new Rule(
        /S\d+E\d+\.((?:Log\.?\d+\.)?[a-zA-Z][a-zA-Z0-9\s\-\.']*?)(?=[\.\s\-](?:REPACK|PROPER|INTERNAL|\d{3,4}p|bluray|hdtv|web|dvd|cam|x264|x265|h264|h265|xvid|divx|dts|aac|mkv|avi|mp4))/gi,
        {
            name: 'episode_title',
            formatter: (value) => {
                // Remove the Log prefix if present
                let cleaned = value.replace(/^Log\.?\d+\.?/i, '').trim();
                // Clean up separators
                cleaned = cleaned.replace(/[\.\-_]/g, ' ').replace(/\s+/g, ' ').trim();
                return cleaned;
            },
            validator: (match) => {
                const value = match.value.trim();
                return value.length >= 2 && !/^\d+$/.test(value);
            },
            tags: ['episode-title']
        }
    ));
    
    // REPACK and similar markers - exclude words that might be part of titles
    const otherMarkers = ['REPACK', 'PROPER', 'INTERNAL', 'LIMITED', 'EXTENDED', 'UNCUT', 'DIRECTORS', 'DC', 'UNRATED', 'RATED', 'FINAL', 'REAL', 'RERIP', 'REMASTERED', 'COMPLETE'];
    for (const marker of otherMarkers) {
        rules.push(new Rule(
            new RegExp(`\\b${marker}\\b`, 'gi'),
            {
                name: 'other',
                value: marker,
                tags: ['other-marker']
            }
        ));
    }
    
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