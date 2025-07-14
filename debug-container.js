#!/usr/bin/env node
/**
 * Debug container rule specifically
 */

console.log('🔍 Debugging container rule...\n');

try {
    const { Rule } = await import('./src/rules/rebulk.js');
    const { containerRules } = await import('./src/rules/properties/container.js');
    
    const filename = 'test.mkv';
    console.log(`Testing filename: ${filename}`);
    
    console.log('\n1. Testing container rules...');
    const rules = containerRules({});
    console.log(`   Generated ${rules.length} container rules`);
    
    // Find the mkv rule
    const mkvRule = rules.find(rule => rule.pattern.source.includes('mkv'));
    if (mkvRule) {
        console.log('   Found mkv rule:', {
            pattern: mkvRule.pattern,
            name: mkvRule.name,
            value: mkvRule.value,
            tags: mkvRule.tags
        });
        
        console.log('\n2. Testing regex manually...');
        const regex = mkvRule.pattern;
        console.log('   Regex:', regex);
        console.log('   Test result:', regex.test(filename));
        console.log('   Exec result:', regex.exec(filename));
        
        console.log('\n3. Testing rule.apply...');
        // Create empty matches object for testing
        const { Matches } = await import('./src/rules/rebulk.js');
        const matches = new Matches(filename);
        
        const ruleMatches = mkvRule.apply(filename, matches, {});
        console.log('   Rule matches:', ruleMatches.map(m => ({ 
            start: m.start, 
            end: m.end, 
            name: m.name, 
            value: m.value, 
            tags: m.tags 
        })));
    } else {
        console.log('   ❌ No mkv rule found!');
        console.log('   Available rules:', rules.map(r => r.pattern.source).slice(0, 10));
    }
    
    console.log('\n4. Testing manual regex...');
    const manualRegex = new RegExp('\\.mkv$', 'i');
    console.log('   Manual regex test:', manualRegex.test(filename));
    console.log('   Manual regex exec:', manualRegex.exec(filename));

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}