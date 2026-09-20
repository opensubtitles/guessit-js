#!/usr/bin/env node
// guessit-js CLI — drop-in replacement for the Python `guessit` command.
// Same flags, same output formats (For:/GuessIt found:, -j compact JSON with
// Python separators, -y ?-key YAML), same user-config loading.
// Zero dependencies; the library is bundled in dist/.
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { guessit, properties as apiProperties, version } from '../dist/guessit-js.js';

// Parsing cost grows with the square of the number of matches a name yields, so
// a long synthetic string costs far more than its length suggests: 400
// repetitions of "S01E01" take seconds where a real name takes under 3 ms. The
// whole fixture corpus tops out at 196 characters, so these bounds only ever
// reject something that was never a filename. --serve is the only path that
// takes untrusted input; parsing local arguments stays unbounded.
const MAX_FILENAME_LENGTH = 1024;
const MAX_BATCH = 500;

// Python's GuessitEncoder emits babelfish `.name` in JSON ("English",
// "UNITED STATES") while YAML uses str() ("en", "pt-BR", "US"). Mirror both.
const ALPHA3_TO_2 = {"eng":"en","fra":"fr","deu":"de","spa":"es","ita":"it","por":"pt","rus":"ru","jpn":"ja","zho":"zh","kor":"ko","ara":"ar","hin":"hi","tur":"tr","pol":"pl","nld":"nl","swe":"sv","dan":"da","nor":"no","fin":"fi","hun":"hu","ces":"cs","ron":"ro","ukr":"uk","heb":"he","cat":"ca","vie":"vi","tha":"th","ind":"id","mal":"ml","tel":"te","tam":"ta","bul":"bg","hrv":"hr","srp":"sr","slk":"sk","slv":"sl","ell":"el","lit":"lt","lav":"lv","est":"et","glg":"gl","eus":"eu","ben":"bn","isl":"is","mkd":"mk","bos":"bs","alb":"sq","per":"fa","msa":"ms","mon":"mn","urd":"ur","pan":"pa","guj":"gu","kan":"kn","mar":"mr","asm":"as","mya":"my","khm":"km","lao":"lo"};
const LANGUAGE_NAMES = {"eng":"English","fra":"French","deu":"German","spa":"Spanish","ita":"Italian","por":"Portuguese","rus":"Russian","jpn":"Japanese","zho":"Chinese","kor":"Korean","ara":"Arabic","hin":"Hindi","tur":"Turkish","pol":"Polish","nld":"Dutch","swe":"Swedish","dan":"Danish","nor":"Norwegian","fin":"Finnish","hun":"Hungarian","ces":"Czech","ron":"Romanian","ukr":"Ukrainian","heb":"Hebrew","cat":"Catalan","vie":"Vietnamese","tha":"Thai","ind":"Indonesian","mal":"Malayalam","tel":"Telugu","tam":"Tamil","bul":"Bulgarian","hrv":"Croatian","srp":"Serbian","slk":"Slovak","slv":"Slovenian","ell":"Greek","lit":"Lithuanian","lav":"Latvian","est":"Estonian","glg":"Galician","eus":"Basque","ben":"Bengali","isl":"Icelandic","mkd":"Macedonian","bos":"Bosnian","alb":"Albanian","per":"Persian","msa":"Malay","mon":"Mongolian","urd":"Urdu","pan":"Punjabi","guj":"Gujarati","kan":"Kannada","mar":"Marathi","asm":"Assamese","mya":"Burmese","khm":"Khmer","lao":"Lao"};
const COUNTRY_NAMES = {"US":"UNITED STATES","GB":"UNITED KINGDOM","AU":"AUSTRALIA","CA":"CANADA","NZ":"NEW ZEALAND","IE":"IRELAND","FR":"FRANCE","DE":"GERMANY","ES":"SPAIN","IT":"ITALY","BR":"BRAZIL","PT":"PORTUGAL","RU":"RUSSIAN FEDERATION","JP":"JAPAN","CN":"CHINA","TW":"TAIWAN, PROVINCE OF CHINA","HK":"HONG KONG","KR":"KOREA, REPUBLIC OF","IN":"INDIA","MX":"MEXICO","NL":"NETHERLANDS","SE":"SWEDEN","NO":"NORWAY","DK":"DENMARK","FI":"FINLAND","PL":"POLAND","CH":"SWITZERLAND","AT":"AUSTRIA","BE":"BELGIUM","CZ":"CZECHIA","GR":"GREECE","HU":"HUNGARY","RO":"ROMANIA","TR":"TURKEY","UA":"UKRAINE","AR":"ARGENTINA","ZA":"SOUTH AFRICA"};

