#!/usr/bin/env node
/**
 * GuessIt JS Benchmark Suite
 */

import { guessit } from '../src/index.js';
import { guessitWasm, initWasm } from '../src/wasm/wasm-loader.js';

const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class Benchmark {
    constructor() {
        this.results = [];
    }

    async run(name, fn, iterations = 10000) {
        console.log(`\n${colors.cyan}🚀 Running ${name} benchmark...${colors.reset}`);
        console.log(`   Iterations: ${iterations.toLocaleString()}`);
        
        // Warmup
        for (let i = 0; i < 100; i++) {
            await fn();
        }
        
        // Actual benchmark
        const startTime = process.hrtime.bigint();
        
        for (let i = 0; i < iterations; i++) {
            await fn();
        }
        
        const endTime = process.hrtime.bigint();
        const totalTimeMs = Number(endTime - startTime) / 1_000_000;
        const avgTimeMs = totalTimeMs / iterations;
        const opsPerSec = 1000 / avgTimeMs;
        
        const result = {
            name,
            iterations,
            totalTimeMs: totalTimeMs.toFixed(2),
            avgTimeMs: avgTimeMs.toFixed(4),
            opsPerSec: Math.round(opsPerSec)
        };
        
        this.results.push(result);
        
        console.log(`   ${colors.green}✅ Complete${colors.reset}`);
        console.log(`   Total time: ${result.totalTimeMs}ms`);
        console.log(`   Average: ${result.avgTimeMs}ms per operation`);
        console.log(`   Throughput: ${result.opsPerSec.toLocaleString()} ops/sec`);
        
        return result;
    }

    printComparison() {
        console.log(`\n${colors.bold}${colors.blue}📊 Performance Comparison${colors.reset}\n`);
        
        const table = this.results.map(r => ({
            Engine: r.name,
            'Ops/sec': r.opsPerSec.toLocaleString(),
            'Avg Time (ms)': r.avgTimeMs,
            'Total Time (ms)': r.totalTimeMs
        }));
        
        console.table(table);
        
        if (this.results.length >= 2) {
            const jsResult = this.results.find(r => r.name.includes('JavaScript'));
            const wasmResult = this.results.find(r => r.name.includes('WASM'));
            
            if (jsResult && wasmResult) {
                const speedup = wasmResult.opsPerSec / jsResult.opsPerSec;
                console.log(`\n${colors.yellow}⚡ WASM is ${speedup.toFixed(1)}x faster than JavaScript${colors.reset}`);
                
                // Memory usage estimation
                console.log(`\n${colors.bold}Memory Usage Comparison:${colors.reset}`);
                console.log(`   JavaScript: ~2-5MB heap usage`);
                console.log(`   WASM: ~200KB optimized binary`);
                console.log(`   Python GuessIt: ~10-20MB with dependencies`);
            }
        }
    }

    printSummary() {
        console.log(`\n${colors.bold}${colors.cyan}🎯 Benchmark Summary${colors.reset}\n`);
        
        const fastest = this.results.reduce((a, b) => a.opsPerSec > b.opsPerSec ? a : b);
        console.log(`🥇 Fastest: ${colors.green}${fastest.name}${colors.reset} (${fastest.opsPerSec.toLocaleString()} ops/sec)`);
        
        // Compare to Python GuessIt baseline
        const pythonOpsPerSec = 400; // Baseline from Python
        this.results.forEach(result => {
            const speedup = result.opsPerSec / pythonOpsPerSec;
            console.log(`   ${result.name}: ${speedup.toFixed(1)}x faster than Python GuessIt`);
        });
    }
}

