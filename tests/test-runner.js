#!/usr/bin/env node
/**
 * Comprehensive test runner for GuessIt JS
 */

import { guessit, properties } from '../src/index.js';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.testResults = [];
        this.startTime = Date.now();
    }

    assert(condition, message) {
        if (condition) {
            this.passed++;
            console.log(`${colors.green}✓${colors.reset} ${message}`);
            this.testResults.push({ status: 'PASS', message });
        } else {
            this.failed++;
            console.log(`${colors.red}✗${colors.reset} ${message}`);
            this.testResults.push({ status: 'FAIL', message });
        }
    }

    assertEqual(actual, expected, message) {
        this.assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
    }

    assertContains(actual, expected, message) {
        const contains = typeof actual === 'string' && typeof expected === 'string' 
            ? actual.toLowerCase().includes(expected.toLowerCase())
            : actual === expected;
        this.assert(contains, `${message} (expected to contain: ${expected}, got: ${actual})`);
    }

    assertDefined(actual, message) {
        this.assert(actual !== undefined && actual !== null, `${message} (got: ${actual})`);
    }

    runBasicTests() {
        console.log(`\n${colors.bold}${colors.blue}=== Basic API Tests ===${colors.reset}`);
        
        // Test basic movie parsing
        const ret1 = guessit('Fear.and.Loathing.in.Las.Vegas.FRENCH.ENGLISH.720p.HDDVD.DTS.x264-ESiR.mkv');
        this.assertDefined(ret1, 'Basic movie parsing should return result');
        this.assertDefined(ret1.title, 'Should extract title');
        this.assertEqual(typeof ret1.title, 'string', 'Title should be string');

        // Test unicode handling
        const ret2 = guessit('[阿维达].Avida.2006.FRENCH.DVDRiP.XViD-PROD.avi');
        this.assertDefined(ret2, 'Unicode parsing should return result');
        this.assertDefined(ret2.title, 'Should extract title from unicode filename');

        // Test properties function
        const props = properties();
        this.assertDefined(props, 'Properties function should return result');
        this.assert(typeof props === 'object', 'Properties should return object');
        this.assert(Object.keys(props).length > 0, 'Properties should have items');

        // Test common properties
        const expectedProps = ['title', 'year', 'season', 'episode', 'container', 'video_codec', 'screen_size'];
        for (const prop of expectedProps) {
            this.assert(props.hasOwnProperty(prop), `Properties should include ${prop}`);
        }

        // Test error handling
        const emptyResult = guessit('');
        this.assertDefined(emptyResult, 'Empty input should return result');
        this.assert(typeof emptyResult === 'object', 'Empty result should be object');
    }

    runVideoCodecTests() {
        console.log(`\n${colors.bold}${colors.blue}=== Video Codec Tests ===${colors.reset}`);
        
        const codecTests = [
            { filename: 'movie.x264.mkv', expected: 'H.264' },
            { filename: 'movie.x265.mkv', expected: 'H.265' },
            { filename: 'movie.h264.mkv', expected: 'H.264' },
            { filename: 'movie.h265.mkv', expected: 'H.265' },
            { filename: 'movie.XviD.avi', expected: 'XviD' },
            { filename: 'movie.DivX.avi', expected: 'DivX' }
        ];

        for (const { filename, expected } of codecTests) {
            const result = guessit(filename);
            this.assertEqual(result.video_codec, expected, `Video codec detection in ${filename}`);
        }
    }

    runSourceTests() {
        console.log(`\n${colors.bold}${colors.blue}=== Source Tests ===${colors.reset}`);
        
        const sourceTests = [
            { filename: 'movie.BluRay.mkv', expected: 'BluRay' },
            { filename: 'movie.HDTV.mkv', expected: 'HDTV' },
            { filename: 'movie.WEB.mkv', expected: 'WEB' },
            { filename: 'movie.DVD.mkv', expected: 'DVD' },
            { filename: 'movie.CAM.mkv', expected: 'CAM' }
        ];

        for (const { filename, expected } of sourceTests) {
            const result = guessit(filename);
            this.assertEqual(result.source, expected, `Source detection in ${filename}`);
        }
    }

    runScreenSizeTests() {
        console.log(`\n${colors.bold}${colors.blue}=== Screen Size Tests ===${colors.reset}`);
        
        const sizeTests = [
            { filename: 'movie.720p.mkv', expected: '720p' },
            { filename: 'movie.1080p.mkv', expected: '1080p' },
            { filename: 'movie.2160p.mkv', expected: '2160p' },
            { filename: 'movie.4K.mkv', expected: '2160p' },
            { filename: 'movie.1920x1080.mkv', expected: '1080p' },
            { filename: 'movie.3840x2160.mkv', expected: '2160p' }
        ];

        for (const { filename, expected } of sizeTests) {
            const result = guessit(filename);
            this.assertEqual(result.screen_size, expected, `Screen size detection in ${filename}`);
        }
    }

    runEpisodeTests() {
        console.log(`\n${colors.bold}${colors.blue}=== Episode Tests ===${colors.reset}`);
        
        const episodeTests = [
            { filename: 'show.S01E02.mkv', expected: { season: 1, episode: 2 } },
            { filename: 'show.s03e15.mkv', expected: { season: 3, episode: 15 } },
            { filename: 'show.1x05.mkv', expected: { season: 1, episode: 5 } },
            { filename: 'show.2x10.mkv', expected: { season: 2, episode: 10 } }
        ];

        for (const { filename, expected } of episodeTests) {
            const result = guessit(filename);
            this.assertEqual(result.season, expected.season, `Season detection in ${filename}`);
            this.assertEqual(result.episode, expected.episode, `Episode detection in ${filename}`);
        }
    }

    runComplexTests() {
        console.log(`\n${colors.bold}${colors.blue}=== Complex Parsing Tests ===${colors.reset}`);
        
        const complexTests = [
            {
                input: 'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv',
                expected: {
                    year: 1999,
                    screen_size: '1080p',
                    source: 'BluRay',
                    video_codec: 'H.264',
                    container: 'mkv'
                }
            },
            {
                input: 'Game.of.Thrones.S01E01.Winter.Is.Coming.1080p.HDTV.x264-LOL.mkv',
                expected: {
                    season: 1,
                    episode: 1,
                    screen_size: '1080p',
                    source: 'HDTV',
                    video_codec: 'H.264',
                    container: 'mkv'
                }
            },
            {
                input: 'Breaking.Bad.3x07.One.Minute.HDTV.XviD-FQM.avi',
                expected: {
                    season: 3,
                    episode: 7,
                    source: 'HDTV',
                    video_codec: 'XviD',
                    container: 'avi'
                }
            }
        ];

        for (const { input, expected } of complexTests) {
            const result = guessit(input);
            
            for (const [key, expectedValue] of Object.entries(expected)) {
                this.assertEqual(result[key], expectedValue, `${key} in ${input}`);
            }
        }
    }

    runMovieTests() {
        console.log(`\n${colors.bold}${colors.blue}=== Movie Tests (Python YAML equivalent) ===${colors.reset}`);
        
        const movieTests = [
            {
                filename: 'Movies/Fear and Loathing in Las Vegas (1998)/Fear.and.Loathing.in.Las.Vegas.720p.HDDVD.DTS.x264-ESiR.mkv',
                expected: {
                    year: 1998,
                    screen_size: '720p',
                    source: 'HD-DVD',
                    audio_codec: 'DTS',
                    video_codec: 'H.264',
                    container: 'mkv',
                    release_group: 'ESiR'
                }
            },
            {
                filename: 'Movies/Dark City (1998)/Dark.City.(1998).DC.BDRip.720p.DTS.X264-CHD.mkv',
                expected: {
                    year: 1998,
                    source: 'Blu-ray',
                    screen_size: '720p',
                    audio_codec: 'DTS',
                    video_codec: 'H.264',
                    release_group: 'CHD',
                    container: 'mkv'
                }
            }
        ];

        for (const { filename, expected } of movieTests) {
            const result = guessit(filename, { type: 'movie' });
            
            this.assertDefined(result.title, `Title extraction from ${filename}`);
            
            for (const [key, expectedValue] of Object.entries(expected)) {
                if (key !== 'title') {
                    this.assertEqual(result[key], expectedValue, `${key} in ${filename}`);
                }
            }
        }
    }

    runEpisodeYamlTests() {
        console.log(`\n${colors.bold}${colors.blue}=== Episode Tests (Python YAML equivalent) ===${colors.reset}`);
        
        const episodeTests = [
            {
                filename: 'Series/Californication/Season 2/Californication.2x05.Vaginatown.HDTV.XviD-0TV.avi',
                expected: {
                    season: 2,
                    episode: 5,
                    source: 'HDTV',
                    video_codec: 'XviD',
                    release_group: '0TV',
                    container: 'avi'
                }
            },
            {
                filename: 'Series/Treme/Treme.1x03.Right.Place,.Wrong.Time.HDTV.XviD-NoTV.avi',
                expected: {
                    season: 1,
                    episode: 3,
                    source: 'HDTV',
                    video_codec: 'XviD',
                    release_group: 'NoTV',
                    container: 'avi'
                }
            }
        ];

        for (const { filename, expected } of episodeTests) {
            const result = guessit(filename, { type: 'episode' });
            
            this.assertDefined(result.title, `Title extraction from ${filename}`);
            
            for (const [key, expectedValue] of Object.entries(expected)) {
                if (key !== 'title' && key !== 'episode_title') {
                    this.assertEqual(result[key], expectedValue, `${key} in ${filename}`);
                }
            }
        }
    }

    runOptionTests() {
        console.log(`\n${colors.bold}${colors.blue}=== Options Tests ===${colors.reset}`);
        
        // Test type option
        const movieResult = guessit('Lost.108.mkv', { type: 'movie' });
        const episodeResult = guessit('Lost.108.mkv', { type: 'episode' });
        
        this.assertDefined(movieResult, 'Movie type option should work');
        this.assertDefined(episodeResult, 'Episode type option should work');

        // Test output_input_string option
        const filename = 'movie.mkv';
        const result = guessit(filename, { output_input_string: true });
        this.assertEqual(result.input_string, filename, 'output_input_string option should work');
    }

    printSummary() {
        const endTime = Date.now();
        const duration = ((endTime - this.startTime) / 1000).toFixed(2);
        
        console.log(`\n${colors.bold}${colors.cyan}=== Test Summary ===${colors.reset}`);
        console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
        console.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);
        console.log(`Total: ${this.passed + this.failed}`);
        console.log(`Duration: ${duration}s`);
        
        if (this.failed === 0) {
            console.log(`\n${colors.bold}${colors.green}🎉 All tests passed! GuessIt JS is working correctly.${colors.reset}`);
        } else {
            console.log(`\n${colors.bold}${colors.red}❌ ${this.failed} test(s) failed.${colors.reset}`);
        }

        return this.failed === 0;
    }

    run() {
        console.log(`${colors.bold}${colors.cyan}GuessIt JS Test Suite${colors.reset}\n`);
        console.log(`Running comprehensive tests for video filename parsing\n`);
        
        this.runBasicTests();
        this.runVideoCodecTests();
        this.runSourceTests();
        this.runScreenSizeTests();
        this.runEpisodeTests();
        this.runComplexTests();
        this.runMovieTests();
        this.runEpisodeYamlTests();
        this.runOptionTests();
        
        return this.printSummary();
    }
}

// Run the tests
const runner = new TestRunner();
const success = runner.run();
process.exit(success ? 0 : 1);