import { test } from 'vitest';
import { loadConfig, parseOptions, mergeOptions } from '../src/options.js';

test('check source config', () => {
  const parsedOptions = parseOptions({}, true);
  const config = loadConfig(parsedOptions);
  const advancedConfig = mergeOptions(
    (config['advanced_config'] as Record<string, unknown>) ?? {},
    (parsedOptions['advancedConfig'] as Record<string, unknown>) ?? {},
  );
  
  const sourceConfig = (advancedConfig as any)['source'] ?? {};
  console.log('\nSource config keys (first few):');
  const entries = Object.entries(sourceConfig).slice(0, 5);
  for (const [k, v] of entries) {
    console.log(`  "${k}": ${JSON.stringify(v).substring(0, 100)}`);
  }
  
  // Look for BluRay
  for (const [k, v] of Object.entries(sourceConfig)) {
    const str = JSON.stringify(v);
    if (str.toLowerCase().includes('blu')) {
      console.log(`\n"${k}": ${str.substring(0, 150)}`);
    }
  }
});
