#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "=== Building guessit-js WASM ==="

# Step 0: Ensure Javy is available (downloaded on demand — never committed, see issue #1).
# The download is pinned by version AND sha256 (values from Javy's published
# .sha256 release assets). Overriding JAVY_VERSION requires JAVY_SHA256 too.
JAVY="${JAVY:-tools/javy}"
JAVY_PINNED_VERSION=v9.1.0
JAVY_VERSION="${JAVY_VERSION:-$JAVY_PINNED_VERSION}"
if [ ! -x "$JAVY" ]; then
  echo "0. Downloading Javy $JAVY_VERSION..."
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64)  JAVY_PLATFORM=x86_64-linux; PINNED_SHA=a68b122d48eb3dfc1b801d4e14c39271fde3638243d3272d206e376ac9189e39 ;;
    Linux-aarch64) JAVY_PLATFORM=arm-linux;    PINNED_SHA=826962f0e82354cf97d6e928ea36777872bbae76c626e326948e0367c4b55cb5 ;;
    Darwin-arm64)  JAVY_PLATFORM=arm-macos;    PINNED_SHA=99e9ec6a8e8c98e119d137c08a921d2443d3b873c675a5571e1800f4451e6294 ;;
    Darwin-x86_64) JAVY_PLATFORM=x86_64-macos; PINNED_SHA=6eed2927575dc2b3fb5a1563eee1ce0874e6da91c9cec39a728c9377a8cc7b5a ;;
    *) echo "Unsupported platform: $(uname -s)-$(uname -m)"; exit 1 ;;
  esac
  if [ -n "$JAVY_SHA256" ]; then
    EXPECTED_SHA="$JAVY_SHA256"
  elif [ "$JAVY_VERSION" = "$JAVY_PINNED_VERSION" ]; then
    EXPECTED_SHA="$PINNED_SHA"
  else
    echo "JAVY_VERSION=$JAVY_VERSION is not the pinned $JAVY_PINNED_VERSION: set JAVY_SHA256 for it."; exit 1
  fi
  JAVY_ASSET="javy-$JAVY_PLATFORM-$JAVY_VERSION.gz"
  mkdir -p "$(dirname "$JAVY")"
  TMP_GZ="$(mktemp)"
  trap 'rm -f "$TMP_GZ"' EXIT
  curl -fsSL "https://github.com/bytecodealliance/javy/releases/download/$JAVY_VERSION/$JAVY_ASSET" -o "$TMP_GZ"
  if command -v sha256sum >/dev/null; then ACTUAL_SHA=$(sha256sum "$TMP_GZ" | cut -d' ' -f1)
  else ACTUAL_SHA=$(shasum -a 256 "$TMP_GZ" | cut -d' ' -f1); fi
  if [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
    echo "Javy checksum mismatch for $JAVY_ASSET"; echo "  expected $EXPECTED_SHA"; echo "  actual   $ACTUAL_SHA"; exit 1
  fi
  echo "   sha256 verified: $ACTUAL_SHA"
  gunzip -c "$TMP_GZ" > "$JAVY"
  chmod +x "$JAVY"
fi
# Javy >= v3 uses `build`; older versions use `compile`
if "$JAVY" build --help >/dev/null 2>&1; then JAVY_CMD=build; else JAVY_CMD=compile; fi
echo "   Javy: $("$JAVY" --version 2>/dev/null || echo "$JAVY_VERSION") (subcommand: $JAVY_CMD)"

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
"$JAVY" $JAVY_CMD wasm/guessit-wasm.js -o wasm/guessit.wasm
SIZE_RAW=$(wc -c < wasm/guessit.wasm | tr -d " ")
echo "   Raw: $(du -h wasm/guessit.wasm | cut -f1) ($SIZE_RAW bytes)"

# Step 4: Optimize with wasm-opt if available
if command -v npx &>/dev/null && npx wasm-opt --version &>/dev/null 2>&1; then
  echo "4. Optimizing with wasm-opt..."
  npx wasm-opt wasm/guessit.wasm -Oz --strip-debug -o wasm/guessit.opt.wasm
  SIZE_OPT=$(wc -c < wasm/guessit.opt.wasm | tr -d " ")
  SAVED=$(( SIZE_RAW - SIZE_OPT ))
  echo "   Optimized: $(du -h wasm/guessit.opt.wasm | cut -f1) ($SIZE_OPT bytes, saved $SAVED bytes)"
  mv wasm/guessit.opt.wasm wasm/guessit.wasm
else
  echo "4. wasm-opt not available, skipping optimization"
fi

# Step 5: Create gzipped version
echo "5. Creating compressed version..."
gzip -9 -k -f wasm/guessit.wasm
echo "   Gzipped: $(du -h wasm/guessit.wasm.gz | cut -f1) ($(wc -c < wasm/guessit.wasm.gz | tr -d " ") bytes)"

echo ""
echo "=== Build complete ==="
echo "  wasm/guessit.wasm    $(du -h wasm/guessit.wasm | cut -f1)"
echo "  wasm/guessit.wasm.gz $(du -h wasm/guessit.wasm.gz | cut -f1)"
echo ""
echo "Test: echo '{\"filename\":\"Movie.2024.1080p.mkv\"}' | wasmtime wasm/guessit.wasm"
