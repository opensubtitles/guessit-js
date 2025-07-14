/**
 * Stub implementations for remaining property modules
 */

import { Rule } from '../rebulk.js';

// Stub implementations that return empty rules arrays
export function websiteRules(config) { return []; }

export function dateRules(config) { 
    const rules = [];
    
    // Year detection - matches 4-digit years between 1900-2099
    rules.push(new Rule(
        /\b(19[0-9]{2}|20[0-9]{2})\b/g,
        {
            name: 'year',
            formatter: (value) => parseInt(value, 10),
            validator: (match) => {
                const year = parseInt(match.value, 10);
                return year >= 1900 && year <= 2099;
            },
            tags: ['date']
        }
    ));
    
    return rules; 
}
export function episodeTitleRules(config) { return []; }
export function languageRules(config, commonWords) { return []; }
export function countryRules(config, commonWords) { return []; }
export function releaseGroupRules(config) { 
    const rules = [];
    
    // Release groups before file extensions: match just the group name between dash and dot
    rules.push(new Rule(
        /(?<=-)[A-Z0-9]+(?=\.(?:mkv|avi|mp4|mov|wmv|flv|webm|m4v|3gp|ts|m2ts|vob|iso|img|bin|mdf|nrg|cue|rar|zip|7z|tar|gz|bz2|xz)$)/gi,
        {
            name: 'release_group',
            validator: (match) => {
                const group = match.value;
                const excludeWords = ['REPACK', 'PROPER', 'REAL', 'FINAL', 'COMPLETE', 'UNCUT', 'EXTENDED', 'DIRECTORS', 'CUT'];
                return group.length >= 2 && group.length <= 20 && !excludeWords.includes(group.toUpperCase());
            },
            tags: ['release-group']
        }
    ));
    
    // Bracketed release groups [GROUP] or (GROUP) - but exclude years
    rules.push(new Rule(
        /[\[\(]([A-Z0-9\-_.]+)[\]\)]/gi,
        {
            name: 'release_group',
            formatter: (value) => {
                const match = value.match(/[\[\(]([A-Z0-9\-_.]+)[\]\)]/i);
                return match ? match[1] : value;
            },
            validator: (match) => {
                const group = match.value;
                // Exclude years (1900-2099) and short numeric sequences
                if (/^(19|20)\d{2}$/.test(group)) return false;
                if (/^\d{1,4}$/.test(group)) return false;
                return group.length >= 2 && group.length <= 20;
            },
            tags: ['release-group-bracket']
        }
    ));
    
    return rules; 
}
export function streamingServiceRules(config) { return []; }
export function otherRules(config) { return []; }
export function sizeRules(config) { return []; }
export function bitRateRules(config) { return []; }
export function editionRules(config) { return []; }
export function cdRules(config) { return []; }
export function bonusRules(config) { return []; }
export function filmRules(config) { return []; }
export function partRules(config) { return []; }
export function crcRules(config) { return []; }
export function mimetypeRules(config) { return []; }
export function typeRules(config) { return []; }