#!/usr/bin/env node
/**
 * Test release group patterns directly
 */

const testFilename = 'Fear.and.Loathing.in.Las.Vegas.720p.HDDVD.DTS.x264-ESiR.mkv';
const regex = /-([A-Z0-9]+)\.(?:mkv|avi|mp4|mov|wmv|flv|webm|m4v|3gp|ts|m2ts|vob|iso|img|bin|mdf|nrg|cue|rar|zip|7z|tar|gz|bz2|xz)$/i;

console.log('🔍 Testing regex directly...\n');
console.log(`Filename: ${testFilename}`);
console.log(`Regex: ${regex}`);

const match = testFilename.match(regex);
console.log(`Match result:`, match);

if (match) {
    console.log(`Found group: "${match[1]}"`);
} else {
    console.log('No match found');
}

// Test simpler pattern
const simpleRegex = /-([A-Z0-9]+)\.mkv$/i;
console.log(`\nSimple regex: ${simpleRegex}`);
const simpleMatch = testFilename.match(simpleRegex);
console.log(`Simple match:`, simpleMatch);

// Test with global flag
const globalRegex = /-([A-Z0-9]+)\.mkv$/gi;
console.log(`\nGlobal regex: ${globalRegex}`);
const globalMatch = globalRegex.exec(testFilename);
console.log(`Global match:`, globalMatch);