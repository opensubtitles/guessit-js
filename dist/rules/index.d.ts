import { Rebulk } from 'rebulk-js';

export interface AdvancedConfig {
    common_words?: string[];
    groups?: {
        starting: string;
        ending: string;
    };
    audio_codec?: Record<string, unknown>;
    screen_size?: {
        frame_rates: string[];
        interlaced: string[];
        progressive: string[];
        min_ar: number;
        max_ar: number;
    };
    source?: Record<string, unknown>;
    episodes?: Record<string, unknown>;
    language?: Record<string, unknown>;
    country?: Record<string, unknown>;
    [key: string]: unknown;
}
export declare function rebulkBuilder(config: AdvancedConfig): Rebulk;
