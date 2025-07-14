/**
 * Real WebAssembly loader for GuessIt (uses compiled WASM)
 */

let wasmModule = null;
let wasmReady = false;

/**
 * Initialize the real WASM module
 */
export async function initWasm() {
    if (wasmReady) return wasmModule;
    
    try {
        // Load the Emscripten-generated module using script tag approach
        // since the WASM file may not be proper ES module
        if (typeof window !== 'undefined' && !window.GuessItWasm) {
            // Load the WASM script dynamically
            const script = document.createElement('script');
            script.src = '../../dist/guessit-wasm.js';
            document.head.appendChild(script);
            
            // Wait for the script to load
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
        }
        
        const GuessItWasm = window.GuessItWasm;
        
        // Initialize the WASM module
        wasmModule = await GuessItWasm();
        
        // Call the initialization function
        wasmModule._init();
        
        wasmReady = true;
        console.log('✅ Real WASM module initialized');
        return wasmModule;
    } catch (error) {
        console.error('Failed to initialize real WASM module:', error);
        throw error;
    }
}

/**
 * Real WASM-powered guessit function
 */
export async function guessitWasm(filename) {
    if (!wasmReady) {
        await initWasm();
    }
    
    if (!wasmModule) {
        throw new Error('WASM module not initialized');
    }
    
    try {
        // Use ccall to call the WASM function directly with string input
        const resultString = wasmModule.ccall('guessit', 'string', ['string'], [filename]);
        
        // Parse and return JSON result
        return JSON.parse(resultString);
    } catch (error) {
        console.error('WASM guessit error:', error);
        throw error;
    }
}

/**
 * Get real WASM version
 */
export async function getWasmVersion() {
    if (!wasmReady) {
        await initWasm();
    }
    
    const version = wasmModule.ccall('version', 'string', [], []);
    
    return version;
}

/**
 * Performance benchmark
 */
export async function benchmarkWasm(filename, iterations = 10000) {
    if (!wasmReady) {
        await initWasm();
    }
    
    console.log(`🚀 WASM Performance Benchmark: ${iterations} iterations`);
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        await guessitWasm(filename);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    const opsPerSec = 1000 / avgTime;
    
    return {
        total_time_ms: totalTime,
        average_time_ms: avgTime,
        operations_per_second: Math.round(opsPerSec),
        iterations
    };
}

// Helper functions (these would be available from Emscripten in real usage)
function lengthBytesUTF8(str) {
    return new TextEncoder().encode(str).length;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
    const bytes = new TextEncoder().encode(str + '\0');
    if (wasmModule.HEAPU8) {
        wasmModule.HEAPU8.set(bytes.slice(0, maxBytesToWrite), outPtr);
    }
}

function UTF8ToString(ptr) {
    if (wasmModule.HEAPU8) {
        let length = 0;
        while (wasmModule.HEAPU8[ptr + length] !== 0) length++;
        const bytes = wasmModule.HEAPU8.slice(ptr, ptr + length);
        return new TextDecoder().decode(bytes);
    }
    return '';
}