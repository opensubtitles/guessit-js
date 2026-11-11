"""Dump Python guessit's output for every name in the port's fixture corpus.

Run inside a checkout of upstream guessit, which supplies the interpreter and the
rebulk/babelfish dependencies:

    cd <guessit checkout>                 # e.g. a worktree of origin/develop
    uv sync --frozen
    NAMES=<path>/names.json OUT=<path>/python-out.json uv run python \
        <guessit-js>/scripts/python-dump.py

`names.json` comes from `scripts/python-diff.mts --collect`, which also consumes
the dump. Keeping the two halves apart is what lets the comparison run against a
real Python guessit without this package depending on Python at all.
"""

import json
import os
import sys

from guessit import api
from guessit.jsonutils import GuessitEncoder

NAMES = os.environ.get("NAMES", "names.json")
OUT = os.environ.get("OUT", "python-out.json")

with open(NAMES) as fh:
    names = json.load(fh)


def parse_options(raw):
    """A fixture's options are either a CLI string or a mapping; guessit takes both."""
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return dict(raw)
    from guessit.options import parse_options as po

    return po(raw, True)


results = []
for index, entry in enumerate(names):
    record = {"input": entry["input"], "options": entry.get("options"), "source": entry["source"]}
    try:
        guess = api.guessit(entry["input"], parse_options(entry.get("options")))
        record["result"] = json.loads(json.dumps(dict(guess), cls=GuessitEncoder))
    except Exception as exc:  # a fixture may deliberately pass options guessit rejects
        record["error"] = f"{type(exc).__name__}: {exc}"
    results.append(record)
    if index % 500 == 0:
        print(f"{index}/{len(names)}", file=sys.stderr)

with open(OUT, "w") as fh:
    json.dump(results, fh)
print(f"wrote {len(results)} results to {OUT}")
