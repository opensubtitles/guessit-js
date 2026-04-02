import { test } from 'vitest';
import { episodes } from '../src/rules/properties/episodes.js';
import { loadConfig, parseOptions, mergeOptions } from '../src/options.js';

test('debug episodes chain patterns', () => {
  const parsedOptions = parseOptions({}, true);
  const config = loadConfig(parsedOptions);
  const advancedConfig = mergeOptions(
    (config['advanced_config'] as Record<string, unknown>) ?? {},
    (parsedOptions['advancedConfig'] as Record<string, unknown>) ?? {},
  );
  
  const epsConfig = (advancedConfig as any)['episodes'] ?? {};
  const epsRebulk = episodes(epsConfig);
  
  // Look at effective patterns
  const patterns = (epsRebulk as any).effectivePatterns();
  console.log(`\nTotal patterns: ${patterns.length}`);
  
  for (const pat of patterns) {
    const name = pat.constructor.name;
    const patName = pat.name;
    const disabled = pat.disabled ? pat.disabled({}) : false;
    
    if (name === 'Chain') {
      console.log(`\n[Chain] parts=${pat.parts.length} children=${pat.children} privateParent=${pat.privateParent} validateAll=${pat.validateAll} disabled=${disabled}`);
      for (const part of pat.parts) {
        console.log(`  part: repeaterStart=${part.repeaterStart} repeaterEnd=${part.repeaterEnd} pattern=${part.pattern.constructor.name}`);
        // Try matching
        const innerPat = part.pattern;
        if (innerPat._patterns) {
          console.log(`    regex: ${innerPat._patterns[0]?.source ?? innerPat._patterns[0]}`);
        }
      }
      
      // Try matching
      const input = 'Game.of.Thrones.S05E07.HDTV.720p-KILLERS.mkv';
      const chainMatches = pat.matches(input, {});
      console.log(`  Direct chain.matches() result: ${JSON.stringify(chainMatches.map((m: any) => ({ name: m.name, value: m.value, start: m.start, end: m.end })))}`);
    }
  }
});
