/**
 * Title detection rules
 */

import { Rule } from '../rebulk.js';

export function titleRules(config) {
    const rules = [];
    
    // Handle unicode and bracketed titles: [unicode].Title.year.etc
    rules.push(new Rule(
        /^(?:\[[^\]]*\]\.?)([a-zA-Z\u00C0-\u017F\u4e00-\u9fff][a-zA-Z0-9\u00C0-\u017F\u4e00-\u9fff\s\-\.\'\:]*?)(?=[\.\s\-](19|20)\d{2}|[\.\s\-]\d{3,4}p|[\.\s\-](?:bluray|hdtv|web|dvd|cam|x264|x265|h264|h265|xvid|divx|dts|aac|mkv|avi|mp4|french|english|german|spanish|italian))/gi,
        {
            name: 'title',
            formatter: (value) => {
                return value
                    .replace(/[\.\-_]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            },
            validator: (match) => {
                const value = match.value.trim();
                return value.length >= 2 && !/^\d+$/.test(value);
            },
            tags: ['title-unicode']
        }
    ));
    
    // Standard title pattern for regular filenames
    rules.push(new Rule(
        /^([a-zA-Z\u00C0-\u017F\u4e00-\u9fff][a-zA-Z0-9\u00C0-\u017F\u4e00-\u9fff\s\-\.\'\:]*?)(?=[\.\s\-](19|20)\d{2}|[\.\s\-]S\d+E\d+|[\.\s\-]\d{3,4}p|[\.\s\-](?:bluray|hdtv|web|dvd|cam|x264|x265|h264|h265|xvid|divx|dts|aac|mkv|avi|mp4|french|english|german|spanish|italian))/gi,
        {
            name: 'title',
            formatter: (value) => {
                // For titles like "Adam-12", preserve meaningful hyphens
                if (/^[a-zA-Z]+-\d+$/.test(value)) {
                    return value.replace(/[\._]/g, ' ').replace(/\s+/g, ' ').trim();
                }
                return value
                    .replace(/[\.\-_]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            },
            validator: (match) => {
                const value = match.value.trim();
                return value.length >= 3 && !/^\d+$/.test(value);
            },
            tags: ['title']
        }
    ));
    
    // Fallback: extract word sequences from anywhere in the filename
    rules.push(new Rule(
        /([a-zA-Z\u00C0-\u017F\u4e00-\u9fff][a-zA-Z0-9\u00C0-\u017F\u4e00-\u9fff\s]+[a-zA-Z0-9\u00C0-\u017F\u4e00-\u9fff])/g,
        {
            name: 'title',
            formatter: (value) => {
                return value
                    .replace(/[\.\-_]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            },
            validator: (match) => {
                const value = match.value.trim();
                // Avoid common technical terms
                const skipTerms = ['bluray', 'hdtv', 'web', 'dvd', 'x264', 'x265', 'h264', 'h265', 'xvid', 'divx', 'aac', 'dts', 'french', 'english'];
                return value.length >= 4 && !/^\d+$/.test(value) && !skipTerms.includes(value.toLowerCase());
            },
            tags: ['title-fallback'],
            private: false
        }
    ));
    
    return rules;
}