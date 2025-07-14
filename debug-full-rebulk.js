#!/usr/bin/env node
/**
 * Debug full RebulkBuilder
 */

console.log('🔍 Debugging full RebulkBuilder...\n');

try {
    const { RebulkBuilder } = await import('./src/rules/index.js');
    
    const filename = 'test.mkv';
    console.log(`Testing filename: ${filename}`);
    
    console.log('\n1. Creating full RebulkBuilder...');
    const rebulk = RebulkBuilder({});
    console.log(`   Total rules loaded: ${rebulk.rules.length}`);
    
    console.log('\n2. Testing matches...');
    const matches = rebulk.matches(filename, {});
    
    console.log(`   Total matches found: ${matches.matches.length}`);
    console.log('   All matches:');
    matches.matches.forEach((match, i) => {
        console.log(`     ${i}: start=${match.start}, end=${match.end}, name=${match.name}, value=${match.value}, private=${match.private}`);
    });
    
    console.log('\n3. Testing toDict...');
    const dict = matches.toDict(false, false, false);
    console.log('   Dict result:', dict);
    console.log('   Dict keys:', Object.keys(dict));
    
    console.log('\n4. Analyzing matches by name...');
    const matchesByName = {};
    matches.matches.forEach(match => {
        if (!matchesByName[match.name]) {
            matchesByName[match.name] = [];
        }
        matchesByName[match.name].push(match);
    });
    
    for (const [name, nameMatches] of Object.entries(matchesByName)) {
        console.log(`   ${name}: ${nameMatches.length} matches (private: ${nameMatches.every(m => m.private)})`);
    }

    console.log('\n5. Testing complex filename...');
    const complexFilename = 'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv';
    const complexMatches = rebulk.matches(complexFilename, {});
    const complexDict = complexMatches.toDict(false, false, false);
    
    console.log(`   Complex matches: ${complexMatches.matches.length}`);
    console.log('   Complex dict:', complexDict);
    console.log('   Complex dict keys:', Object.keys(complexDict));

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}