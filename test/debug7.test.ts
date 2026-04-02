import { test } from 'vitest';
import { episodes } from '../src/rules/properties/episodes.js';
import { loadConfig, parseOptions, mergeOptions } from '../src/options.js';

test('debug SxxExx inner regex matching', () => {
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
  
  console.log('SxxExx chain parts:', sxxChain.parts.length);
  
  const input = 'Game.of.Thrones.S05E07.HDTV.720p-KILLERS.mkv';
  
  for (let i = 0; i < sxxChain.parts.length; i++) {
    const part = sxxChain.parts[i];
    const innerPat = part.pattern;
    
    // Get all keys to find the patterns array
    console.log(`\nPart[${i}] pattern keys:`, Object.keys(innerPat));
    
    // Try to call matches directly
    try {
      const result = innerPat.matches(input, {}, true);
      const [allMatches, rawMatches] = result;
      console.log(`  allMatches: ${allMatches.length}, rawMatches: ${rawMatches.length}`);
      for (const m of allMatches) {
        console.log(`    all: ${m.name} = ${JSON.stringify(m.value)} [${m.start}-${m.end}]`);
      }
    } catch(e) {
      console.log(`  Error: ${e}`);
    }
    
    // Try _match directly
    try {
      const gen = innerPat._match(innerPat.patterns[0], input, {});
      const results = [];
      for (const m of gen) results.push(m);
      console.log(`  _match results: ${results.length}`);
      for (const m of results) {
        console.log(`    raw: ${m.name} [${m.start}-${m.end}] raw="${input.slice(m.rawStart, m.rawEnd)}"`);
      }
    } catch(e) {
      console.log(`  _match error: ${e}`);
    }
  }
});
