#!/usr/bin/env node
/**
 * Debug episode pattern detection
 */

import { guessit } from './src/index.js';

const testFiles = [
    'show.1x05.mkv',
    'show.2x10.mkv', 
    'Breaking.Bad.3x07.One.Minute.HDTV.XviD-FQM.avi',
    'Californication.2x05.Vaginatown.HDTV.XviD-0TV.avi',
    'Treme.1x03.Right.Place,.Wrong.Time.HDTV.XviD-NoTV.avi'
];

console.log('🔍 Testing episode pattern detection...\n');

for (const filename of testFiles) {
    console.log(`📁 ${filename}`);
    const result = guessit(filename);
    console.log(`   Result:`, result);
    console.log(`   Season: ${result.season}, Episode: ${result.episode}`);
    console.log(`   Season_episode: ${JSON.stringify(result.season_episode)}`);
    console.log('');
}