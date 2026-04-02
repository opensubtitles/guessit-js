/**
 * Pattern helpers — port of guessit/rules/common/pattern.py
 */
import type { Context } from 'rebulk-js';

/**
 * Check if a property is disabled in the current context.
 * Used by property builders: disabled=lambda context: is_disabled(context, 'video_codec')
 */
export function isDisabled(context: Context | undefined, name: string): boolean {
  if (!context) return false;
  const excludes = context['excludes'] as string[] | undefined;
  const includes = context['includes'] as string[] | undefined;
  if (excludes && excludes.includes(name)) return true;
  if (includes && includes.length > 0 && !includes.includes(name)) return true;
  return false;
}