const HELP = `usage: guessit-js [options] [filename ...]

positional arguments:
  filename              Filename or release name to guess (@list.txt reads
                        one filename per line; - reads stdin)

Naming:
  -t TYPE, --type TYPE  The suggested file type: movie or episode
  -n, --name-only       Parse files as name only, without extension
  -Y, --date-year-first Take the year first when parsing an ambiguous date
  -D, --date-day-first  Take the day first when parsing an ambiguous date
  -L ALLOWED_LANGUAGES, --allowed-languages ALLOWED_LANGUAGES
                        Allowed language (comma-separated, repeatable)
  -C ALLOWED_COUNTRIES, --allowed-countries ALLOWED_COUNTRIES
                        Allowed country (comma-separated, repeatable)
  -E, --episode-prefer-number
                        Guess "serie.213.avi" as episode 213
  -T EXPECTED_TITLE, --expected-title EXPECTED_TITLE
                        Expected title (repeatable)
  -G EXPECTED_GROUP, --expected-group EXPECTED_GROUP
                        Expected release group (repeatable)
  --includes INCLUDES   Properties to include (comma-separated, repeatable)
  --excludes EXCLUDES   Properties to exclude (comma-separated, repeatable)

Input:
  -f INPUT_FILE, --input-file INPUT_FILE
                        Read filenames from this file (- for stdin)

Output:
  -v, --verbose         Display debug output
  -P SHOW_PROPERTY, --show-property SHOW_PROPERTY
                        Display only the given property value
  -a, --advanced        Display advanced information for filename guesses
  -s, --single-value    Keep only the first value found for each property
  -j, --json            Display information for filename guesses as json output
  --jsonl               Alias of --json (one object per line)
  -y, --yaml            Display information for filename guesses as yaml output
  -i, --output-input-string
                        Add input_string property in the output

Configuration:
  -c CONFIG_FILE, --config CONFIG_FILE
                        Config file to use (JSON, or simple flat YAML)
  --no-user-config      Disable user config (~/.guessit/options.json,
                        ~/.config/guessit/options.json, .yaml/.yml variants)
  --no-default-config   Disable the embedded default config

Information:
  -p, --properties      Display properties that can be guessed
  -V, --values          Display property values that can be guessed
  --version             Display the guessit-js version banner

Extras (not in the Python CLI):
  --serve [PORT]        Start a REST API server (default port 3847;
                        GET /api/guessit?filename=..., POST {filename|filenames})
  --benchmark [N]       Parse the given filenames N times (default 1000)
                        and report throughput
  --completion SHELL    Print a bash or zsh completion script
                        (eval "$(guessit-js --completion bash)")

Exit codes: 0 success, 1 processing error, 2 usage error.`;

function fail(msg) {
  console.error(msg);
  process.exit(2);
}

