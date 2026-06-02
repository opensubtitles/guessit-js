// Builds the GitHub Pages artifacts under public/:
//   - public/dist/guessit-browser.js  (esbuild IIFE, global `GuessitJS`)
//   - public/wasm/guessit.wasm         (copied from the wasm build)
//   - public/docs/output-schema.json   (the output JSON Schema)
// Run with: npm run build:pages   (run `npm run wasm` first to refresh the .wasm)
import { build } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => join(root, ...p);

await build({
  entryPoints: [r('src/index.ts')],
  bundle: true,
  format: 'iife',
  globalName: 'GuessitJS',
  outfile: r('public/dist/guessit-browser.js'),
  platform: 'browser',
  target: 'es2020',
  keepNames: true,
  define: { 'process.env.DEBUG_CONFLICT': 'false', 'process.env.DEBUG_SS': 'false' },
  alias: { '@': r('src') },
});
console.log('✓ public/dist/guessit-browser.js');

await build({
  entryPoints: [r('src/index.ts')],
  bundle: true,
  format: 'esm',
  outfile: r('public/dist/guessit-js.js'),
  platform: 'neutral',
  target: 'es2020',
  keepNames: true,
  define: { 'process.env.DEBUG_CONFLICT': 'false', 'process.env.DEBUG_SS': 'false' },
  alias: { '@': r('src') },
});
console.log('✓ public/dist/guessit-js.js');

for (const dir of ['public/wasm', 'public/docs']) if (!existsSync(r(dir))) mkdirSync(r(dir), { recursive: true });
if (existsSync(r('wasm/guessit.wasm'))) {
  copyFileSync(r('wasm/guessit.wasm'), r('public/wasm/guessit.wasm'));
  console.log('✓ public/wasm/guessit.wasm');
}
copyFileSync(r('docs/output-schema.json'), r('public/docs/output-schema.json'));
console.log('✓ public/docs/output-schema.json');
