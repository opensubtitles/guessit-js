import { test } from 'vitest';
import { episodes } from '../src/rules/properties/episodes.js';
import { loadConfig, parseOptions, mergeOptions } from '../src/options.js';

test('debug SxxExx inner regex string', () => {
  const parsedOptions = parseOptions({}, true);
  const config = loadConfig(parsedOptions);
  const advancedConfig = mergeOptions(
    (config['advanced_config'] as Record<string, unknown>) ?? {},
    (parsedOptions['advancedConfig'] as Record<string, unknown>) ?? {},
  );
  
  const epsConfig = (advancedConfig as any)['episodes'] ?? {};
  const epsRebulk = episodes(epsConfig);
  
  const patterns = (epsRebulk as any).effectivePatterns();
  const sxxChain = patterns.find((p: any) => p.constructor.name === 'Chain' && p.validateAll);
  
  const input = 'Game.of.Thrones.S05E07.HDTV.720p-KILLERS.mkv';
  
  for (let i = 0; i < sxxChain.parts.length; i++) {
    const part = sxxChain.parts[i];
    const innerPat = part.pattern;
    
    // Get the compiled regexes
    const regexes = innerPat._regexes;
    if (regexes) {
      console.log(`\nPart[${i}] regexes (${regexes.length}):`);
      for (const rx of regexes) {
        console.log(`  regex: /${rx.source}/${rx.flags}`);
        // Try to match manually
        const match = rx.exec(input);
        console.log(`  match: ${match ? JSON.stringify(match[0]) : 'null'}`);
      }
    } else {
      console.log(`\nPart[${i}]: no _regexes`);
    }
  }
});
