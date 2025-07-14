#!/usr/bin/env node
/**
 * Memory leak debugging script
 */

console.log('🔍 Starting memory leak investigation...');

// Monitor memory usage
function getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        rss: Math.round(usage.rss / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), 
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024)
    };
}

function logMemory(step) {
    const mem = getMemoryUsage();
    console.log(`${step}: RSS=${mem.rss}MB, Heap=${mem.heapUsed}/${mem.heapTotal}MB, Ext=${mem.external}MB`);
    return mem;
}

console.log('\n=== Step 1: Baseline Memory ===');
const baseline = logMemory('Baseline');

console.log('\n=== Step 2: Import Index ===');
try {
    // Just import the module - no execution
    const { guessit } = await import('./src/index.js');
    logMemory('After import');
    
    console.log('\n=== Step 3: Single Parse ===');
    // Try one simple parse
    const result = guessit('test.mkv');
    const afterParse = logMemory('After single parse');
    console.log('Parse result:', result);
    
    console.log('\n=== Step 4: Memory Growth Test ===');
    // Test if memory grows with multiple calls
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
        guessit('test.mkv');
        if (i % 10 === 0) {
            const mem = logMemory(`After ${i} iterations`);
            if (mem.heapUsed > afterParse.heapUsed + 100) {
                console.log('❌ Memory leak detected! Stopping early.');
                break;
            }
        }
    }
    
    console.log('\n=== Step 5: Final Memory ===');
    logMemory('Final');
    
} catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Stack trace:', error.stack);
    logMemory('After error');
}

console.log('\n=== Step 6: Force GC and Check ===');
if (global.gc) {
    global.gc();
    logMemory('After GC');
} else {
    console.log('GC not available (run with --expose-gc)');
}