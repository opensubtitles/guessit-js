#!/usr/bin/env python3
"""Generate public/dist/python-compare.json: real Python guessit output for every
demo example, regenerated at every Pages deploy so the comparison shown on the
demo page always reflects the currently released Python guessit.

Each name gets two forms:
  results    Python's own JSON (what `guessit --json` prints), shown on the page.
  canonical  the same values in guessit-js's notation (language -> ISO 639-3,
             country -> ISO 3166 alpha-2, date -> YYYY-MM-DD), so the page can
             tell "same answer, different notation" apart from a real difference.
"""

import datetime
import json
from pathlib import Path

from guessit import guessit
from guessit.__version__ import __version__
from guessit.jsonutils import GuessitEncoder

root = Path(__file__).resolve().parent.parent
groups = json.loads((root / "scripts" / "showcase-examples.json").read_text())
names = [name for group in groups.values() for name in group]


def canonical(value):
    if isinstance(value, list):
        return [canonical(v) for v in value]
    if hasattr(value, "alpha3") and type(value).__name__ == "Language":
        return value.alpha3
    if hasattr(value, "alpha2") and type(value).__name__ == "Country":
        return value.alpha2
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()[:10]
    return json.loads(json.dumps(value, cls=GuessitEncoder))


results, canon = {}, {}
for name in names:
    guess = guessit(name)
    results[name] = json.loads(json.dumps(guess, cls=GuessitEncoder))
    canon[name] = {key: canonical(value) for key, value in guess.items()}

out = {
    "python_guessit_version": __version__,
    "groups": groups,
    "results": results,
    "canonical": canon,
}
target = root / "public" / "dist" / "python-compare.json"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(f"✓ {target.relative_to(root)} (python guessit {__version__}, {len(names)} names)")
