#!/usr/bin/env node
/**
 * Debug container rule with complex filename
 */

console.log('🔍 Debugging container rule with complex filename...\n');

try {
    const { Rule } = await import('./src/rules/rebulk.js');
    const { containerRules } = await import('./src/rules/properties/container.js');
    
    const filename = 'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv';
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
    
    console.log('\n5. Testing with full rebulk...');
    const { RebulkBuilder } = await import('./src/rules/index.js');
    const rebulk = RebulkBuilder({});
    
    const matches = rebulk.matches(filename, {});
    console.log('   All matches:', matches.matches.map(m => ({ 
        start: m.start, 
        end: m.end, 
        name: m.name, 
        value: m.value,
        private: m.private
    })));
    
    const dict = matches.toDict();
    console.log('   Dict result:', dict);

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}