#!/usr/bin/env node
// guessit-js CLI — mirrors the Python `guessit` command.
//   guessit-js <filename> [<filename> ...]   property: value lines
//   guessit-js -j <filename>                 JSON output
//   guessit-js -t movie <filename>           force type
import { guessit, version } from '../dist/guessit-js.js';

const args = process.argv.slice(2);
const filenames = [];
let json = false;
let type = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-j' || a === '--json') json = true;
  else if (a === '-t' || a === '--type') type = args[++i];
  else if (a === '-v' || a === '--version') {
    console.log(version);
    process.exit(0);
  } else if (a === '-h' || a === '--help') {
    console.log(`guessit-js ${version} — extract metadata from media filenames

Usage: guessit-js [options] <filename> [<filename> ...]

Options:
  -j, --json          output JSON (single object, or array for multiple files)
  -t, --type <type>   suggested type: movie or episode
  -v, --version       print version
  -h, --help          this help`);
    process.exit(0);
  } else filenames.push(a);
}

if (!filenames.length) {
  console.error('usage: guessit-js [options] <filename> — see --help');
  process.exit(2);
}

const options = type ? { type } : {};
const results = filenames.map((f) => guessit(f, options));

if (json) {
  console.log(JSON.stringify(filenames.length === 1 ? results[0] : results, null, 2));
} else {
  results.forEach((r, i) => {
    if (filenames.length > 1) console.log(`${i ? '\n' : ''}For: ${filenames[i]}`);
    for (const [k, v] of Object.entries(r)) {
      console.log(`${k}: ${Array.isArray(v) ? JSON.stringify(v) : v}`);
    }
  });
}
