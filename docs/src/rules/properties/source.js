/**
 * Source detection rules (BluRay, HDTV, WEB, etc.)
 */

import { Rule } from '../rebulk.js';

export function sourceRules(config) {
    const rules = [];
    
    const sources = {
        'BluRay': ['bluray'],
        'Blu-ray': ['blu-ray', 'bdrip', 'brrip'],
        'HD-DVD': ['hddvd', 'hd-dvd'],
        'HDTV': ['hdtv'],
        'WEB': ['web', 'webrip', 'web-dl', 'webdl'],
        'DVD': ['dvd', 'dvdrip'],
        'CAM': ['cam', 'camrip'],
        'Telesync': ['ts', 'telesync'],
        'Telecine': ['tc', 'telecine'],
        'Screener': ['scr', 'screener'],
        'VHS': ['vhs']
    };
    
    for (const [sourceName, patterns] of Object.entries(sources)) {
        for (const pattern of patterns) {
            rules.push(new Rule(
                new RegExp(`\\b${pattern}\\b`, 'i'),
                {
                    name: 'source',
                    value: sourceName,
                    tags: ['source']
                }
            ));
        }
    }
    
    return rules;
}