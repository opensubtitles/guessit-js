#!/usr/bin/env node
/**
 * Debug release group rule application
 */

import { RebulkBuilder } from './src/rules/index.js';

const testFilename = 'Fear.and.Loathing.in.Las.Vegas.720p.HDDVD.DTS.x264-ESiR.mkv';

console.log('🔍 Testing release group rule application...\n');
console.log(`Testing: ${testFilename}\n`);

const rebulk = RebulkBuilder({});
console.log(`Total rules: ${rebulk.rules.length}`);

const matches = rebulk.matches(testFilename, {});
console.log(`Total matches found: ${matches.matches.length}`);

console.log('\nAll matches:');
matches.matches.forEach((match, i) => {
    console.log(`  ${i}: ${match.start}-${match.end} "${match.name}": "${match.value}" (private: ${match.private})`);
});

console.log('\nFinal dict result:');
const dict = matches.toDict();
console.log(JSON.stringify(dict, null, 2));