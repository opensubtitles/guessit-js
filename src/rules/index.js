/**
 * Main rules builder - JavaScript port of rebulk pattern matching
 */

import { Rebulk } from './rebulk.js';

// Import rule modules
import { pathRules } from './markers/path.js';
import { groupRules } from './markers/groups.js';
import { episodeRules } from './properties/episodes.js';
import { containerRules } from './properties/container.js';
import { sourceRules } from './properties/source.js';
import { videoCodecRules } from './properties/video_codec.js';
import { audioCodecRules } from './properties/audio_codec.js';
import { screenSizeRules } from './properties/screen_size.js';
import { titleRules } from './properties/title.js';
import { processorsRules } from './processors.js';
import { 
    websiteRules, dateRules, episodeTitleRules, languageRules, countryRules,
    releaseGroupRules, streamingServiceRules, otherRules, sizeRules, bitRateRules,
    editionRules, cdRules, bonusRules, filmRules, partRules, crcRules,
    mimetypeRules, typeRules 
} from './properties/stubs.js';

/**
 * Main rebulk builder function
 * @param {Object} config - Configuration object
 * @returns {Rebulk} Configured Rebulk instance
 */
export function RebulkBuilder(config) {
    function getConfig(name) {
        return config[name] || {};
    }

    const rebulk = new Rebulk();
    const commonWords = new Set(getConfig('common_words') || []);

    // Add all rule modules to rebulk
    rebulk.addRules(pathRules(getConfig('path')));
    rebulk.addRules(groupRules(getConfig('groups')));
    
    rebulk.addRules(episodeRules(getConfig('episodes')));
    rebulk.addRules(containerRules(getConfig('container')));
    rebulk.addRules(sourceRules(getConfig('source')));
    rebulk.addRules(videoCodecRules(getConfig('video_codec')));
    rebulk.addRules(audioCodecRules(getConfig('audio_codec')));
    rebulk.addRules(screenSizeRules(getConfig('screen_size')));
    rebulk.addRules(websiteRules(getConfig('website')));
    rebulk.addRules(dateRules(getConfig('date')));
    rebulk.addRules(titleRules(getConfig('title')));
    rebulk.addRules(episodeTitleRules(getConfig('episode_title')));
    rebulk.addRules(languageRules(getConfig('language'), commonWords));
    rebulk.addRules(countryRules(getConfig('country'), commonWords));
    rebulk.addRules(releaseGroupRules(getConfig('release_group')));
    rebulk.addRules(streamingServiceRules(getConfig('streaming_service')));
    rebulk.addRules(otherRules(getConfig('other')));
    rebulk.addRules(sizeRules(getConfig('size')));
    rebulk.addRules(bitRateRules(getConfig('bit_rate')));
    rebulk.addRules(editionRules(getConfig('edition')));
    rebulk.addRules(cdRules(getConfig('cd')));
    rebulk.addRules(bonusRules(getConfig('bonus')));
    rebulk.addRules(filmRules(getConfig('film')));
    rebulk.addRules(partRules(getConfig('part')));
    rebulk.addRules(crcRules(getConfig('crc')));
    
    rebulk.addRules(processorsRules(getConfig('processors')));
    
    rebulk.addRules(mimetypeRules(getConfig('mimetype')));
    rebulk.addRules(typeRules(getConfig('type')));

    // Custom properties transformation
    rebulk.customizeProperties = function(properties) {
        if (properties.count) {
            const count = properties.count;
            delete properties.count;
            properties.season_count = count;
            properties.episode_count = count;
        }
        return properties;
    };

    return rebulk;
}