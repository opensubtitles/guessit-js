/**
 * Regex utilities — port of guessit/reutils.py
 */

/**
 * Build an alternation pattern from a list of patterns.
 * Mirrors Python's build_or_pattern(patterns, name=None, escape=False).
 */
export function buildOrPattern(patterns: string[], name?: string, escape = false): string {
  if (!patterns || patterns.length === 0) return '(?:)';
  const parts: string[] = [];
  for (const pattern of patterns) {
    if (parts.length === 0) {
      parts.push('(?');
      if (name) {
        parts.push(`<${name}>`);
      } else {
        parts.push(':');
      }
    } else {
      parts.push('|');
    }
    parts.push(escape ? `(?:${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})` : `(?:${pattern})`);
  }
  parts.push(')');
  return parts.join('');
}
