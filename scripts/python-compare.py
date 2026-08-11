#!/usr/bin/env python3
"""Generate public/dist/python-compare.json: real Python guessit output for the
showcase examples, regenerated at every Pages deploy so the comparison shown on
the demo page always reflects the currently released Python guessit."""

import json
from pathlib import Path

from guessit import guessit
from guessit.__version__ import __version__
from guessit.jsonutils import GuessitEncoder

root = Path(__file__).resolve().parent.parent
examples = json.loads((root / "scripts" / "showcase-examples.json").read_text())

results = {
    name: json.loads(json.dumps(guessit(name), cls=GuessitEncoder))
    for name in examples
}

out = {"python_guessit_version": __version__, "results": results}
target = root / "public" / "dist" / "python-compare.json"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(f"✓ {target.relative_to(root)} (python guessit {__version__})")
