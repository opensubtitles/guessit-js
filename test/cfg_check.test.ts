import { test } from 'vitest';
import { loadConfig, parseOptions, mergeOptions } from '../src/options.js';

test('check full advanced config structure', () => {
  const parsedOptions = parseOptions({}, true);
  const config = loadConfig(parsedOptions);
  const advancedConfig = mergeOptions(
    (config['advanced_config'] as Record<string, unknown>) ?? {},
    (parsedOptions['advancedConfig'] as Record<string, unknown>) ?? {},
  );
  
  console.log('\nAdvanced config keys:', Object.keys(advancedConfig));
  
  // Check source
  const sourceConfig = (advancedConfig as any)['source'] ?? {};
  console.log('\nSource config keys:', Object.keys(sourceConfig));
  
  // Check audio_codec  
  const audioConfig = (advancedConfig as any)['audio_codec'] ?? {};
  console.log('\nAudio codec config keys (first 5):', Object.keys(audioConfig).slice(0, 5));
  
  // Show a sample audio entry
  const firstAudioKey = Object.keys(audioConfig)[0];
  console.log('Sample audio entry:', JSON.stringify(audioConfig[firstAudioKey]).substring(0, 200));
});
