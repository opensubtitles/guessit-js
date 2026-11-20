// Node helper for the guessit WASI module. The .wasm is a WASI command built
// with Javy: it reads {"filename", "options"} JSON on stdin and writes the
// result JSON on stdout. Any other WASI runtime (wasmtime, wasmer, ...) can run
// `wasmPath` directly; this file only wraps that contract for Node.
import { fileURLToPath } from 'node:url';

export const wasmPath = fileURLToPath(new URL('./guessit.wasm', import.meta.url));

let modulePromise;

function loadModule() {
  if (!modulePromise) {
    modulePromise = (async () => {
      const { readFile } = await import('node:fs/promises');
      return WebAssembly.compile(await readFile(wasmPath));
    })();
  }
  return modulePromise;
}

/**
 * Parse a media filename with the WASM build of guessit-js.
 * @param {string} filename
 * @param {Record<string, unknown>} [options]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function guessit(filename, options = {}) {
  if (typeof filename !== 'string' || !filename) throw new TypeError('filename must be a non-empty string');
  const [{ WASI }, fs, os, path] = await Promise.all([
    import('node:wasi'), import('node:fs'), import('node:os'), import('node:path'),
  ]);
  const module = await loadModule();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guessit-wasm-'));
  const inPath = path.join(dir, 'in.json');
  const outPath = path.join(dir, 'out.json');
  fs.writeFileSync(inPath, JSON.stringify({ filename, options }));
  const stdin = fs.openSync(inPath, 'r');
  const stdout = fs.openSync(outPath, 'w');
  try {
    const wasi = new WASI({ version: 'preview1', args: [], env: {}, stdin, stdout, stderr: 2, returnOnExit: true });
    const instance = await WebAssembly.instantiate(module, wasi.getImportObject());
    wasi.start(instance);
  } finally {
    fs.closeSync(stdin);
    fs.closeSync(stdout);
  }
  try {
    const result = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    if (result && typeof result === 'object' && 'error' in result && Object.keys(result).length === 1) {
      throw new Error(`guessit-wasm: ${result.error}`);
    }
    return result;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export default guessit;
