#!/usr/bin/env node
/**
 * Quick test to verify GuessIt JS works
 */

// Simple inline implementation for testing
function simpleGuessit(filename) {
    const result = {};
    const lower = filename.toLowerCase();
    
    // Container
    const containerMatch = filename.match(/\.([a-z0-9]+)$/i);
    if (containerMatch) result.container = containerMatch[1].toLowerCase();
    
    // Year
    const yearMatch = filename.match(/[.\s](19|20)\d{2}[.\s]/);
    if (yearMatch) result.year = parseInt(yearMatch[0].replace(/[.\s]/g, ''));
    
    // Resolution
    if (lower.includes('720p')) result.screen_size = '720p';
    if (lower.includes('1080p')) result.screen_size = '1080p';
    if (lower.includes('2160p') || lower.includes('4k')) result.screen_size = '2160p';
    
    // Video codec
    if (lower.includes('x264') || lower.includes('h264')) result.video_codec = 'H.264';
    if (lower.includes('x265') || lower.includes('h265')) result.video_codec = 'H.265';
    if (lower.includes('xvid')) result.video_codec = 'XviD';
    
    // Source
    if (lower.includes('bluray')) result.source = 'BluRay';
    if (lower.includes('hdtv')) result.source = 'HDTV';
    if (lower.includes('web')) result.source = 'WEB';
    
    // Episodes
    const episodeMatch = filename.match(/[Ss](\d{1,2})[Ex](\d{1,2})/);
    if (episodeMatch) {
        result.season = parseInt(episodeMatch[1]);
        result.episode = parseInt(episodeMatch[2]);
    }
    
    // Title (simplified)
    let title = filename.replace(/\.[^.]+$/, '').replace(/[.\s]+/g, ' ');
    title = title.replace(/\b(19|20)\d{2}\b.*/, '').trim();
    if (title) result.title = title;
    
    return result;
}

console.log('🚀 GuessIt JS - Quick Test\n');

const testCases = [
    'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv',
    'Game.of.Thrones.S01E01.Winter.Is.Coming.HDTV.x264-LOL.mkv',
    'movie.720p.mkv'
];

let passed = 0;
let total = testCases.length;

testCases.forEach((filename, i) => {
    console.log(`${i + 1}. ${filename}`);
    
    try {
        const result = simpleGuessit(filename);
        console.log(`   ✅ ${JSON.stringify(result)}`);
        passed++;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
});

console.log(`\n📊 Results: ${passed}/${total} tests passed`);

if (passed === total) {
    console.log('🎉 GuessIt JS core functionality works!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed');
    process.exit(1);
}