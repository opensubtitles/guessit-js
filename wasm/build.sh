#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "=== Building guessit-js WASM ==="

# Step 1: Bundle with esbuild (IIFE, minified, all-in-one)
echo "1. Bundling with esbuild (minified)..."
node -e "
const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'GuessitJS',
  outfile: 'wasm/guessit-bundle.min.js',
  platform: 'neutral',
  target: 'es2020',
  minify: true,
  keepNames: true,
  define: { 'process.env.DEBUG_CONFLICT': 'false', 'process.env.DEBUG_SS': 'false' },
  alias: { '@': './src' },
});
" 2>/dev/null
echo "   Bundle: $(wc -c < wasm/guessit-bundle.min.js | tr -d ' ') bytes (minified)"

# Step 2: Create WASM wrapper
echo "2. Creating WASM wrapper..."
cat > wasm/guessit-wasm.js << 'SHIM'
var process = { env: {} };
SHIM
cat wasm/guessit-bundle.min.js >> wasm/guessit-wasm.js
cat >> wasm/guessit-wasm.js << 'ENTRY'

var guessit = GuessitJS.guessit;
ENTRY
cat wasm/entry.js >> wasm/guessit-wasm.js
echo "   Wrapper: $(wc -c < wasm/guessit-wasm.js | tr -d ' ') bytes"

# Step 3: Compile to WASM with Javy
echo "3. Compiling to WASM..."
tools/javy compile wasm/guessit-wasm.js -o wasm/guessit.wasm
SIZE_RAW=$(stat -c%s wasm/guessit.wasm)
echo "   Raw: $(du -h wasm/guessit.wasm | cut -f1) ($SIZE_RAW bytes)"

# Step 4: Optimize with wasm-opt if available
if command -v npx &>/dev/null && npx wasm-opt --version &>/dev/null 2>&1; then
  echo "4. Optimizing with wasm-opt..."
  npx wasm-opt wasm/guessit.wasm -Oz --strip-debug -o wasm/guessit.opt.wasm
  SIZE_OPT=$(stat -c%s wasm/guessit.opt.wasm)
  SAVED=$(( SIZE_RAW - SIZE_OPT ))
  echo "   Optimized: $(du -h wasm/guessit.opt.wasm | cut -f1) ($SIZE_OPT bytes, saved $SAVED bytes)"
  mv wasm/guessit.opt.wasm wasm/guessit.wasm
else
  echo "4. wasm-opt not available, skipping optimization"
fi

# Step 5: Create gzipped version
echo "5. Creating compressed version..."
gzip -9 -k -f wasm/guessit.wasm
echo "   Gzipped: $(du -h wasm/guessit.wasm.gz | cut -f1) ($(stat -c%s wasm/guessit.wasm.gz) bytes)"

echo ""
echo "=== Build complete ==="
echo "  wasm/guessit.wasm    $(du -h wasm/guessit.wasm | cut -f1)"
echo "  wasm/guessit.wasm.gz $(du -h wasm/guessit.wasm.gz | cut -f1)"
echo ""
echo "Test: echo '{\"filename\":\"Movie.2024.1080p.mkv\"}' | wasmtime wasm/guessit.wasm"
