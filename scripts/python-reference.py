"""Regenerate test/fixtures/python-reference.json — the offline Python golden snapshot.

Its keys are the corpus that `scripts/collect-schema-data.mjs` and
`test/schema.test.ts` walk when deriving the output schema, and its values record
what Python returned for each input at the stated version. Refresh it whenever the
fixture corpus grows, so the published schema is never derived from a stale
corpus: the 3.8.0 snapshot it replaced covered 1009 inputs and left six emittable
properties (credits_number, imdb_id, tmdb_id, tvdb_id, volume, week) out of the
schema and the TypeScript types entirely.

For comparing behaviour against Python, use `scripts/python-diff.mts`, which runs
a live guessit and canonicalises languages and countries before diffing.

    python -m venv /tmp/refenv
    # six: guessit 4.5.1 imports it without declaring it (guessit-io/guessit#991)
    /tmp/refenv/bin/pip install "guessit==4.5.1" six
    NAMES=<path>/names.json OUT=test/fixtures/python-reference.json \
        /tmp/refenv/bin/python scripts/python-reference.py

`names.json` comes from `npx tsx scripts/python-diff.mts --collect`, so the
snapshot always covers exactly the inputs the live comparison uses.
"""

import json
import os
import sys

import guessit
from guessit import api
from guessit.jsonutils import GuessitEncoder

NAMES = os.environ.get("NAMES", "names.json")
OUT = os.environ.get("OUT", "test/fixtures/python-reference.json")

with open(NAMES) as fh:
    entries = json.load(fh)

results = {}
skipped = 0
for index, entry in enumerate(entries):
    # Only the no-options inputs belong in the snapshot: its consumers replay the
    # key through guessit() with defaults, so an entry parsed under -t/-L/-G would
    # compare against a result those defaults cannot reproduce.
    if entry.get("options"):
        skipped += 1
        continue
    name = entry["input"]
    try:
        results[name] = json.loads(json.dumps(dict(api.guessit(name)), cls=GuessitEncoder))
    except Exception as exc:
        print(f"skip {name!r}: {type(exc).__name__}: {exc}", file=sys.stderr)
        skipped += 1
    if index % 500 == 0:
        print(f"{index}/{len(entries)}", file=sys.stderr)

snapshot = {
    "count": len(results),
    "files": ["every fixture in test/fixtures (see scripts/python-diff.mts --collect)"],
    "guessit_version": guessit.__version__,
    "results": results,
}
with open(OUT, "w") as fh:
    json.dump(snapshot, fh, indent=1, sort_keys=True)
print(f"wrote {len(results)} results ({skipped} skipped) at guessit {guessit.__version__} to {OUT}")
