/**
 * CLI test suite — spawns bin/cli.mjs against the built dist bundle.
 * Requires `npm run build` first (skipped automatically when dist is missing).
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(__dirname, '..');
const CLI = join(root, 'bin', 'cli.mjs');
const hasDist = existsSync(join(root, 'dist', 'guessit-js.js'));

function run(args: string[], input?: string): { stdout: string; code: number } {
  try {
    const stdout = execFileSync('node', [CLI, ...args], {
      encoding: 'utf8',
      input,
      env: { ...process.env, HOME: join(tmpdir(), 'guessit-cli-nohome') },
    });
    return { stdout, code: 0 };
  } catch (e: unknown) {
    const err = e as { stdout?: string; status?: number };
    return { stdout: err.stdout ?? '', code: err.status ?? 1 };
  }
}

describe.skipIf(!hasDist)('CLI', () => {
  it('default output uses the Python For:/GuessIt found: format', () => {
    const { stdout } = run(['Movie.2020.1080p.mkv']);
    expect(stdout).toContain('For: Movie.2020.1080p.mkv');
    expect(stdout).toContain('GuessIt found: {');
    expect(stdout).toContain('    "title": "Movie",');
  });

  it('-j emits compact JSON with Python separators, one line per file', () => {
    const { stdout } = run(['-j', 'Movie.2020.1080p.mkv']);
    expect(stdout.trim().split('\n')).toHaveLength(1);
    expect(stdout).toContain('{"title": "Movie", "year": 2020');
  });

  it('-j uses babelfish language display names', () => {
    const { stdout } = run(['-j', 'B.S01E02 en.mkv']);
    expect(stdout).toContain('"language": "English"');
  });

  it('-y uses pyyaml block style with codes for languages', () => {
    const { stdout } = run(['-y', 'B.S01E02 en.mkv']);
    expect(stdout).toContain('? B.S01E02 en.mkv');
    expect(stdout).toContain(': title: B');
    expect(stdout).toContain('language: en');
  });

  it('-y single-quotes ambiguous scalars and keeps lists at key level', () => {
    const { stdout } = run(['-y', 'Dune.2021.2160p.WEB-DL.DDP5.1.Atmos.mkv']);
    expect(stdout).toContain("audio_channels: '5.1'");
    expect(stdout).toContain('audio_codec:\n  - Dolby Digital Plus');
  });

  it('-P prints only the property value; empty line when missing', () => {
    expect(run(['-P', 'title', 'Movie.2020.mkv']).stdout.trim()).toBe('Movie');
    expect(run(['-P', 'year', 'Movie.mkv']).stdout).toBe('\n');
  });

  it('-a emits {value, raw, start, end} and omits raw for synthesized matches', () => {
    const { stdout } = run(['-a', '-j', 'Movie.2020.mkv']);
    const parsed = JSON.parse(stdout);
    expect(parsed.year).toMatchObject({ value: 2020, raw: '2020' });
    expect(parsed.mimetype.raw).toBeUndefined();
  });

  it('reads filenames from @file, -f, and stdin', () => {
    const dir = join(tmpdir(), 'guessit-cli-test');
    mkdirSync(dir, { recursive: true });
    const list = join(dir, 'list.txt');
    writeFileSync(list, 'A.2020.mkv\nB.S01E02.mkv\n');
    expect(run([`@${list}`, '-j']).stdout.trim().split('\n')).toHaveLength(2);
    expect(run(['-f', list, '-j']).stdout.trim().split('\n')).toHaveLength(2);
    expect(run(['-j'], 'A.2020.mkv\nB.S01E02.mkv\n').stdout.trim().split('\n')).toHaveLength(2);
  });

  it('applies parsing options (-t, --excludes, -L)', () => {
    expect(JSON.parse(run(['-j', '-t', 'episode', 'Aliens.720p.mkv']).stdout).type).toBe('episode');
    expect(run(['-j', '--excludes', 'screen_size', 'Movie.2020.1080p.mkv']).stdout).not.toContain('screen_size');
  });

  it('loads a JSON or flat-YAML config via -c', () => {
    const dir = join(tmpdir(), 'guessit-cli-test');
    mkdirSync(dir, { recursive: true });
    const cfg = join(dir, 'cfg.yml');
    writeFileSync(cfg, 'excludes:\n  - screen_size\n');
    expect(run(['-c', cfg, '-j', 'Movie.2020.1080p.mkv']).stdout).not.toContain('screen_size');
  });

  it('-p lists properties, -V includes values', () => {
    expect(run(['-p']).stdout.split('\n')).toContain('title');
    expect(run(['-V']).stdout).toMatch(/screen_size: .*1080p/);
  });

  it('--version prints the banner; --benchmark reports throughput', () => {
    expect(run(['--version']).stdout).toContain('GuessIt-JS');
    expect(run(['--benchmark', '5', 'Movie.2020.mkv']).stdout).toContain('parses/s');
  });

  it('--completion emits scripts for bash and zsh, rejects others', () => {
    expect(run(['--completion', 'bash']).stdout).toContain('complete -F _guessit_js');
    expect(run(['--completion', 'zsh']).stdout).toContain('#compdef');
    expect(run(['--completion', 'fish']).code).toBe(2);
  });

  it('uses standard exit codes', () => {
    expect(run(['--nope']).code).toBe(2);
    expect(run([]).code).toBe(2);
    expect(run(['Movie.2020.mkv']).code).toBe(0);
  });
});
