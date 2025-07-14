#!/usr/bin/env node
/**
 * Debug step-by-step imports to find the memory leak source
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

console.log('🔍 Step-by-step import debugging...\n');

logMemory('1. Baseline');

try {
    console.log('2. Importing exceptions...');
    const { GuessItException } = await import('./src/exceptions.js');
    logMemory('   After exceptions');

    console.log('3. Importing options...');
    const { parseOptions, loadConfig, mergeOptions } = await import('./src/options.js');
    logMemory('   After options');

    console.log('4. Testing parseOptions...');
    const opts = parseOptions({}, true);
    logMemory('   After parseOptions');

    console.log('5. Testing loadConfig...');
    const config = loadConfig(opts);
    logMemory('   After loadConfig');

    console.log('6. Importing rules index...');
    const { RebulkBuilder } = await import('./src/rules/index.js');
    logMemory('   After rules index');

    console.log('7. Testing RebulkBuilder (this is likely the culprit)...');
    const rebulk = RebulkBuilder({});
    logMemory('   After RebulkBuilder creation');

    console.log('8. Testing rebulk.matches...');
    const matches = rebulk.matches('test.mkv', {});
    logMemory('   After rebulk.matches');

    console.log('9. Testing toDict...');
    const result = matches.toDict(false, false, false);
    logMemory('   After toDict');

    console.log('✅ Success! Result:', result);

} catch (error) {
    console.error('❌ Error at step:', error.message);
    console.error('Stack:', error.stack);
}

if (global.gc) {
    console.log('10. Force GC...');
    global.gc();
    logMemory('   After GC');
}