"""Confirm every case in test/fixtures/better-than-python.yml still beats Python guessit.

Each case asserts guessit-js output; this script runs the same names through a
real Python guessit and FAILS for any case Python now satisfies completely —
such a case is no longer an improvement and belongs in the normal fixtures.

    python3 -m venv .venv-py && .venv-py/bin/pip install guessit pyyaml
    .venv-py/bin/python scripts/check-better-than-python.py            # check
    .venv-py/bin/python scripts/check-better-than-python.py --table    # README table

Comparison: languages as ISO alpha-2/alpha-3, countries as alpha-2, everything
else by value; "-prop: value" asserts the property is NOT that value.
"""
import re
import sys
from pathlib import Path

import yaml
from guessit import guessit, __version__ as py_version

FIXTURE = Path(__file__).resolve().parent.parent / 'test' / 'fixtures' / 'better-than-python.yml'


def codes(v):
    """All spellings of a babelfish Language/Country, lower-cased."""
    out = {str(v).lower()}
    for attr in ('alpha2', 'alpha3', 'name'):
        x = getattr(v, attr, None)
        if x:
            out.add(str(x).lower())
    return out


def same(got, exp):
    if hasattr(got, 'alpha3') or hasattr(got, 'alpha2'):
        return str(exp).lower() in codes(got)
    if isinstance(got, str):
        return got.lower() == str(exp).lower()
    return got == exp


def satisfies(result, key, expected):
    negate = key.startswith('-')
    key = key.lstrip('-')
    got = result.get(key)
    if got is None or expected is None:
        ok = got is None and expected is None
    elif isinstance(got, list) or isinstance(expected, list):
        g = got if isinstance(got, list) else [got]
        e = expected if isinstance(expected, list) else [expected]
        ok = len(g) == len(e) and all(any(same(x, y) for x in g) for y in e)
    else:
        ok = same(got, expected)
    return not ok if negate else ok


def cases():
    text = FIXTURE.read_text(encoding='utf-8')
    data = yaml.safe_load(text)
    comments = {}
    last = None
    for line in text.splitlines():
        m = re.match(r'#\s*python:\s*(.*)', line)
        if m:
            last = m.group(1)
        elif line.startswith('? '):
            name = yaml.safe_load(line[2:])
            comments[str(name)] = last
    for name, expected in data.items():
        yield str(name), expected or {}, comments.get(str(name))


def main():
    rows, agreed = [], []
    for name, expected, why in cases():
        options = expected.pop('options', None)
        result = dict(guessit(name, options or {}))
        if all(satisfies(result, k, v) for k, v in expected.items()):
            agreed.append(name)
        shown = ', '.join(f'{k} {v!r}' if not isinstance(v, list) else f'{k} {v}' for k, v in expected.items()
                          if not k.startswith('-') and k not in ('type', 'container'))
        rows.append((name, why or '', shown))
    if '--table' in sys.argv:
        print(f'| Input | guessit-js | Python guessit {py_version} |\n|---|---|---|')
        for name, why, shown in rows:
            print(f'| `{name}` | {shown} | {why} |')
        return 0
    print(f'{len(rows)} cases checked against Python guessit {py_version}')
    for name in agreed:
        print(f'  PYTHON NOW AGREES: {name!r} -> move it to the normal fixtures')
    return 1 if agreed else 0


if __name__ == '__main__':
    sys.exit(main())
