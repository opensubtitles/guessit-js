/**
 * Video codec detection rules
 */

import { Rule } from '../rebulk.js';

export function videoCodecRules(config) {
    const rules = [];
    
    const videoCodecs = {
        'H.264': ['h264', 'h.264', 'x264', 'avc'],
        'H.265': ['h265', 'h.265', 'x265', 'hevc'],
        'XviD': ['xvid'],
        'DivX': ['divx'],
        'VP9': ['vp9'],
        'AV1': ['av1'],
        'MPEG-2': ['mpeg2', 'mpeg-2'],
        'VC-1': ['vc1', 'vc-1'],
        'WMV': ['wmv']
    };
    
    for (const [codecName, patterns] of Object.entries(videoCodecs)) {
        for (const pattern of patterns) {
            rules.push(new Rule(
                new RegExp(`\\b${pattern}\\b`, 'i'),
                {
                    name: 'video_codec',
                    value: codecName,
                    tags: ['video-codec']
                }
            ));
        }
    }
    
    return rules;
}