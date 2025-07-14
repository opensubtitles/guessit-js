/**
 * Test suite for GitHub issues from guessit-io/guessit
 * These tests cover parsing problems reported in the Python GuessIt repository
 */

import { guessit } from '../src/index.js';

// Test cases from GitHub issues
const testCases = [
    // Issue #800: "The Four Seasons" parsed as "The Four" 
    {
        filename: 'The.Four.Seasons.2025.S01E01.1080p.WEB.h264-ETHEL.mkv',
        expected: {
            title: 'The Four Seasons',
            season: 1,
            episode: 1,
            year: 2025,
            screen_size: '1080p',
            source: 'WEB',
            video_codec: 'H.264',
            release_group: 'ETHEL',
            container: 'mkv'
        },
        description: 'Should parse full title "The Four Seasons" not just "The Four"'
    },
    
    // Issue #796: Title returned as list instead of string
    {
        filename: 'Adam-12.S01E02.Log.141.The.Color.TV.Bandit.mkv',
        expected: {
            title: 'Adam-12',
            season: 1,
            episode: 2,
            episode_title: 'Log 141 The Color TV Bandit',
            container: 'mkv'
        },
        description: 'Should parse "Adam-12" as title, not return array'
    },
    
    // Issue #797: Season detection priority (filename vs directory)
    {
        filename: 'Season 1 S01/Show.Name.S44E03.1080p.mkv',
        expected: {
            title: 'Show Name',
            season: 44,  // Should use filename S44, not directory S01
            episode: 3,
            screen_size: '1080p',
            container: 'mkv'
        },
        description: 'Should prioritize season from filename over directory'
    },
    
    // Common parsing issues
    {
        filename: 'The.Convert.2024.1080p.BluRay.x264-GROUP.mkv',
        expected: {
            title: 'The Convert',
            year: 2024,
            screen_size: '1080p',
            source: 'BluRay',
            video_codec: 'H.264',
            release_group: 'GROUP',
            container: 'mkv'
        },
        description: 'Should parse "The Convert" as full title'
    },
    
    {
        filename: 'It.Ends.With.Us.2024.1080p.WEB.h264-GROUP.mkv',
        expected: {
            title: 'It Ends With Us',
            year: 2024,
            screen_size: '1080p',
            source: 'WEB',
            video_codec: 'H.264',
            release_group: 'GROUP',
            container: 'mkv'
        },
        description: 'Should parse "It Ends With Us" as full title'
    },
    
    // Edge cases with special characters
    {
        filename: 'Movie.Name.2024.1920×1080.BluRay.x264-GROUP.mkv',
        expected: {
            title: 'Movie Name',
            year: 2024,
            screen_size: '1080p',  // Should recognize × as x
            source: 'BluRay',
            video_codec: 'H.264',
            release_group: 'GROUP',
            container: 'mkv'
        },
        description: 'Should handle × character in resolution'
    },
    
    // Episode title parsing with repacks
    {
        filename: 'Show.Name.S01E01.Episode.Title.REPACK.1080p.HDTV.x264-GROUP.mkv',
        expected: {
            title: 'Show Name',
            season: 1,
            episode: 1,
            episode_title: 'Episode Title',
            other: 'REPACK',
            screen_size: '1080p',
            source: 'HDTV',
            video_codec: 'H.264',
            release_group: 'GROUP',
            container: 'mkv'
        },
        description: 'Should parse episode title correctly with repack'
    },
    
    // Future years
    {
        filename: 'Movie.Title.2030.1080p.BluRay.x264-GROUP.mkv',
        expected: {
            title: 'Movie Title',
            year: 2030,
            screen_size: '1080p',
            source: 'BluRay',
            video_codec: 'H.264',
            release_group: 'GROUP',
            container: 'mkv'
        },
        description: 'Should handle future years correctly'
    }
];

// Test runner
console.log('🧪 Running GitHub Issues Test Suite');
console.log('=====================================\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.description}`);
    console.log(`Filename: ${test.filename}`);
    
    const result = guessit(test.filename);
    
    let testPassed = true;
    const failures = [];
    
    // Check each expected property
    for (const [key, expectedValue] of Object.entries(test.expected)) {
        const actualValue = result[key];
        
        if (Array.isArray(actualValue) && typeof expectedValue === 'string') {
            // Special case: if we get an array but expect a string, join it
            const joinedValue = actualValue.join(' ');
            if (joinedValue !== expectedValue) {
                testPassed = false;
                failures.push(`  ${key}: expected "${expectedValue}", got array [${actualValue.map(v => `"${v}"`).join(', ')}] (joined: "${joinedValue}")`);
            }
        } else if (actualValue !== expectedValue) {
            testPassed = false;
            failures.push(`  ${key}: expected "${expectedValue}", got "${actualValue}"`);
        }
    }
    
    if (testPassed) {
        console.log('✅ PASSED\n');
        passed++;
    } else {
        console.log('❌ FAILED');
        failures.forEach(failure => console.log(failure));
        console.log('');
        failed++;
    }
});

console.log('=====================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Success rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed > 0) {
    process.exit(1);
}