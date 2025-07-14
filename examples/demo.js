#!/usr/bin/env node
/**
 * GuessIt JS Demo - Basic Examples
 */

import { guessit, properties } from '../src/index.js';

const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function printHeader(title) {
    console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}\n`);
}

function printExample(filename, result) {
    console.log(`${colors.cyan}📁 ${filename}${colors.reset}`);
    console.log(`${colors.green}   Result: ${JSON.stringify(result, null, 2)}${colors.reset}\n`);
}

async function runDemo() {
    console.log(`${colors.bold}${colors.cyan}🎬 GuessIt JS Demo${colors.reset}\n`);
    console.log('Extract metadata from video filenames with JavaScript\n');

    // Movie examples
    printHeader('Movie Examples');
    const movies = [
        'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv',
        'Avengers.Endgame.2019.2160p.UHD.BluRay.x265.10bit.HDR.DTS-X.7.1.mkv',
        'Parasite.2019.KOREAN.720p.BluRay.H264.AAC-VXT.mp4',
        'Inception.2010.1080p.BluRay.DTS.x264-ESiR.mkv'
    ];

    movies.forEach(filename => {
        const result = guessit(filename, { type: 'movie' });
        printExample(filename, result);
    });

    // TV Show examples
    printHeader('TV Show Examples');
    const episodes = [
        'Game.of.Thrones.S01E01.Winter.Is.Coming.1080p.HDTV.x264-LOL.mkv',
        'Breaking.Bad.S03E07.One.Minute.720p.HDTV.XviD-FQM.avi',
        'The.Office.US.S02E01.The.Dundies.WEB.x264-GROUP.mp4',
        'Stranger.Things.S04E09.The.Piggyback.2160p.NF.WEBRip.x265-MIXED.mkv'
    ];

    episodes.forEach(filename => {
        const result = guessit(filename, { type: 'episode' });
        printExample(filename, result);
    });

    // Various formats
    printHeader('Various Formats');
    const various = [
        'movie.720p.mkv',
        'show.s05e14.720p.web.x264.mp4',
        'Documentary.2023.4K.UHD.BluRay.x265.mkv',
        'Concert.2022.1080p.WEB.H264-GROUP.mp4'
    ];

    various.forEach(filename => {
        const result = guessit(filename);
        printExample(filename, result);
    });

    // Properties demonstration
    printHeader('Available Properties');
    const props = properties();
    console.log(`${colors.yellow}Detectable properties:${colors.reset}`);
    Object.keys(props).forEach(prop => {
        console.log(`  ${colors.green}✓${colors.reset} ${prop}`);
    });

    // Performance benchmark with 10,000 iterations
    printHeader('Performance Test');
    const testFile = 'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv';
    const iterations = 10000;
    
    console.log(`🚀 Running ${iterations.toLocaleString()} iterations on: ${testFile}`);
    console.log(`⏱️  Measuring JavaScript performance...`);
    
    // Warmup
    for (let i = 0; i < 100; i++) {
        guessit(testFile);
    }
    
    const startTime = process.hrtime.bigint();
    let result;
    for (let i = 0; i < iterations; i++) {
        result = guessit(testFile);
    }
    const endTime = process.hrtime.bigint();
    
    const totalTimeMs = Number(endTime - startTime) / 1_000_000;
    const avgTimeMs = totalTimeMs / iterations;
    const opsPerSec = Math.round(1000 / avgTimeMs);
    
    console.log(`${colors.green}📊 JavaScript Performance Results:${colors.reset}`);
    console.log(`   Total time: ${totalTimeMs.toFixed(2)}ms`);
    console.log(`   Average per parse: ${avgTimeMs.toFixed(4)}ms`);
    console.log(`   Operations per second: ${opsPerSec.toLocaleString()}`);
    console.log(`   Parsed properties: ${Object.keys(result).length}`);

    console.log(`\n${colors.bold}${colors.cyan}🎯 Demo Complete!${colors.reset}`);
    console.log(`${colors.yellow}For comprehensive benchmarks, try:${colors.reset}`);
    console.log(`${colors.blue}npm run demo:wasm${colors.reset} (WebAssembly performance)`);
    console.log(`${colors.blue}npm run demo:wasm-performance${colors.reset} (Interactive browser demo)\n`);
}

runDemo().catch(console.error);