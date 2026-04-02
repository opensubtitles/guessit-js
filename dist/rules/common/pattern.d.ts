import { Context } from 'rebulk-js';

/**
 * Check if a property is disabled in the current context.
 * Used by property builders: disabled=lambda context: is_disabled(context, 'video_codec')
 */
export declare function isDisabled(context: Context | undefined, name: string): boolean;
