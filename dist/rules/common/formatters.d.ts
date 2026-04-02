/**
 * Remove and strip separators from inputString (but keep ',;' characters).
 * Also keeps separators for single characters (e.g., S.H.I.E.L.D.).
 */
export declare function cleanup(inputString: string): string;
/**
 * Strip separator characters from both ends of the string.
 */
export declare function strip(inputString: string, chars?: string): string;
/**
 * Cleanup a raw value to perform raw comparison.
 */
export declare function rawCleanup(raw: string): string;
/**
 * Reorder the title by moving a trailing article to the front.
 * "The Dark Knight, The" → "The Dark Knight"
 * Also handles moving leading article to end: not the primary direction in Python.
 * Python's reorder_title moves "title, the" patterns to canonical form.
 */
export declare function reorderTitle(title: string, articles?: string[], separators?: string[]): string;
