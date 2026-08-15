// Builds the GitHub Pages artifacts under public/:
//   - public/dist/guessit-browser.js  (esbuild IIFE, global `GuessitJS`)
//   - public/wasm/guessit.wasm         (copied from the wasm build)
//   - public/docs/output-schema.json   (the output JSON Schema)
// Run with: npm run build:pages   (run `npm run wasm` first to refresh the .wasm)
import { build } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
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

// Single source of truth for the WASM test page: expected outputs are computed
// from the JS build we just bundled, so the page always tests WASM-vs-JS parity
// against current behavior instead of hand-maintained expectations.
{
  const { guessit } = await import(r('public/dist/guessit-js.js'));
  const cases = [
    'The.Dark.Knight.2008.1080p.BluRay.x264-GROUP.mkv',
    'Breaking.Bad.S01E02.720p.BluRay.x264-DEMAND.mkv',
    'Game.of.Thrones.S08E06.The.Iron.Throne.1080p.AMZN.WEB-DL.DDP5.1.H.264-GoT.mkv',
    'Inception.2010.REMASTERED.2160p.UHD.BluRay.x265-TERMiNAL.mkv',
    'Dune Part Two 2024 1080p WEB-DL DD+ 5.1 Atmos H.265-FLUX.mkv',
    '[SubGroup] Naruto Shippuden - 301 [720p][AAC].mkv',
    'Cowboy.Bebop.-.23.-.Brain.Scratch.[1080p.BluRay.FLAC].mkv',
    'The.Office.US.S02E01.The.Dundies.DVDRIP.XviD-TOPAZ.avi',
    'Friends.S01E01.720p.BluRay.mkv',
    'Movie.2024.2160p.UHD.BluRay.x265.mkv',
    'Show.S01E01.720p.HDTV.x264-LOL.avi',
    'Movie.FRENCH.DVDRip.XviD.avi',
    'Movie.1080p.WEB-DL.DD5.1.H.264-GROUP.mkv',
    'test.mkv',
    'Movie (2024).mkv',
    'Show.Name.2x05.720p.mkv',
    'Movie.REMASTERED.2024.mkv',
    'Interstellar 2014 IMAX 2160p UHD Blu-ray Remux HDR HEVC Atmos-GROUP.mkv',
    'Movies/The Matrix (1999)/The.Matrix.1999.REMASTERED.1080p.BluRay.x264-GROUP.mkv',
    'Fargo.-.Season.1.-.720p.BluRay.x264.mkv',
    ...JSON.parse(readFileSync(r('scripts/showcase-examples.json'), 'utf8')),
    'Mission.Impossible.Dead.Reckoning.Part.One.2023.2160p.WEB-DL.mkv',
    'Show.S01E01E02E03.720p.mkv',
    'Le.Fabuleux.Destin.d.Amelie.Poulain.2001.FRENCH.1080p.mkv',
    '4.3.2.1.2010.720p.BluRay.mkv',
    'Show (2019) - S01E01 - Pilot (1080p BluRay x265 Silence).mkv',
  ];
  const out = cases.map((filename) => [filename, guessit(filename)]);
  writeFileSync(r('public/dist/wasm-test-cases.json'), JSON.stringify(out, null, 1));
  console.log(`✓ public/dist/wasm-test-cases.json (${out.length} cases, expectations from current JS build)`);
}

// Stamp the current package version into the pages so they never go stale.
// Python guessit references are written without the vX.Y.Z pattern on purpose.
const { version } = JSON.parse(readFileSync(r('package.json'), 'utf8'));
for (const page of ['public/index.html', 'public/docs/index.html']) {
  const html = readFileSync(r(page), 'utf8');
  const stamped = html.replace(/v\d+\.\d+\.\d+/g, `v${version}`);
  if (stamped !== html) {
    writeFileSync(r(page), stamped);
    console.log(`✓ ${page} stamped v${version}`);
  }
}

// Keep the OpenAPI spec's version in sync too.
{
  const spec = JSON.parse(readFileSync(r('public/openapi.json'), 'utf8'));
  if (spec.info.version !== version) {
    spec.info.version = version;
    writeFileSync(r('public/openapi.json'), JSON.stringify(spec, null, 2) + '\n');
    console.log(`✓ public/openapi.json stamped ${version}`);
  }
}
