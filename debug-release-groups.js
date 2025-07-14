#!/usr/bin/env node
/**
 * Debug release group detection
 */

import { guessit } from './src/index.js';

const testFiles = [
    'Fear.and.Loathing.in.Las.Vegas.720p.HDDVD.DTS.x264-ESiR.mkv',
    'Dark.City.(1998).DC.BDRip.720p.DTS.X264-CHD.mkv',
    'Californication.2x05.Vaginatown.HDTV.XviD-0TV.avi',
    'Treme.1x03.Right.Place,.Wrong.Time.HDTV.XviD-NoTV.avi'
];

console.log('🔍 Testing release group detection...\n');

for (const filename of testFiles) {
    console.log(`📁 ${filename}`);
    const result = guessit(filename);
    console.log(`   Result:`, result);
    console.log(`   Release group: ${result.release_group}`);
    console.log('');
}