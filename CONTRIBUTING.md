# Contributing to guessit-js

Thanks for helping! The project is a TypeScript port of Python
[guessit](https://github.com/guessit-io/guessit) that tracks its fixture corpus
at 100% and fixes cases Python gets wrong on top.

## Setup

```bash
npm install
npm test            # full suite (fixtures + unit + CLI; WASM test needs wasmtime)
npm run typecheck
```

## The golden rule: fixtures first

Every behavior change needs a fixture. The suite is YAML-driven —
`test/*.yml` maps filenames to expected properties (subset matching):

```yaml
? My.Show.S01E02.720p.mkv
: title: My Show
  season: 1
  episode: 2
```

- Fixing a parse bug → add the case to the matching `test/*.yml`
  (or `test/fixtures/upstream-open-issues.yml` for upstream-tracked cases)
  **before** the fix, watch it fail, then fix.
- Never regress: the full suite must stay green — the corpus includes Python
  guessit 4.5.1's own test set, both its corpus files and its per-rule ones
  (`test/fixtures/upstream-corpus-*.yml`, `upstream-rules-*.yml`). Cases upstream
  asserts that this port does not satisfy yet live in
  `test/fixtures/upstream-rules-pending.yml`, which is deliberately not in
  `FIXTURE_FILES`; see `docs/upstream-issues.md`.
- Guard both directions: when a rule is conditional, pin a fixture for the
  case it must NOT affect too.

## Where things live

- `rebulk-js` (npm, own repo) — pattern-matching engine, the port of Python rebulk
- `src/rules/properties/*.ts` — one module per property (title, episodes, …)
- `src/config/options.json` — JSON-driven patterns and synonyms
- `bin/cli.mjs` — drop-in CLI (byte-compatible with Python's, tested in CI)
- `wasm/` — Javy/QuickJS build, bit-identical to JS on the whole corpus

## Pull requests

- Run `npm run typecheck && npm test` before pushing.
- Match surrounding code style; no new runtime dependencies (the package is
  zero-dep by design — WASM compatibility depends on it).
- CI runs the suite on Node 18/20/22, the CLI drop-in parity job against
  pip-installed Python guessit, and the WASM bit-identity corpus.