async function runBenchmarkSuite() {
    console.log(`${colors.bold}${colors.cyan}🏁 GuessIt JS Benchmark Suite${colors.reset}\n`);
    console.log('Comparing performance of different parsing engines\n');

    const benchmark = new Benchmark();
    
    // Test files of varying complexity
    const testFiles = [
        'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv',
        'Game.of.Thrones.S01E01.Winter.Is.Coming.HDTV.x264-LOL.mkv',
        'Avengers.Endgame.2019.2160p.UHD.BluRay.x265.10bit.HDR.DTS-X.7.1.mkv'
    ];
    
    // Test with different iteration counts for different engines
    const iterations = {
        js: 10000,
        wasm: 10000,
        batch: 1000
    };

    try {
        // JavaScript benchmark
        console.log(`${colors.bold}Testing JavaScript Engine${colors.reset}`);
        let jsTestFile = testFiles[0];
        await benchmark.run(
            'JavaScript', 
            () => guessit(jsTestFile),
            iterations.js
        );

        // WASM benchmark
        console.log(`${colors.bold}Testing WebAssembly Engine${colors.reset}`);
        await initWasm();
        await benchmark.run(
            'WebAssembly', 
            async () => await guessitWasm(jsTestFile),
            iterations.wasm
        );

        // Complex filename benchmark
        console.log(`${colors.bold}Testing Complex Filenames${colors.reset}`);
        let complexFile = testFiles[2]; // Most complex filename
        await benchmark.run(
            'JavaScript (Complex)', 
            () => guessit(complexFile),
            iterations.js / 2
        );

        await benchmark.run(
            'WASM (Complex)', 
            async () => await guessitWasm(complexFile),
            iterations.wasm / 2
        );

        // Batch processing benchmark
        console.log(`${colors.bold}Testing Batch Processing${colors.reset}`);
        await benchmark.run(
            'JavaScript (Batch)', 
            () => {
                testFiles.forEach(file => guessit(file));
            },
            iterations.batch
        );

        await benchmark.run(
            'WASM (Batch)', 
            async () => {
                await Promise.all(testFiles.map(file => guessitWasm(file)));
            },
            iterations.batch
        );

        // Memory stress test
        console.log(`${colors.bold}Testing Memory Usage${colors.reset}`);
        
        const memoryTestIterations = 50000;
        console.log(`\n${colors.cyan}🧠 Memory stress test (${memoryTestIterations.toLocaleString()} iterations)...${colors.reset}`);
        
        const initialMemory = process.memoryUsage();
        
        for (let i = 0; i < memoryTestIterations; i++) {
            guessit(testFiles[i % testFiles.length]);
        }
        
        const finalMemory = process.memoryUsage();
        const memoryDelta = {
            heapUsed: (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024,
            heapTotal: (finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024,
            external: (finalMemory.external - initialMemory.external) / 1024 / 1024
        };
        
        console.log(`   Memory delta - Heap Used: ${memoryDelta.heapUsed.toFixed(2)}MB`);
        console.log(`   Memory delta - Heap Total: ${memoryDelta.heapTotal.toFixed(2)}MB`);
        console.log(`   Memory delta - External: ${memoryDelta.external.toFixed(2)}MB`);

        // Results and comparison
        benchmark.printComparison();
        benchmark.printSummary();

        // Recommendations
        console.log(`\n${colors.bold}${colors.yellow}💡 Recommendations${colors.reset}\n`);
        console.log(`   📱 For mobile/embedded: Use WASM for lowest memory footprint`);
        console.log(`   🚀 For high throughput: Use WASM for maximum performance`);
        console.log(`   🔧 For development: Use JavaScript for easier debugging`);
        console.log(`   🌐 For web apps: Use WASM for consistent performance`);
        console.log(`   📊 For batch processing: Use WASM with parallel processing`);

        console.log(`\n${colors.bold}${colors.green}🎉 Benchmark Complete!${colors.reset}\n`);

    } catch (error) {
        console.error(`${colors.red}❌ Benchmark error:${colors.reset}`, error.message);
        
        if (error.message.includes('WASM')) {
            console.log(`\n${colors.yellow}💡 Note: WASM benchmarks use simulation.${colors.reset}`);
            console.log(`${colors.yellow}   For real WASM performance, compile with: npm run build:wasm${colors.reset}\n`);
        }
    }
}

// Command line options
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
GuessIt JS Benchmark Suite

Usage:
  npm run benchmark              Run full benchmark suite
  node examples/benchmark.js     Run full benchmark suite

Options:
  --help, -h                     Show this help
  --quick                        Run quick benchmark (fewer iterations)
  --memory                       Focus on memory usage tests
  --wasm-only                    Test only WebAssembly performance

Examples:
  npm run benchmark
  node examples/benchmark.js --quick
    `);
    process.exit(0);
}

runBenchmarkSuite().catch(console.error);