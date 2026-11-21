# @opensubtitles/guessit-wasm

[guessit-js](https://github.com/opensubtitles/guessit-js) compiled to one standalone
WebAssembly module (QuickJS via [Javy](https://github.com/bytecodealliance/javy)).
It has no JS runtime dependency and runs in any WASI runtime.

> Using JavaScript/TypeScript? Prefer the [`guessit-js`](https://www.npmjs.com/package/guessit-js)
> package — it's smaller and faster. This package exists for WASI hosts
> (wasmtime, wasmer, Go/Rust/Python embedders, edge runtimes).

The version always matches the `guessit-js` release it was built from. The same
binaries are attached to each [GitHub release](https://github.com/opensubtitles/guessit-js/releases).

## Contract

`guessit.wasm` is a WASI command. Write JSON to stdin and read one JSON object from stdout:

```sh
echo '{"filename":"The.Matrix.1999.1080p.BluRay.x264.mkv"}' | wasmtime node_modules/@opensubtitles/guessit-wasm/guessit.wasm
# {"title":"The Matrix","year":1999,"screen_size":"1080p","source":"Blu-ray",...}
```

The input can include `"options"` (the same options as `guessit-js`, e.g. `{"type":"episode"}`).
If it fails, the output is `{"error":"..."}`.

## Node helper

```js
import { guessit, wasmPath } from '@opensubtitles/guessit-wasm';

const result = await guessit('Show.S01E02.720p.mkv');
// { title: 'Show', season: 1, episode: 2, screen_size: '720p', ... }
```

`guessit()` instantiates the module once per call through `node:wasi`. Compilation is cached.

## Files

| File | |
|---|---|
| `guessit.wasm` | the module (~1.8 MB) |
| `guessit.wasm.gz` | gzip -9 of the same (~750 KB) |

License: LGPL-3.0, same as guessit-js.
