#!/usr/bin/env node
/**
 * Debug full RebulkBuilder with step-by-step rule loading
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

console.log('🔍 Testing full RebulkBuilder step by step...\n');

logMemory('1. Baseline');

try {
    console.log('2. Creating rebulk and minimal config...');
    const { Rebulk } = await import('./src/rules/rebulk.js');
    const rebulk = new Rebulk();
    logMemory('   After Rebulk creation');

    // Test each rule type individually
    const rules = [
        { name: 'path', module: './src/rules/markers/path.js', func: 'pathRules' },
        { name: 'groups', module: './src/rules/markers/groups.js', func: 'groupRules' },
        { name: 'episodes', module: './src/rules/properties/episodes.js', func: 'episodeRules' },
        { name: 'container', module: './src/rules/properties/container.js', func: 'containerRules' },
        { name: 'source', module: './src/rules/properties/source.js', func: 'sourceRules' },
        { name: 'video_codec', module: './src/rules/properties/video_codec.js', func: 'videoCodecRules' },
        { name: 'screen_size', module: './src/rules/properties/screen_size.js', func: 'screenSizeRules' },
        { name: 'title', module: './src/rules/properties/title.js', func: 'titleRules' }
    ];

    for (const rule of rules) {
        try {
            console.log(`3. Testing ${rule.name} rules...`);
            
            const ruleModule = await import(rule.module);
            const ruleFn = ruleModule[rule.func];
            
            if (typeof ruleFn === 'function') {
                const ruleSet = ruleFn({});
                rebulk.addRules(ruleSet);
                logMemory(`   After ${rule.name} rules`);
                
                // Test matches after each rule addition
                const matches = rebulk.matches('The.Matrix.1999.1080p.BluRay.x264.mkv', {});
                console.log(`   ${rule.name} matches: ${matches.matches.length}`);
                
                // Check if memory is growing dangerously
                const currentMem = logMemory(`   Memory check after ${rule.name}`);
                if (currentMem.heapUsed > 100) {
                    console.log(`❌ Memory usage too high after ${rule.name} rules! Stopping.`);
                    break;
                }
            } else {
                console.log(`   ⚠️  ${rule.func} is not a function`);
            }
        } catch (error) {
            console.log(`   ❌ Error with ${rule.name}: ${error.message}`);
        }
    }

    console.log('4. Final test...');
    const finalMatches = rebulk.matches('test.mkv', {});
    logMemory('   After final test');
    console.log('   Final result:', finalMatches.matches.length, 'matches');

} catch (error) {
    console.error('❌ Error:', error.message);
    logMemory('   After error');
}

if (global.gc) {
    console.log('5. Force GC...');
    global.gc();
    logMemory('   After GC');
}