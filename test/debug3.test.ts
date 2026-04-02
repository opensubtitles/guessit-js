import { test } from 'vitest';
import { guessit } from '../src/index.js';
import { rebulkBuilder } from '../src/rules/index.js';
import { loadConfig, parseOptions, mergeOptions } from '../src/options.js';

test('debug full pipeline', () => {
  const input = 'Game.of.Thrones.S05E07.HDTV.720p-KILLERS.mkv';
  
  const parsedOptions = parseOptions({}, true);
  const config = loadConfig(parsedOptions);
  const mergedOptions = mergeOptions(config, parsedOptions);
  
  const advancedConfig = mergeOptions(
    (config['advanced_config'] as Record<string, unknown>) ?? {},
    (parsedOptions['advancedConfig'] as Record<string, unknown>) ?? {},
  );
  
  const rebulk = rebulkBuilder(advancedConfig as any);
  
  // Get matches before rules
  const matches = rebulk.matches(input, mergedOptions);
  const allMatches = matches.toArray();
  
  console.log('\n=== All public matches ===');
  for (const m of allMatches) {
    console.log(`  ${m.name}: ${JSON.stringify(m.value)} [${m.start}-${m.end}]`);
  }
  
  console.log('\n=== Result ===');
  const result = guessit(input);
  console.log(JSON.stringify(result, null, 2));
});
