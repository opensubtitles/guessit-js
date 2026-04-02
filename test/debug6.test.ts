import { test } from 'vitest';
import { episodes } from '../src/rules/properties/episodes.js';
import { loadConfig, parseOptions, mergeOptions } from '../src/options.js';

test('debug SxxExx chain parts', () => {
  const parsedOptions = parseOptions({}, true);
  const config = loadConfig(parsedOptions);
  const advancedConfig = mergeOptions(
    (config['advanced_config'] as Record<string, unknown>) ?? {},
    (parsedOptions['advancedConfig'] as Record<string, unknown>) ?? {},
  );
  
  const epsConfig = (advancedConfig as any)['episodes'] ?? {};
  const epsRebulk = episodes(epsConfig);
  
  const patterns = (epsRebulk as any).effectivePatterns();
  
  // Find the SxxExx chain (validateAll=true)
  const sxxChain = patterns.find((p: any) => p.constructor.name === 'Chain' && p.validateAll);
  if (!sxxChain) {
    console.log('No SxxExx chain found!');
    return;
  }
  
  console.log(`\nSxxExx chain: parts=${sxxChain.parts.length} children=${sxxChain.children} privateParent=${sxxChain.privateParent}`);
  
  for (let i = 0; i < sxxChain.parts.length; i++) {
    const part = sxxChain.parts[i];
    const innerPat = part.pattern;
    let regexStr = '?';
    if (innerPat._patterns) {
      regexStr = innerPat._patterns.map((r: any) => r.source ?? r).join(', ');
    }
    console.log(`  Part[${i}]: repeater={${part.repeaterStart},${part.repeaterEnd}} hidden=${part.isHidden} regex="${regexStr.substring(0, 80)}"`);
  }
  
  // Try matching directly with the SxxExx chain
  const input = 'Game.of.Thrones.S05E07.HDTV.720p-KILLERS.mkv';
  
  // Try just part 1
  const part0 = sxxChain.parts[0];
  const innerPat0 = part0.pattern;
  const innerMatches0 = innerPat0.matches(input, {}, true);
  console.log(`\nPart[0] inner direct matches: ${JSON.stringify((innerMatches0[0] ?? []).map((m: any) => ({ name: m.name, value: m.value, start: m.start, end: m.end })))}`);
  
  // Try the chain directly
  const chainResult = sxxChain.matches(input, {});
  console.log(`Chain direct matches: ${JSON.stringify(chainResult.map((m: any) => ({ name: m.name, value: m.value, start: m.start, end: m.end })))}`);
});
