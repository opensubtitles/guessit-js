/** Absolute path to guessit.wasm (a WASI command: JSON on stdin, JSON on stdout). */
export declare const wasmPath: string;

/** Parse a media filename with the WASM build of guessit-js (Node >= 18, node:wasi). */
export declare function guessit(
  filename: string,
  options?: Record<string, unknown>,
): Promise<Record<string, unknown>>;

export default guessit;
