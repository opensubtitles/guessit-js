#!/usr/bin/env node
/**
 * Debug rebulk rule application
 */

console.log('🔍 Debugging rebulk rule application...\n');

try {
    const { Rebulk } = await import('./src/rules/rebulk.js');
    const { containerRules } = await import('./src/rules/properties/container.js');
    
    const filename = 'test.mkv';
    console.log(`Testing filename: ${filename}`);
    
    console.log('\n1. Creating rebulk and adding container rules...');
    const rebulk = new Rebulk();
    const rules = containerRules({});
    rebulk.addRules(rules);
    
    console.log(`   Added ${rules.length} rules to rebulk`);
    console.log(`   Total rebulk rules: ${rebulk.rules.length}`);
    
    console.log('\n2. Manually calling matches...');
    const matches = rebulk.matches(filename, {});
    
    console.log(`   Total matches found: ${matches.matches.length}`);
    console.log('   All matches:');
    matches.matches.forEach((match, i) => {
        console.log(`     ${i}: start=${match.start}, end=${match.end}, name=${match.name}, value=${match.value}, private=${match.private}`);
    });
    
    console.log('\n3. Testing toDict...');
    const dict = matches.toDict(false, false, false);
    console.log('   Dict result:', dict);
    
    console.log('\n4. Testing with non-private matches only...');
    const nonPrivateMatches = matches.matches.filter(m => !m.private);
    console.log(`   Non-private matches: ${nonPrivateMatches.length}`);
    nonPrivateMatches.forEach((match, i) => {
        console.log(`     ${i}: start=${match.start}, end=${match.end}, name=${match.name}, value=${match.value}`);
    });

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}