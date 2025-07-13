#!/usr/bin/env node

/**
 * Command line interface for GuessIt JS
 */

import { guessit, properties } from './index.js';
import { parseOptions } from './options.js';

function main() {
    const args = process.argv.slice(2);
    const options = parseOptions(args);
    
    // Handle version
    if (options.version) {
        console.log('GuessIt JS v1.0.0');
        console.log('JavaScript port of GuessIt');
        return;
    }
    
    // Handle properties listing
    if (options.properties || options.values) {
        const props = properties(options);
        
        if (options.json) {
            if (options.values) {
                console.log(JSON.stringify(props, null, 2));
            } else {
                console.log(JSON.stringify(Object.keys(props), null, 2));
            }
        } else {
            console.log('GuessIt properties:');
            for (const [prop, values] of Object.entries(props)) {
                console.log(`  [+] ${prop}`);
                if (options.values && values.length > 0) {
                    for (const value of values) {
                        console.log(`    [!] ${value}`);
                    }
                }
            }
        }
        return;
    }
    
    // Handle filename parsing
    const filenames = options.filename || [];
    
    if (filenames.length === 0) {
        console.log('Usage: guessit-js [options] <filename>');
        console.log('');
        console.log('Options:');
        console.log('  --version              Show version');
        console.log('  --properties           Show available properties');
        console.log('  --values               Show property values');
        console.log('  --json                 Output as JSON');
        console.log('  --yaml                 Output as YAML');
        console.log('  --type <type>          Suggest file type (movie, episode)');
        console.log('  --verbose              Verbose output');
        return;
    }
    
    for (const filename of filenames) {
        const guess = guessit(filename, options);
        
        if (options.show_property) {
            console.log(guess[options.show_property] || '');
        } else if (options.json) {
            console.log(JSON.stringify(guess, null, 2));
        } else if (options.yaml) {
            // Simple YAML-like output
            console.log(`? ${filename}`);
            console.log(':');
            for (const [key, value] of Object.entries(guess)) {
                console.log(`  ${key}: ${JSON.stringify(value)}`);
            }
        } else {
            console.log(`For: ${filename}`);
            console.log('GuessIt found:', JSON.stringify(guess, null, 4));
        }
        console.log('');
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}