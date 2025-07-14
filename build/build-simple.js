#!/usr/bin/env node

/**
 * Simple build script for GuessIt JS
 * Creates a bundled version without complex webpack setup
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readFile(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.warn(`Warning: Could not read ${filePath}:`, error.message);
        return '';
    }
}

async function writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
}

async function buildBundle() {
    console.log('Building GuessIt JS bundle...');
    
    // Read all source files
    const srcPath = path.join(__dirname, '../src');
    const files = {
        exceptions: await readFile(path.join(srcPath, 'exceptions.js')),
        options: await readFile(path.join(srcPath, 'options.js')),
        config: await readFile(path.join(srcPath, 'config/options.js')),
        rebulk: await readFile(path.join(srcPath, 'rules/rebulk.js')),
        episodes: await readFile(path.join(srcPath, 'rules/properties/episodes.js')),
        title: await readFile(path.join(srcPath, 'rules/properties/title.js')),
        videoCodec: await readFile(path.join(srcPath, 'rules/properties/video_codec.js')),
        screenSize: await readFile(path.join(srcPath, 'rules/properties/screen_size.js')),
        container: await readFile(path.join(srcPath, 'rules/properties/container.js')),
        source: await readFile(path.join(srcPath, 'rules/properties/source.js')),
        audioCodec: await readFile(path.join(srcPath, 'rules/properties/audio_codec.js')),
        stubs: await readFile(path.join(srcPath, 'rules/properties/stubs.js')),
        path: await readFile(path.join(srcPath, 'rules/markers/path.js')),
        groups: await readFile(path.join(srcPath, 'rules/markers/groups.js')),
        processors: await readFile(path.join(srcPath, 'rules/processors.js')),
        rulesIndex: await readFile(path.join(srcPath, 'rules/index.js')),
        api: await readFile(path.join(srcPath, 'api.js')),
        index: await readFile(path.join(srcPath, 'index.js'))
    };
    
    // Create a simplified bundle
    const bundle = `/**
 * GuessIt JS - Bundled Version
 * Generated at ${new Date().toISOString()}
 */

// === Exceptions Module ===
${files.exceptions.replace(/export /g, '').replace(/import[^;]*;/g, '')}

// === Configuration Module ===
${files.config.replace(/export /g, '').replace(/import[^;]*;/g, '')}

// === Options Module ===
${files.options.replace(/export /g, '').replace(/import[^;]*;/g, '')}

// === Rebulk Engine ===
${files.rebulk.replace(/export /g, '').replace(/import[^;]*;/g, '')}

// === Rule Modules ===
${files.episodes.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.title.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.videoCodec.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.screenSize.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.container.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.source.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.audioCodec.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.stubs.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.path.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.groups.replace(/export /g, '').replace(/import[^;]*;/g, '')}
${files.processors.replace(/export /g, '').replace(/import[^;]*;/g, '')}

// === Rules Builder ===
${files.rulesIndex.replace(/export /g, '').replace(/import[^;]*;/g, '')}

// === API Module ===
${files.api.replace(/export /g, '').replace(/import[^;]*;/g, '')}

// === Main API ===
const defaultApi = new GuessItApi();

function configure(options = null, rulesBuilder = null, force = false) {
    defaultApi.configure(options, rulesBuilder, force);
}

function reset() {
    defaultApi.reset();
}

function guessit(filename, options = null) {
    return defaultApi.guessit(filename, options);
}

function properties(options = null) {
    return defaultApi.properties(options);
}

function suggestedExpected(titles, options = null) {
    return defaultApi.suggestedExpected(titles, options);
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    // CommonJS
    module.exports = {
        guessit,
        configure,
        reset,
        properties,
        suggestedExpected,
        GuessItApi,
        GuessItException,
        parseOptions,
        loadConfig,
        mergeOptions
    };
} else if (typeof window !== 'undefined') {
    // Browser global
    window.GuessIt = {
        guessit,
        configure,
        reset,
        properties,
        suggestedExpected,
        GuessItApi,
        GuessItException
    };
} else {
    // ES modules fallback
    globalThis.GuessIt = {
        guessit,
        configure,
        reset,
        properties,
        suggestedExpected,
        GuessItApi,
        GuessItException
    };
}
`;

    // Write the bundle
    const distPath = path.join(__dirname, '../dist');
    await writeFile(path.join(distPath, 'guessit.js'), bundle);
    
    // Create a minified version (simple minification)
    const minified = bundle
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
    
    await writeFile(path.join(distPath, 'guessit.min.js'), minified);
    
    // Create package info
    const packageInfo = {
        name: 'guessit-js',
        version: '1.0.0',
        description: 'JavaScript port of GuessIt',
        main: 'guessit.js',
        files: ['guessit.js', 'guessit.min.js']
    };
    
    await writeFile(path.join(distPath, 'package.json'), JSON.stringify(packageInfo, null, 2));
    
    console.log('✅ Bundle created successfully!');
    console.log('📁 Files generated:');
    console.log('  - dist/guessit.js');
    console.log('  - dist/guessit.min.js');
    console.log('  - dist/package.json');
}

buildBundle().catch(console.error);