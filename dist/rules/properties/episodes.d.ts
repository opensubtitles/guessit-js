import { Rebulk } from 'rebulk-js';

interface EpisodesConfig {
    season_max_range: number;
    episode_max_range: number;
    max_range_gap: number;
    season_markers: string[];
    season_ep_markers: string[];
    disc_markers: string[];
    episode_markers: string[];
    range_separators: string[];
    discrete_separators: string[];
    season_words: string[];
    episode_words: string[];
    of_words: string[];
    all_words: string[];
}
/**
 * Build the episodes rebulk
 */
export declare function episodes(config: EpisodesConfig): Rebulk;
export {};
