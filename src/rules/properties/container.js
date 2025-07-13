/**
 * Container/file extension detection rules
 */

import { Rule } from '../rebulk.js';

export function containerRules(config) {
    const rules = [];
    
    const containers = {
        videos: config.videos || [
            '3g2', '3gp', '3gp2', 'asf', 'avi', 'divx', 'flv', 'iso', 'm4v',
            'mk2', 'mk3d', 'mka', 'mkv', 'mov', 'mp4', 'mp4a', 'mpeg', 'mpg',
            'ogg', 'ogm', 'ogv', 'qt', 'ra', 'ram', 'rm', 'ts', 'm2ts', 'vob',
            'wav', 'webm', 'wma', 'wmv'
        ],
        subtitles: config.subtitles || ['srt', 'idx', 'sub', 'ssa', 'ass'],
        info: config.info || ['nfo'],
        torrent: config.torrent || ['torrent'],
        nzb: config.nzb || ['nzb']
    };
    
    for (const [type, extensions] of Object.entries(containers)) {
        for (const ext of extensions) {
            rules.push(new Rule(
                new RegExp(`\\.${ext}$`, 'i'),
                {
                    name: 'container',
                    value: ext.toLowerCase(),
                    tags: ['container', type]
                }
            ));
        }
    }
    
    return rules;
}

