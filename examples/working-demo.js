#!/usr/bin/env node
/**
 * Working GuessIt JS Demo - Minimal Implementation
 * Note: The main guessit function has memory issues, this shows the expected functionality
 */

const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Simplified implementation for demo purposes
function simpleGuessit(filename) {
    const result = {};
    
    // Container detection
    const containerMatch = filename.match(/\.([a-z0-9]+)$/i);
    if (containerMatch) {
        result.container = containerMatch[1].toLowerCase();
    }
    
    // Year detection
    const yearMatch = filename.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
        result.year = parseInt(yearMatch[1]);
    }
    
    // Screen size detection
    const sizeMatch = filename.match(/\b(720p|1080p|2160p|4k)\b/i);
    if (sizeMatch) {
        result.screen_size = sizeMatch[1].toLowerCase() === '4k' ? '2160p' : sizeMatch[1];
    }
    
    // Video codec detection
    if (/\b(x264|h264)\b/i.test(filename)) result.video_codec = 'H.264';
    else if (/\b(x265|h265)\b/i.test(filename)) result.video_codec = 'H.265';
    else if (/\bxvid\b/i.test(filename)) result.video_codec = 'XviD';
    
    // Source detection
    if (/\bbluray\b/i.test(filename)) result.source = 'BluRay';
    else if (/\bhdtv\b/i.test(filename)) result.source = 'HDTV';
    else if (/\bweb\b/i.test(filename)) result.source = 'WEB';
    else if (/\bdvd\b/i.test(filename)) result.source = 'DVD';
    
    // Season/Episode detection
    const episodeMatch = filename.match(/[Ss](\d{1,2})[Ee](\d{1,2})/);
    if (episodeMatch) {
        result.season = parseInt(episodeMatch[1]);
        result.episode = parseInt(episodeMatch[2]);
    }
    
    // Title extraction (simplified)
    let title = filename;
    title = title.replace(/\.[^.]+$/, ''); // Remove extension
    title = title.replace(/[.\s]+/g, ' '); // Replace dots/spaces
    title = title.replace(/\b(19|20)\d{2}\b.*/, ''); // Remove year and after
    title = title.replace(/\b[Ss]\d{1,2}[Ee]\d{1,2}\b.*/, ''); // Remove season/episode
    title = title.replace(/\b(720p|1080p|2160p|4K)\b.*/, ''); // Remove quality and after
    title = title.trim();
    
    if (title) {
        result.title = title;
    }
    
    return result;
}

function printExample(filename, result) {
    console.log(`${colors.cyan}📁 ${filename}${colors.reset}`);
    console.log(`${colors.green}   Result: ${JSON.stringify(result, null, 2)}${colors.reset}\n`);
}

console.log(`${colors.bold}${colors.cyan}🎬 GuessIt JS - Working Demo${colors.reset}\n`);
console.log(`${colors.yellow}⚠️  Note: Using simplified implementation due to memory issues in main library${colors.reset}\n`);

// Movie examples
console.log(`${colors.bold}${colors.blue}=== Movie Examples ===${colors.reset}\n`);

const movies = [
    'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv',
    'Avengers.Endgame.2019.2160p.UHD.BluRay.x265.10bit.HDR.mkv',
    'Parasite.2019.KOREAN.720p.BluRay.H264.AAC-VXT.mp4',
    'Inception.2010.1080p.BluRay.DTS.x264-ESiR.mkv'
];

movies.forEach(filename => {
    const result = simpleGuessit(filename);
    printExample(filename, result);
});

// TV Show examples
console.log(`${colors.bold}${colors.blue}=== TV Show Examples ===${colors.reset}\n`);

const episodes = [
    'Game.of.Thrones.S01E01.Winter.Is.Coming.1080p.HDTV.x264-LOL.mkv',
    'Breaking.Bad.S03E07.One.Minute.720p.HDTV.XviD-FQM.avi',
    'The.Office.US.S02E01.The.Dundies.WEB.x264-GROUP.mp4',
    'Stranger.Things.S04E09.The.Piggyback.2160p.NF.WEBRip.x265-MIXED.mkv'
];

episodes.forEach(filename => {
    const result = simpleGuessit(filename);
    printExample(filename, result);
});

// Performance test
console.log(`${colors.bold}${colors.blue}=== Performance Test ===${colors.reset}\n`);

const testFile = 'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv';
const iterations = 10000;

console.log(`Testing ${iterations} iterations on: ${testFile}`);

const startTime = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
    simpleGuessit(testFile);
}
const endTime = process.hrtime.bigint();

const totalTimeMs = Number(endTime - startTime) / 1_000_000;
const avgTimeMs = totalTimeMs / iterations;
const opsPerSec = Math.round(1000 / avgTimeMs);

console.log(`${colors.green}Performance Results:${colors.reset}`);
console.log(`  Total time: ${totalTimeMs.toFixed(2)}ms`);
console.log(`  Average per parse: ${avgTimeMs.toFixed(4)}ms`);
console.log(`  Operations per second: ${opsPerSec.toLocaleString()}`);

console.log(`\n${colors.bold}${colors.cyan}🎯 Demo Complete!${colors.reset}`);
console.log(`${colors.yellow}Status: Simplified implementation working, main library needs debugging${colors.reset}`);
console.log(`${colors.blue}Try: npm run demo:wasm-performance (Interactive browser demo)${colors.reset}\n`);