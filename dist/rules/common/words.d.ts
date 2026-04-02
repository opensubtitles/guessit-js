export interface Word {
    span: [number, number];
    value: string;
}
/** Yield individual words from a string, separated by `seps` characters. */
export declare function iterWords(string: string): Generator<Word>;
