import { test } from 'vitest';
import { rebulkBuilder } from '../src/rules/index.js';
import { loadConfig, parseOptions, mergeOptions } from '../src/options.js';

test('full pipeline matches', () => {
  const input = 'The.Dark.Knight.2008.BluRay.1080p.x264-GROUP.mkv';
  
  const parsedOptions = parseOptions({}, true);
  const config = loadConfig(parsedOptions);
  const advancedConfig = mergeOptions(
    (config['advanced_config'] as Record<string, unknown>) ?? {},
    (parsedOptions['advancedConfig'] as Record<string, unknown>) ?? {},
  );
  
  const rebulk = rebulkBuilder(advancedConfig as any);
  const matches = rebulk.matches(input, {});
  
  console.log('\n=== All matches ===');
  for (const m of matches.toArray()) {
    console.log(`  ${m.name}: ${JSON.stringify(m.value)} [${m.start}-${m.end}]${m.private ? ' [private]' : ''}`);
  }
});
