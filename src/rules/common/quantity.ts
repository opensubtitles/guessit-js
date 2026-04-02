/**
 * Quantity helpers — port of guessit/rules/common/quantity.py
 */
import { seps } from './index.js';

const PARSER_RE = /^(?<magnitude>\d+(?:[.]\d+)?)(?<units>[^\d]+)?/;

export abstract class Quantity {
  magnitude: number;
  units: string;

  constructor(magnitude: number, units: string) {
    this.magnitude = magnitude;
    this.units = units;
  }

  static parseUnits(_value: string): string {
    throw new Error('parseUnits must be implemented by subclass');
  }

  static fromstring(this: any, string: string): any {
    const m = PARSER_RE.exec(string);
    if (!m?.groups) throw new Error(`Cannot parse quantity: ${string}`);
    const magStr = m.groups['magnitude'];
    const magnitude = magStr.includes('.') ? parseFloat(magStr) : parseInt(magStr, 10);
    const unitsStr = m.groups['units'] ?? '';
    const units: string = (this as unknown as typeof Quantity).parseUnits(unitsStr);
    return new this(magnitude, units);
  }

  toString(): string {
    return `${this.magnitude}${this.units}`;
  }

  equals(other: unknown): boolean {
    if (typeof other === 'string') return this.toString() === other;
    if (!(other instanceof Quantity)) return false;
    return this.magnitude === other.magnitude && this.units === other.units;
  }
}

export class Size extends Quantity {
  static parseUnits(value: string): string {
    let s = value;
    for (const sep of seps) s = s.split(sep).join('');
    return s.toUpperCase();
  }

  static fromstring(string: string): Size {
    return Quantity.fromstring.call(Size, string) as Size;
  }
}

export class BitRate extends Quantity {
  static parseUnits(value: string): string {
    let s = value;
    for (const sep of seps) s = s.split(sep).join('');
    s = s.charAt(0).toUpperCase() + s.slice(1);
    for (const token of ['bits', 'bit']) {
      s = s.replace(token, 'bps');
    }
    return s;
  }

  static fromstring(string: string): BitRate {
    return Quantity.fromstring.call(BitRate, string) as BitRate;
  }
}

export class FrameRate extends Quantity {
  static parseUnits(_value: string): string {
    return 'fps';
  }

  static fromstring(string: string): FrameRate {
    return Quantity.fromstring.call(FrameRate, string) as FrameRate;
  }
}