function readLines(path) {
  const text = path === '-' ? readFileSync(0, 'utf8') : readFileSync(path, 'utf8');
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

// Minimal config-file reader: JSON first, then a flat "key: value" YAML subset
// (scalars, [a, b] inline lists, "- item" block lists).
function readConfigFile(path) {
  const text = readFileSync(path, 'utf8');
  try { return JSON.parse(text); } catch { /* fall through to flat YAML */ }
  const out = {};
  let listKey = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trimEnd();
    if (!line.trim()) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) { out[listKey].push(parseScalar(item[1])); continue; }
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (!value) { out[key] = []; listKey = key; continue; }
    listKey = null;
    if (value.startsWith('[') && value.endsWith(']')) {
      out[key] = value.slice(1, -1).split(',').map((s) => parseScalar(s.trim())).filter((s) => s !== '');
    } else {
      out[key] = parseScalar(value);
    }
  }
  return out;
}
function parseScalar(s) {
  if (s === 'true' || s === 'yes') return true;
  if (s === 'false' || s === 'no') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s.replace(/^['"]|['"]$/g, '');
}

// ---- argument parsing -------------------------------------------------------
const args = process.argv.slice(2);
const filenames = [];
const cliOptions = {};
const configOptions = {};
let output = 'default';
let showProperty = null;
let verbose = false;
let listProperties = false;
let listValues = false;
let noUserConfig = false;
let endOfOptions = false;
let serve = false;
let servePort = 3847;
let benchmark = 0;
let completionShell = null;

const needsValue = (a, i) => {
  if (i + 1 >= args.length) fail(`option ${a} requires a value`);
  return args[i + 1];
};
const pushList = (key, raw) => {
  cliOptions[key] = (cliOptions[key] || []).concat(raw.split(',').map((s) => s.trim()).filter(Boolean));
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
    case '-j': case '--json': case '--jsonl': output = 'json'; break;
    case '-y': case '--yaml': output = 'yaml'; break;
    case '-P': case '--show-property': showProperty = needsValue(a, i); i++; break;
    case '-f': case '--input-file': filenames.push(...readLines(needsValue(a, i))); i++; break;
    case '-i': case '--output-input-string': cliOptions.output_input_string = true; break;
    case '-t': case '--type': cliOptions.type = needsValue(a, i); i++; break;
    case '-n': case '--name-only': cliOptions.name_only = true; break;
    case '-Y': case '--date-year-first': cliOptions.date_year_first = true; break;
    case '-D': case '--date-day-first': cliOptions.date_day_first = true; break;
    case '-L': case '--allowed-languages': pushList('allowed_languages', needsValue(a, i)); i++; break;
    case '-C': case '--allowed-countries': pushList('allowed_countries', needsValue(a, i)); i++; break;
    case '-E': case '--episode-prefer-number': cliOptions.episode_prefer_number = true; break;
    case '-T': case '--expected-title': pushList('expected_title', needsValue(a, i)); i++; break;
    case '-G': case '--expected-group': pushList('expected_group', needsValue(a, i)); i++; break;
    case '--includes': pushList('includes', needsValue(a, i)); i++; break;
    case '--excludes': pushList('excludes', needsValue(a, i)); i++; break;
    case '-s': case '--single-value': cliOptions.single_value = true; break;
    case '-a': case '--advanced': cliOptions.advanced = true; break;
    case '-v': case '--verbose': verbose = true; break;
    case '-c': case '--config': {
      const path = needsValue(a, i); i++;
      try { Object.assign(configOptions, readConfigFile(path)); }
      catch (e) { fail(`cannot read config ${path}: ${e.message}`); }
      break;
    }
    case '--no-user-config': noUserConfig = true; cliOptions.no_user_config = true; break;
    case '--no-default-config': cliOptions.no_default_config = true; break;
    case '-p': case '--properties': listProperties = true; break;
    case '-V': case '--values': listValues = true; break;
    case '--serve':
      serve = true;
      if (args[i + 1] && /^\d+$/.test(args[i + 1])) { servePort = Number(args[++i]); }
      else if (process.env.PORT) servePort = Number(process.env.PORT);
      break;
    case '--benchmark':
      benchmark = args[i + 1] && /^\d+$/.test(args[i + 1]) ? Number(args[++i]) : 1000;
      break;
    case '--completion': completionShell = needsValue(a, i); i++; break;
    case '--version': {
      console.log('+-------------------------------------------------------+');
      console.log(`+                 GuessIt-JS ${version}`.padEnd(56) + '+');
      console.log('+-------------------------------------------------------+');
      console.log('|      Please report any bug or feature request at      |');
      console.log('|   https://github.com/opensubtitles/guessit-js/issues. |');
      console.log('+-------------------------------------------------------+');
      process.exit(0);
      break;
    }
    case '-h': case '--help': console.log(HELP); process.exit(0); break;
    default: fail(`unknown option: ${a} — see --help`);
  }
}

// User config, same locations as Python guessit.
if (!noUserConfig) {
  const home = homedir();
  for (const dir of [join(home, '.guessit'), join(home, '.config', 'guessit')]) {
    for (const ext of ['json', 'yaml', 'yml']) {
      const path = join(dir, `options.${ext}`);
      if (existsSync(path)) {
        try { Object.assign(configOptions, readConfigFile(path)); } catch { /* ignore broken user config */ }
      }
    }
  }
}

// Precedence: user/explicit config < CLI flags.
const options = { ...configOptions, ...cliOptions };
for (const key of ['allowed_languages', 'allowed_countries', 'expected_title', 'expected_group', 'includes', 'excludes']) {
  if (configOptions[key] && cliOptions[key]) options[key] = [...configOptions[key], ...cliOptions[key]];
}

if (options.type && options.type !== 'movie' && options.type !== 'episode') {
  fail(`invalid --type "${options.type}": must be movie or episode`);
}

// ---- value + output formatting ---------------------------------------------
// Python: JSON output uses babelfish .name ("English", "UNITED STATES"),
// YAML output uses str() ("en", "pt-BR", "US"); dates become ISO strings.
function display(v, mode, key) {
  if (Array.isArray(v)) return v.map((x) => display(x, mode, key));
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v && typeof v === 'object') {
    if (typeof v.alpha3 === 'string') {
      if (mode === 'yaml') {
        const base = ALPHA3_TO_2[v.alpha3] || v.alpha3;
        return v.country ? `${base}-${v.country}` : base;
      }
      return LANGUAGE_NAMES[v.alpha3] || v.alpha3;
    }
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = display(val, mode, k);
    return out;
  }
  if (key === 'country' && typeof v === 'string' && mode !== 'yaml') {
    return COUNTRY_NAMES[v] || v;
  }
  return v;
}

