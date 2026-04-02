/**
 * Date utilities — port of guessit/rules/common/date.py
 */
export declare function validYear(year: number): boolean;
export declare function validWeek(week: number): boolean;
export declare function searchDate(string: string, yearFirst?: boolean, dayFirst?: boolean): [number, number, Date] | undefined;
