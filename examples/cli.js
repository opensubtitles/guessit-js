#!/usr/bin/env node
/**
 * GuessIt JS Command Line Interface
 */

import { guessit, properties } from '../src/index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packagePath = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

function showHelp() {
    console.log(`
GuessIt JS v${pkg.version} - Extract metadata from video filenames

Usage:
  guessit-js [options] <filename...>

Options:
  -h, --help              Show this help
  -v, --version           Show version
  -t, --type <type>       Specify content type (movie|episode)
  -j, --json              Output as JSON
  -p, --properties        Show available properties
  --single-value          Return single values instead of arrays
  --verbose               Show detailed output

Examples:
  guessit-js "The.Matrix.1999.1080p.BluRay.x264.mkv"
  guessit-js --type episode "Game.of.Thrones.S01E01.mkv"
  guessit-js --json *.mkv
  guessit-js --properties

GitHub: https://github.com/yourusername/guessit-js
    `);
}

function showVersion() {
    console.log(`GuessIt JS v${pkg.version}`);
}

function showProperties() {
    console.log('Available Properties:\n');
    const props = properties();
    
    Object.entries(props).forEach(([key, info]) => {
        console.log(`  ${key}:`);
        if (info.description) {
            console.log(`    Description: ${info.description}`);
        }
        if (info.examples && info.examples.length > 0) {
            console.log(`    Examples: ${info.examples.join(', ')}`);
        }
        console.log();
    });
}

function formatOutput(filename, result, options = {}) {
    if (options.json) {
        return JSON.stringify({ filename, result }, null, 2);
    }
    
    if (options.verbose) {
        let output = `\n📁 ${filename}\n`;
        output += '   Properties:\n';
        Object.entries(result).forEach(([key, value]) => {
            output += `     ${key}: ${JSON.stringify(value)}\n`;
        });
        return output;
    }
    
    // Compact format
    const important = [];
    if (result.title) important.push(`Title: ${result.title}`);
    if (result.year) important.push(`Year: ${result.year}`);
    if (result.season && result.episode) important.push(`S${result.season}E${result.episode}`);
    if (result.screen_size) important.push(`Quality: ${result.screen_size}`);
    if (result.source) important.push(`Source: ${result.source}`);
    if (result.video_codec) important.push(`Codec: ${result.video_codec}`);
    
    return `${filename} → ${important.join(' | ')}`;
}

function parseArgs(args) {
    const options = {
        files: [],
        type: null,
        json: false,
        verbose: false,
        singleValue: false,
        showProperties: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '-h':
            case '--help':
                showHelp();
                process.exit(0);
                break;
                
            case '-v':
            case '--version':
                showVersion();
                process.exit(0);
                break;
                
            case '-p':
            case '--properties':
                options.showProperties = true;
                break;
                
            case '-t':
            case '--type':
                options.type = args[++i];
                if (!options.type || !['movie', 'episode'].includes(options.type)) {
                    console.error('Error: --type must be "movie" or "episode"');
                    process.exit(1);
                }
                break;
                
            case '-j':
            case '--json':
                options.json = true;
                break;
                
            case '--verbose':
                options.verbose = true;
                break;
                
            case '--single-value':
                options.singleValue = true;
                break;
                
            default:
                if (arg.startsWith('-')) {
                    console.error(`Error: Unknown option ${arg}`);
                    process.exit(1);
                }
                options.files.push(arg);
                break;
        }
    }
    
    return options;
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        showHelp();
        process.exit(1);
    }
    
    const options = parseArgs(args);
    
    if (options.showProperties) {
        showProperties();
        return;
    }
    
    if (options.files.length === 0) {
        console.error('Error: No filenames provided');
        process.exit(1);
    }
    
    const guessitOptions = {};
    if (options.type) guessitOptions.type = options.type;
    if (options.singleValue) guessitOptions.single_value = true;
    
    // Process files
    const results = [];
    
    for (const filename of options.files) {
        try {
            const result = guessit(filename, guessitOptions);
            results.push({ filename, result });
            
            if (!options.json) {
                console.log(formatOutput(filename, result, options));
            }
        } catch (error) {
            console.error(`Error parsing ${filename}: ${error.message}`);
            process.exit(1);
        }
    }
    
    // JSON output for all results
    if (options.json) {
        if (results.length === 1) {
            console.log(JSON.stringify(results[0], null, 2));
        } else {
            console.log(JSON.stringify(results, null, 2));
        }
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});

main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
});