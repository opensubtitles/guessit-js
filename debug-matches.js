#!/usr/bin/env node
/**
 * Debug why matches are empty
 */

console.log('🔍 Debugging empty matches...\n');

try {
    console.log('1. Testing with simple filename...');
    const { guessit } = await import('./src/index.js');
    
    const filename = 'test.mkv';
    console.log(`   Parsing: ${filename}`);
    
    const result = guessit(filename);
    console.log('   Result:', result);
    console.log('   Result keys:', Object.keys(result));
    console.log('   Result length:', Object.keys(result).length);

    console.log('\n2. Testing with complex filename...');
    const complexFilename = 'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv';
    console.log(`   Parsing: ${complexFilename}`);
    
    const complexResult = guessit(complexFilename);
    console.log('   Result:', complexResult);
    console.log('   Result keys:', Object.keys(complexResult));

    console.log('\n3. Testing directly with rebulk...');
    const { RebulkBuilder } = await import('./src/rules/index.js');
    const rebulk = RebulkBuilder({});
    
    console.log('   Rebulk rules count:', rebulk.rules.length);
    
    const matches = rebulk.matches(complexFilename, {});
    console.log('   Raw matches count:', matches.matches.length);
    console.log('   Raw matches:', matches.matches.map(m => ({ start: m.start, end: m.end, name: m.name, value: m.value })));
    
    const dict = matches.toDict(false, false, false);
    console.log('   toDict result:', dict);

    console.log('\n4. Testing individual rules...');
    const { containerRules } = await import('./src/rules/properties/container.js');
    const containerRuleSet = containerRules({});
    console.log('   Container rules count:', containerRuleSet.length);
    
    if (containerRuleSet.length > 0) {
        const containerMatches = containerRuleSet[0].apply(complexFilename, matches, {});
        console.log('   Container matches:', containerMatches.map(m => ({ start: m.start, end: m.end, name: m.name, value: m.value })));
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}