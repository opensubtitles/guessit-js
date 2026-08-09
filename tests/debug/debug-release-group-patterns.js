#!/usr/bin/env node
/**
 * Debug release group patterns
 */

const testFilenames = [
    'Fear.and.Loathing.in.Las.Vegas.720p.HDDVD.DTS.x264-ESiR.mkv',
    'Dark.City.(1998).DC.BDRip.720p.DTS.X264-CHD.mkv',
    'Californication.2x05.Vaginatown.HDTV.XviD-0TV.avi',
    'Treme.1x03.Right.Place,.Wrong.Time.HDTV.XviD-NoTV.avi'
];

console.log('🔍 Testing release group regex patterns...\n');

// Test patterns
const patterns = [
    /[-\.\s]([A-Z0-9]+)$/i,  // Current pattern: end with dash/dot/space
    /[\[\(]([A-Z0-9\-_.]+)[\]\)]/i, // Bracketed pattern
    /-([A-Z0-9]+)\.mkv$/i,   // Dash before extension
    /-([A-Z0-9]+)\.avi$/i,   // Dash before extension (avi)
    /-([A-Z0-9]+)$/i,        // Just dash at end
];

for (const filename of testFilenames) {
    console.log(`📁 ${filename}`);
    
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = filename.match(pattern);
        if (match) {
            console.log(`   Pattern ${i + 1}: ${pattern} -> Found: "${match[1]}"`);
        } else {
            console.log(`   Pattern ${i + 1}: ${pattern} -> No match`);
        }
    }
    console.log('');
}