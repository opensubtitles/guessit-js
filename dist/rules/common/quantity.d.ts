export declare abstract class Quantity {
    magnitude: number;
    units: string;
    constructor(magnitude: number, units: string);
    static parseUnits(_value: string): string;
    static fromstring(this: any, string: string): any;
    toString(): string;
    equals(other: unknown): boolean;
}
export declare class Size extends Quantity {
    static parseUnits(value: string): string;
    static fromstring(string: string): Size;
}
export declare class BitRate extends Quantity {
    static parseUnits(value: string): string;
    static fromstring(string: string): BitRate;
}
export declare class FrameRate extends Quantity {
    static parseUnits(_value: string): string;
    static fromstring(string: string): FrameRate;
}
