#!/usr/bin/env node
/**
 * Debug unicode title extraction
 */

import { guessit } from './src/index.js';

const filename = '[阿维达].Avida.2006.FRENCH.DVDRiP.XViD-PROD.avi';

console.log('🔍 Testing unicode filename...\n');
console.log(`Filename: ${filename}`);

const result = guessit(filename);
console.log('Result:', JSON.stringify(result, null, 2));
console.log(`Title: ${result.title}`);
console.log(`Title type: ${typeof result.title}`);