import { test } from 'vitest';
import { rebulkBuilder } from '../src/rules/index.js';
import { episodes } from '../src/rules/properties/episodes.js';
import { loadConfig, parseOptions, mergeOptions } from '../src/options.js';

test('debug episodes rebulk directly', () => {
  const input = 'Game.of.Thrones.S05E07.HDTV.720p-KILLERS.mkv';
  
  const parsedOptions = parseOptions({}, true);
  const config = loadConfig(parsedOptions);
  const advancedConfig = mergeOptions(
    (config['advanced_config'] as Record<string, unknown>) ?? {},
    (parsedOptions['advancedConfig'] as Record<string, unknown>) ?? {},
  );
  
  // Get episodes config
  const epsConfig = (advancedConfig as any)['episodes'] ?? {};
  console.log('Episodes config:', JSON.stringify(epsConfig));
  
  // Build just the episodes rebulk
  const epsRebulk = episodes(epsConfig);
  
  // Run it directly
  const matches = epsRebulk.matches(input);
  console.log('\n=== Episodes matches ===');
  for (const m of matches.toArray()) {
    console.log(`  ${m.name}: ${JSON.stringify(m.value)} [${m.start}-${m.end}]`);
  }
});
