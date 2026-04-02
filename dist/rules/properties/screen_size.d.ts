import { Rebulk } from 'rebulk-js';

export interface ScreenSizeConfig {
    frame_rates: string[];
    interlaced: string[];
    progressive: string[];
    min_ar: number;
    max_ar: number;
}
export declare function screenSize(config: ScreenSizeConfig): Rebulk;
