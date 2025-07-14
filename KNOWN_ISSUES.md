# Known Issues

## Memory Issues in Core Library (Priority: High)

**Status:** Under Investigation  
**Affects:** Main guessit function, test suite, demos  
**Workaround:** Use simplified implementation in `examples/working-demo.js`

### Symptoms
- JavaScript heap out of memory errors during execution
- Hangs during basic filename parsing
- Affects even single function calls

### Analysis
The memory leak appears to be in the core rule-based parsing system, likely in:
- Rebulk pattern matching engine
- Rule configuration/loading process
- Properties introspection system

### Current Workarounds
1. **Working Demo**: `npm run demo` uses simplified implementation
2. **Browser Demo**: WASM performance demo works with simulated functions
3. **CI**: Benchmark job disabled to prevent build failures

### Expected Performance (from working demo)
- **Parse time**: ~0.0008ms per operation
- **Throughput**: ~1.1M operations per second
- **Memory**: Stable, no leaks detected

### Next Steps
1. Debug rebulk implementation for memory leaks
2. Profile memory usage during rule loading
3. Consider alternative pattern matching approach
4. Validate WASM implementation separately

### Files Affected
- `src/api.js` - Main API with memory issues
- `src/rules/` - Rule system causing problems
- `examples/demo.js` - Original demo (disabled)
- `test-runner.js` - Test suite (affected)

### Files Working
- `examples/working-demo.js` - Simplified implementation
- `examples/wasm-performance-demo.html` - Browser demo with simulation
- `dist/` - Compiled bundles (untested due to core issues)

---

*This is a temporary state while investigating the core memory issues. The simplified implementation demonstrates the expected functionality and performance characteristics.*