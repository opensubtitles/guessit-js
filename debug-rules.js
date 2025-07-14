#!/usr/bin/env node
/**
 * Debug which rule is causing the memory issue
 */

function logMemory(step) {
    const usage = process.memoryUsage();
    const mem = {
        rss: Math.round(usage.rss / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), 
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024)
    };
    console.log(`${step}: RSS=${mem.rss}MB, Heap=${mem.heapUsed}/${mem.heapTotal}MB, Ext=${mem.external}MB`);
    return mem;
}

console.log('🔍 Testing rules one by one...\n');

logMemory('1. Baseline');

try {
    console.log('2. Importing Rebulk...');
    const { Rebulk } = await import('./src/rules/rebulk.js');
    logMemory('   After Rebulk import');

    console.log('3. Creating minimal Rebulk...');
    const rebulk = new Rebulk();
    logMemory('   After Rebulk creation');

    console.log('4. Testing empty rebulk.matches...');
    const emptyMatches = rebulk.matches('test.mkv', {});
    logMemory('   After empty matches');
    console.log('   Empty matches result:', emptyMatches.matches.length, 'matches');

    console.log('5. Importing rule modules one by one...');
    
    console.log('   5a. Path rules...');
    const { pathRules } = await import('./src/rules/markers/path.js');
    const pathRuleSet = pathRules({});
    rebulk.addRules(pathRuleSet);
    logMemory('   After path rules');
    
    const pathMatches = rebulk.matches('test.mkv', {});
    console.log('   Path matches:', pathMatches.matches.length);

    console.log('   5b. Group rules...');
    const { groupRules } = await import('./src/rules/markers/groups.js');
    const groupRuleSet = groupRules({});
    rebulk.addRules(groupRuleSet);
    logMemory('   After group rules');

    console.log('   5c. Episode rules...');
    const { episodeRules } = await import('./src/rules/properties/episodes.js');
    const episodeRuleSet = episodeRules({});
    rebulk.addRules(episodeRuleSet);
    logMemory('   After episode rules');

    const episodeMatches = rebulk.matches('test.mkv', {});
    console.log('   Episode matches:', episodeMatches.matches.length);

    // Test one by one to find the problematic rule
    console.log('6. Testing matches with accumulated rules...');
    
    const finalMatches = rebulk.matches('test.mkv', {});
    logMemory('   After final matches');
    console.log('   Final matches:', finalMatches.matches.length);

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    logMemory('   After error');
}

if (global.gc) {
    console.log('7. Force GC...');
    global.gc();
    logMemory('   After GC');
}