#!/usr/bin/env node
/**
 * Simple functionality test for GuessIt JS
 */

import { guessit, properties } from './src/index.js';

console.log('🧪 GuessIt JS - Simple Test\n');

// Test cases
const testCases = [
    'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv',
    'Game.of.Thrones.S01E01.Winter.Is.Coming.1080p.HDTV.x264-LOL.mkv',
    'Breaking.Bad.3x07.One.Minute.HDTV.XviD-FQM.avi',
    'Avengers.Endgame.2019.2160p.BluRay.x265.10bit.HDR.DTS-X.7.1.mkv',
    'movie.720p.mkv',
    'show.s05e14.720p.web.x264.mp4'
];

console.log('📁 Testing basic parsing:\n');

let allPassed = true;

testCases.forEach((filename, index) => {
    try {
        const result = guessit(filename);
        console.log(`${index + 1}. ${filename}`);
        console.log(`   Result: ${JSON.stringify(result, null, 2)}\n`);
        
        // Basic validation
        if (!result || typeof result !== 'object') {
            console.log(`   ❌ Invalid result type`);
            allPassed = false;
        } else {
            console.log(`   ✅ Parsed successfully`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        allPassed = false;
    }
});

// Test properties function
console.log('📋 Testing properties function:\n');
try {
    const props = properties();
    console.log(`Available properties: ${Object.keys(props).length}`);
    console.log(`Properties: ${Object.keys(props).join(', ')}\n`);
    console.log('✅ Properties function works');
} catch (error) {
    console.log(`❌ Properties error: ${error.message}`);
    allPassed = false;
}

// Final result
if (allPassed) {
    console.log('🎉 All simple tests passed! GuessIt JS is working correctly.');
    process.exit(0);
} else {
    console.log('❌ Some tests failed.');
    process.exit(1);
}