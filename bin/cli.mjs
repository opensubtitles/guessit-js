#!/usr/bin/env node
// guessit-js CLI — mirrors the Python `guessit` command-line interface.
// Zero dependencies; the library is bundled in dist/.
import { readFileSync } from 'fs';
import { guessit, properties as apiProperties, version } from '../dist/guessit-js.js';

const HELP = `guessit-js ${version} — extract metadata from media filenames

Usage: guessit-js [options] <filename> [<filename> ...]
       guessit-js [options] @list.txt            filenames from file (one per line)
       guessit-js [options] -f list.txt          same as @list.txt (use - for stdin)
       echo "Movie.mkv" | guessit-js [options]   filenames from piped stdin

Output:
  -j, --json                 JSON (single object, or array for multiple inputs)
      --jsonl                one JSON object per line (streaming-friendly)
  -y, --yaml                 YAML
  -P, --show-property <name> print only this property's value
  -i, --output-input-string  include the input string in the result

Parsing options:
  -t, --type <type>          suggested type: movie or episode
  -n, --name-only            parse as a name without extension
  -Y, --date-year-first      ambiguous dates: year first
  -D, --date-day-first       ambiguous dates: day first
  -L, --allowed-languages    comma-separated language codes (e.g. en,fr)
  -C, --allowed-countries    comma-separated country codes (e.g. us,gb)
  -E, --episode-prefer-number  prefer episode over season for lone numbers
  -T, --expected-title       expected title (repeatable)
  -G, --expected-group       expected release group (repeatable)
      --includes <props>     comma-separated properties to include (repeatable)
      --excludes <props>     comma-separated properties to exclude (repeatable)
  -s, --single-value         only the first value per property
  -a, --advanced             raw match data (start/end/raw per property)
  -c, --config <file>        JSON file with extra options (merged in)

Introspection:
  -p, --properties           list all detectable property names
  -V, --values               list all property names with their possible values

Misc:
  -v, --version              print version
  -h, --help                 this help
  --                         end of options; everything after is a filename

Exit codes: 0 success, 1 processing error, 2 usage error.`;

function fail(msg) {
  console.error(msg);
  process.exit(2);
}

function readLines(path) {
  const text = path === '-' ? readFileSync(0, 'utf8') : readFileSync(path, 'utf8');
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

// ---- argument parsing -------------------------------------------------------
const args = process.argv.slice(2);
const filenames = [];
const options = {};
let output = 'lines';
let showProperty = null;
let listProperties = false;
let listValues = false;
let endOfOptions = false;

const needsValue = (a, i) => {
  if (i + 1 >= args.length) fail(`option ${a} requires a value`);
  return args[i + 1];
};
const pushList = (key, raw) => {
  options[key] = (options[key] || []).concat(raw.split(',').map((s) => s.trim()).filter(Boolean));
};

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (endOfOptions || !a.startsWith('-') || a === '-') {
    if (a.startsWith('@') && a.length > 1 && !endOfOptions) filenames.push(...readLines(a.slice(1)));
    else if (a === '-') filenames.push(...readLines('-'));
    else filenames.push(a);
    continue;
  }
  switch (a) {
    case '--': endOfOptions = true; break;
    case '-j': case '--json': output = 'json'; break;
    case '--jsonl': output = 'jsonl'; break;
    case '-y': case '--yaml': output = 'yaml'; break;
    case '-P': case '--show-property': showProperty = needsValue(a, i); i++; break;
    case '-f': case '--input-file': filenames.push(...readLines(needsValue(a, i))); i++; break;
    case '-i': case '--output-input-string': options.output_input_string = true; break;
    case '-t': case '--type': options.type = needsValue(a, i); i++; break;
    case '-n': case '--name-only': options.name_only = true; break;
    case '-Y': case '--date-year-first': options.date_year_first = true; break;
    case '-D': case '--date-day-first': options.date_day_first = true; break;
    case '-L': case '--allowed-languages': pushList('allowed_languages', needsValue(a, i)); i++; break;
    case '-C': case '--allowed-countries': pushList('allowed_countries', needsValue(a, i)); i++; break;
    case '-E': case '--episode-prefer-number': options.episode_prefer_number = true; break;
    case '-T': case '--expected-title': pushList('expected_title', needsValue(a, i)); i++; break;
    case '-G': case '--expected-group': pushList('expected_group', needsValue(a, i)); i++; break;
    case '--includes': pushList('includes', needsValue(a, i)); i++; break;
    case '--excludes': pushList('excludes', needsValue(a, i)); i++; break;
    case '-s': case '--single-value': options.single_value = true; break;
    case '-a': case '--advanced': options.advanced = true; break;
    case '-c': case '--config': {
      const path = needsValue(a, i); i++;
      try { Object.assign(options, JSON.parse(readFileSync(path, 'utf8'))); }
      catch (e) { fail(`cannot read config ${path}: ${e.message}`); }
      break;
    }
    case '-p': case '--properties': listProperties = true; break;
    case '-V': case '--values': listValues = true; break;
    case '-v': case '--version': console.log(version); process.exit(0); break;
    case '-h': case '--help': console.log(HELP); process.exit(0); break;
    default: fail(`unknown option: ${a} — see --help`);
  }
}

