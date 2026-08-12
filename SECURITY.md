# Security Policy

## Supported versions

The latest published minor release receives fixes. guessit-js has zero runtime
dependencies, parses untrusted strings with bounded regex work, and performs no
I/O, eval, or network access at parse time.

## Reporting a vulnerability

Please use [GitHub private vulnerability reporting](https://github.com/opensubtitles/guessit-js/security/advisories/new)
— do not open a public issue for security reports. You can expect an initial
response within a week.

Reports we consider in scope: ReDoS (pathological input causing catastrophic
regex backtracking), prototype pollution through crafted filenames or config,
and anything letting parsed input escape the parser (the `--serve` HTTP API
included).
