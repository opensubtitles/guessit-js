# Third-Party Notices

guessit-js is a TypeScript port of the Python [guessit](https://github.com/guessit-io/guessit)
library by the guessit-io team, licensed under LGPL-3.0. This project inherits that license
(see [LICENSE](LICENSE)).

## Build toolchain

The WebAssembly build (`wasm/guessit.wasm`) is produced with
[Javy](https://github.com/bytecodealliance/javy) by the Bytecode Alliance, licensed under the
[Apache License 2.0](https://github.com/bytecodealliance/javy/blob/main/LICENSE). Javy is
downloaded on demand by `wasm/build.sh` and is not distributed with this repository.

## Embedded in the WASM artifact

The `guessit.wasm` binary produced by the build embeds the Javy runtime, which includes:

- **Javy** — Copyright the Bytecode Alliance contributors, licensed under the
  [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
- **QuickJS** — Copyright Fabrice Bellard and Charlie Gordon, licensed under the
  [MIT License](https://github.com/bellard/quickjs/blob/master/LICENSE).

If you redistribute `guessit.wasm`, retain these notices.

## Development dependencies

- **Binaryen (`wasm-opt`)** — Apache License 2.0, used only at build time for optimization.