// json.dumps-compatible emitters (Python uses ", " / ": " separators).
function pyJson(v) {
  if (Array.isArray(v)) return '[' + v.map(pyJson).join(', ') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.entries(v).map(([k, val]) => `${JSON.stringify(k)}: ${pyJson(val)}`).join(', ') + '}';
  }
  return JSON.stringify(v);
}
function pyJsonIndent(v, level = 1) {
  const pad = '    '.repeat(level);
  const close = '    '.repeat(level - 1);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    return '[\n' + v.map((x) => pad + pyJsonIndent(x, level + 1)).join(',\n') + `\n${close}]`;
  }
  if (v && typeof v === 'object') {
    const entries = Object.entries(v);
    if (!entries.length) return '{}';
    return '{\n' + entries.map(([k, x]) => `${pad}${JSON.stringify(k)}: ${pyJsonIndent(x, level + 1)}`).join(',\n') + `\n${close}}`;
  }
  return JSON.stringify(v);
}

function yamlScalar(v) {
  if (typeof v !== 'string') return String(v);
  const needsQuote =
    /^[\s'"&*?|>%@`!,\[\]{}#-]/.test(v) || /: /.test(v) || / #/.test(v) ||
    /[\n\t]/.test(v) || /\s$/.test(v) || v.endsWith(':') ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(v) || /^-?[\d.]+$/.test(v);
  // pyyaml prefers single-quoted style
  return needsQuote ? `'${v.replace(/'/g, "''")}'` : v;
}
function toYaml(value, indent) {
  if (Array.isArray(value)) {
    return value.map((v) =>
      typeof v === 'object' && v !== null
        ? `${indent}-\n${toYaml(v, indent + '  ')}`
        : `${indent}- ${yamlScalar(v)}`
    ).join('\n');
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).map(([k, v]) => {
      if (Array.isArray(v)) return `${indent}${k}:\n${toYaml(v, indent)}`; // pyyaml: list items at key level
      if (typeof v === 'object' && v !== null) return `${indent}${k}:\n${toYaml(v, indent + '  ')}`;
      return `${indent}${k}: ${yamlScalar(v)}`;
    }).join('\n');
  }
  return indent + yamlScalar(value);
}

