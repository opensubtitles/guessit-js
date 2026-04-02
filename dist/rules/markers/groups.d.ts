import { Rebulk } from 'rebulk-js';

export declare class ConfigurationException extends Error {
    constructor(message: string);
}
export declare function groups(config: {
    starting: string;
    ending: string;
}): Rebulk;