if (options.type && options.type !== 'movie' && options.type !== 'episode') {
  fail(`invalid --type "${options.type}": must be movie or episode`);
}

// ---- output helpers ---------------------------------------------------------
function toYaml(value, indent = '') {
  if (Array.isArray(value)) {
    return value.map((v) =>
      typeof v === 'object' && v !== null
        ? `${indent}-\n${toYaml(v, indent + '  ')}`
        : `${indent}- ${yamlScalar(v)}`
    ).join('\n');
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).map(([k, v]) =>
      typeof v === 'object' && v !== null
        ? `${indent}${k}:\n${toYaml(v, indent + '  ')}`
        : `${indent}${k}: ${yamlScalar(v)}`
    ).join('\n');
  }
  return indent + yamlScalar(value);
}
function yamlScalar(v) {
  if (typeof v !== 'string') return String(v);
  return /^[\w][\w .+-]*$/.test(v) && !/^(true|false|null|yes|no|on|off|[\d.]+)$/i.test(v)
    ? v
    : JSON.stringify(v);
}

function printLines(name, result, many) {
  if (many) console.log(`For: ${name}`);
  for (const [k, v] of Object.entries(result)) {
    console.log(`${many ? '  ' : ''}${k}: ${typeof v === 'object' && v !== null ? JSON.stringify(v) : v}`);
  }
}

// ---- introspection modes ----------------------------------------------------
if (listProperties || listValues) {
  const props = apiProperties(options);
  for (const name of Object.keys(props).sort()) {
    if (listValues) {
      const vals = (props[name] || []).filter((v) => v !== null && v !== undefined);
      console.log(`${name}${vals.length ? ': ' + vals.join(', ') : ''}`);
    } else {
      console.log(name);
    }
  }
  process.exit(0);
}

// ---- main -------------------------------------------------------------------
if (!process.stdin.isTTY && !filenames.length) {
  filenames.push(...readLines('-'));
}
if (!filenames.length) fail('usage: guessit-js [options] <filename> — see --help');

// Advanced mode returns live Match objects; reduce them to the Python-CLI shape
// ({value, raw, start, end}) instead of dumping engine internals.
function simplifyAdvanced(v) {
  if (Array.isArray(v)) return v.map(simplifyAdvanced);
  if (v && typeof v === 'object' && 'start' in v && 'end' in v) {
    return { value: v.value, raw: v.raw, start: v.start, end: v.end };
  }
  return v;
}

let hadError = false;
const results = filenames.map((f) => {
  try {
    const r = guessit(f, options);
    if (!options.advanced) return r;
    const out = {};
    for (const [k, v] of Object.entries(r)) out[k] = simplifyAdvanced(v);
    return out;
  } catch (e) {
    hadError = true;
    return { error: String(e && e.message || e) };
  }
});

if (showProperty) {
  results.forEach((r) => {
    const v = r[showProperty];
    console.log(v === undefined ? '' : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));
  });
} else if (output === 'json') {
  console.log(JSON.stringify(filenames.length === 1 ? results[0] : results, null, 2));
} else if (output === 'jsonl') {
  results.forEach((r) => console.log(JSON.stringify(r)));
} else if (output === 'yaml') {
  results.forEach((r, i) => {
    if (filenames.length > 1) console.log(`${i ? '\n' : ''}? ${yamlScalar(filenames[i])}\n:`);
    console.log(toYaml(r, filenames.length > 1 ? '  ' : ''));
  });
} else {
  results.forEach((r, i) => {
    if (i) console.log('');
    printLines(filenames[i], r, filenames.length > 1);
  });
}

process.exit(hadError ? 1 : 0);