// Advanced mode returns live Match objects; reduce them to the Python shape.
function simplifyAdvanced(v) {
  if (Array.isArray(v)) return v.map(simplifyAdvanced);
  if (v && typeof v === 'object' && 'start' in v && 'end' in v) {
    const out = { value: display(v.value, 'json') };
    if (v.raw) out.raw = v.raw; // Python omits raw for synthesized matches
    out.start = v.start;
    out.end = v.end;
    return out;
  }
  return v;
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

// ---- shell completion -------------------------------------------------------
if (completionShell) {
  const flags = '-t --type -n --name-only -Y --date-year-first -D --date-day-first -L --allowed-languages -C --allowed-countries -E --episode-prefer-number -T --expected-title -G --expected-group --includes --excludes -f --input-file -v --verbose -P --show-property -a --advanced -s --single-value -j --json --jsonl -y --yaml -i --output-input-string -c --config --no-user-config --no-default-config -p --properties -V --values --version --serve --benchmark --completion -h --help';
  if (completionShell === 'bash') {
    console.log(`_guessit_js() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  if [[ "$cur" == -* ]]; then
    COMPREPLY=( $(compgen -W "${flags}" -- "$cur") )
  else
    COMPREPLY=( $(compgen -f -- "$cur") )
  fi
}
complete -F _guessit_js guessit-js guessit`);
  } else if (completionShell === 'zsh') {
    console.log(`#compdef guessit-js guessit
_arguments '*: :{ _alternative "flags:flag:(${flags})" "files:filename:_files" }'`);
  } else {
    fail(`unsupported shell "${completionShell}": use bash or zsh`);
  }
  process.exit(0);
}

// ---- REST API server --------------------------------------------------------
if (serve) {
  const { createServer } = await import('http');
  const baseOptions = options;
  const sendJson = (res, status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(data, null, 2));
  };
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${servePort}`);
    if (req.method === 'OPTIONS') { sendJson(res, 204, {}); return; }
    if (url.pathname === '/api/health') { sendJson(res, 200, { status: 'ok', version }); return; }
    if (url.pathname !== '/api/guessit' && url.pathname !== '/') {
      sendJson(res, 404, { error: 'Not found — use /api/guessit' });
      return;
    }
    if (req.method === 'GET') {
      const filename = url.searchParams.get('filename');
      if (!filename) {
        sendJson(res, 400, {
          error: 'Missing required parameter: filename',
          usage: `GET /api/guessit?filename=Movie.2020.1080p.mkv[&type=movie|episode] · POST /api/guessit {"filename": "..."} or {"filenames": ["..."]}`,
        });
        return;
      }
      if (filename.length > MAX_FILENAME_LENGTH) {
        sendJson(res, 413, { error: `filename exceeds ${MAX_FILENAME_LENGTH} characters` });
        return;
      }
      const opts = { ...baseOptions };
      const type = url.searchParams.get('type');
      if (type === 'movie' || type === 'episode') opts.type = type;
      try { sendJson(res, 200, display(guessit(filename, opts), 'json')); }
      catch (e) { sendJson(res, 500, { error: String((e && e.message) || e) }); }
      return;
    }
    if (req.method === 'POST') {
      const chunks = [];
      let size = 0;
      req.on('data', (c) => { size += c.length; if (size > 1 << 20) req.destroy(); else chunks.push(c); });
      req.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const opts = { ...baseOptions, ...(body.options || {}) };
          if (Array.isArray(body.filenames)) {
            if (body.filenames.length > MAX_BATCH) {
              sendJson(res, 413, { error: `Max ${MAX_BATCH} filenames per request` });
              return;
            }
            const names = body.filenames.map(String);
            if (names.some((f) => f.length > MAX_FILENAME_LENGTH)) {
              sendJson(res, 413, { error: `filename exceeds ${MAX_FILENAME_LENGTH} characters` });
              return;
            }
            sendJson(res, 200, names.map((f) => display(guessit(f, opts), 'json')));
          } else if (typeof body.filename === 'string') {
            if (body.filename.length > MAX_FILENAME_LENGTH) {
              sendJson(res, 413, { error: `filename exceeds ${MAX_FILENAME_LENGTH} characters` });
              return;
            }
            sendJson(res, 200, display(guessit(body.filename, opts), 'json'));
          } else {
            sendJson(res, 400, { error: 'Body must contain "filename" (string) or "filenames" (array)' });
          }
        } catch (e) { sendJson(res, 400, { error: String((e && e.message) || e) }); }
      });
      return;
    }
    sendJson(res, 405, { error: 'Method not allowed' });
  });
  server.listen(servePort, () => {
    console.log(`guessit-js ${version} API listening on http://localhost:${servePort}`);
    console.log(`  GET  /api/guessit?filename=Movie.2020.1080p.mkv`);
    console.log(`  POST /api/guessit {"filename": "..."} or {"filenames": ["...", "..."]}`);
    console.log(`  GET  /api/health`);
  });
} else {

// ---- main -------------------------------------------------------------------
if (!process.stdin.isTTY && !filenames.length) {
  filenames.push(...readLines('-'));
}
if (!filenames.length) fail('usage: guessit-js [options] <filename> — see --help');

if (benchmark > 0) {
  guessit(filenames[0], options); // warm up (builds the pattern matcher)
  const t0 = performance.now();
  for (let n = 0; n < benchmark; n++) {
    for (const f of filenames) guessit(f, options);
  }
  const elapsed = performance.now() - t0;
  const total = benchmark * filenames.length;
  console.log(`guessit-js ${version} benchmark`);
  console.log(`  ${total} parses (${filenames.length} filename${filenames.length > 1 ? 's' : ''} × ${benchmark} iterations)`);
  console.log(`  total:      ${(elapsed / 1000).toFixed(2)} s`);
  console.log(`  per parse:  ${(elapsed / total).toFixed(3)} ms`);
  console.log(`  throughput: ${Math.round(total / (elapsed / 1000))} parses/s`);
  process.exit(0);
}

let hadError = false;
for (const filename of filenames) {
  let result;
  try {
    const raw = guessit(filename, options);
    if (options.advanced) {
      result = {};
      for (const [k, v] of Object.entries(raw)) result[k] = simplifyAdvanced(v);
    } else {
      result = display(raw, output === 'yaml' ? 'yaml' : 'json');
    }
  } catch (e) {
    hadError = true;
    result = { error: String((e && e.message) || e) };
  }

  if (verbose && output === 'default' && !showProperty) {
    // Approximation of Python's rebulk debug log: one line per final match.
    try {
      const adv = guessit(filename, { ...options, advanced: true });
      for (const [name, v] of Object.entries(adv)) {
        for (const m of Array.isArray(v) ? v : [v]) {
          if (m && typeof m === 'object' && 'start' in m) {
            console.log(`Match found. (<${m.raw}:(${m.start}, ${m.end})+name=${name}>)`);
          }
        }
      }
    } catch { /* debug output is best-effort */ }
  }

  if (showProperty) {
    const v = result[showProperty];
    console.log(v === undefined ? '' : typeof v === 'object' && v !== null ? pyJson(v) : String(v));
  } else if (output === 'json') {
    console.log(pyJson(result));
  } else if (output === 'yaml') {
    console.log(`? ${yamlScalar(filename)}`);
    const body = toYaml(result, '  ');
    console.log(':' + body.slice(1));
  } else {
    console.log(`For: ${filename}`);
    console.log(`GuessIt found: ${pyJsonIndent(result)}`);
  }
}

process.exit(hadError ? 1 : 0);
} // end of non-serve mode
