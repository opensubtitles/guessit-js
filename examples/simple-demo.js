#!/usr/bin/env node
/**
 * Simple GuessIt JS Demo - Memory-safe Examples
 */

import { guessit } from '../src/index.js';

const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function printExample(filename, result) {
    console.log(`${colors.cyan}📁 ${filename}${colors.reset}`);
    console.log(`${colors.green}   Result: ${JSON.stringify(result, null, 2)}${colors.reset}\n`);
}

console.log(`${colors.bold}${colors.cyan}🎬 GuessIt JS - Simple Demo${colors.reset}\n`);
console.log('Extract metadata from video filenames with JavaScript\n');

// Basic movie examples
console.log(`${colors.bold}${colors.blue}=== Movie Examples ===${colors.reset}\n`);

try {
    const movies = [
        'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv',
        'Avengers.Endgame.2019.2160p.UHD.BluRay.x265.mkv'
    ];

    for (const filename of movies) {
        try {
            const result = guessit(filename, { type: 'movie' });
            printExample(filename, result);
        } catch (error) {
            console.log(`${colors.cyan}📁 ${filename}${colors.reset}`);
            console.log(`${colors.yellow}   Error: ${error.message}${colors.reset}\n`);
        }
    }
} catch (error) {
    console.log(`${colors.yellow}Movie parsing error: ${error.message}${colors.reset}\n`);
}

// Basic TV show examples
console.log(`${colors.bold}${colors.blue}=== TV Show Examples ===${colors.reset}\n`);

try {
    const episodes = [
        'Game.of.Thrones.S01E01.Winter.Is.Coming.HDTV.x264-LOL.mkv',
        'Breaking.Bad.S03E07.One.Minute.720p.HDTV.XviD-FQM.avi'
    ];

    for (const filename of episodes) {
        try {
            const result = guessit(filename, { type: 'episode' });
            printExample(filename, result);
        } catch (error) {
            console.log(`${colors.cyan}📁 ${filename}${colors.reset}`);
            console.log(`${colors.yellow}   Error: ${error.message}${colors.reset}\n`);
        }
    }
} catch (error) {
    console.log(`${colors.yellow}Episode parsing error: ${error.message}${colors.reset}\n`);
}

// Single performance test
console.log(`${colors.bold}${colors.blue}=== Performance Test ===${colors.reset}\n`);

try {
    const testFile = 'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv';
    console.log(`Testing single parse on: ${testFile}`);
    
    const startTime = process.hrtime.bigint();
    const result = guessit(testFile);
    const endTime = process.hrtime.bigint();
    
    const parseTimeMs = Number(endTime - startTime) / 1_000_000;
    const opsPerSec = Math.round(1000 / parseTimeMs);
    
    console.log(`${colors.green}Performance Results:${colors.reset}`);
    console.log(`  Parse time: ${parseTimeMs.toFixed(3)}ms`);
    console.log(`  Estimated ops/sec: ${opsPerSec.toLocaleString()}`);
    console.log(`  Parsed properties: ${Object.keys(result).length}`);
} catch (error) {
    console.log(`${colors.yellow}Performance test error: ${error.message}${colors.reset}`);
}

console.log(`\n${colors.bold}${colors.cyan}🎯 Demo Complete!${colors.reset}`);
console.log(`${colors.yellow}For more features, try:${colors.reset}`);
console.log(`${colors.blue}npm run demo:wasm-performance${colors.reset} (Interactive browser demo)`);
console.log(`${colors.blue}npm run test${colors.reset} (Full test suite)\n`);