/**
 * Audio codec detection rules
 */

import { Rule } from '../rebulk.js';

export function audioCodecRules(config) {
    const rules = [];
    
    const audioCodecs = {
        'DTS': ['dts'],
        'DTS-HD': ['dts-hd', 'dtshd'],
        'DTS:X': ['dts:x', 'dts-x', 'dtsx'],
        'Dolby Digital': ['dd', 'ac3', 'dolby'],
        'Dolby Digital Plus': ['dd+', 'ddp', 'e-ac3'],
        'Dolby Atmos': ['atmos'],
        'Dolby TrueHD': ['truehd', 'true-hd'],
        'AAC': ['aac'],
        'MP3': ['mp3'],
        'FLAC': ['flac'],
        'PCM': ['pcm'],
        'LPCM': ['lpcm']
    };
    
    for (const [codecName, patterns] of Object.entries(audioCodecs)) {
        for (const pattern of patterns) {
            rules.push(new Rule(
                new RegExp(`\\b${pattern}\\b`, 'i'),
                {
                    name: 'audio_codec',
                    value: codecName,
                    tags: ['audio-codec']
                }
            ));
        }
    }
    
    return rules;
}