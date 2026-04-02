import { test } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { guessit } from '../src/index.js';
import { Language } from '../src/language/index.js';

function tryResolveLanguage(s: string): string | undefined {
  try { return (Language as any).fromString?.(s)?.alpha3 || undefined; } catch { return undefined; }
}

function normaliseExpected(v: unknown): unknown {
  if (typeof v === 'string') {
    const alpha3 = tryResolveLanguage(v);
    if (alpha3 !== undefined) return alpha3;
  }
  return v;
}

test('comprehensive failure summary', () => {
  const fixtureDir = 'test/fixtures';
  const files = fs.readdirSync(fixtureDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  
  const failByKey: Record<string, number> = {};
  const errorMessages: string[] = [];
  let totalFail = 0;
  let totalPass = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(fixtureDir, file), 'utf-8');
    let fixture: any;
    try {
      fixture = yaml.load(content);
    } catch (e) {
      // Skip files with YAML parse errors (e.g. duplicate keys in enable_disable_properties.yml)
      continue;
    }
    if (!fixture) continue;
    
    for (const [inputStr, expected] of Object.entries(fixture)) {
      // Handle options (skip for now)
      if (typeof expected !== 'object' || !expected) continue;
      const exp = expected as Record<string, unknown>;
      if ('options' in exp) continue;
      
      try {
        const result = guessit(inputStr);
        let hasFail = false;
        
        for (const [key, expVal] of Object.entries(exp)) {
          let normalized = expVal;
          if (Array.isArray(expVal)) {
            normalized = expVal.map(v => normaliseExpected(v));
          } else {
            normalized = normaliseExpected(expVal);
          }
          
          const actual = result[key];
          if (JSON.stringify(actual) !== JSON.stringify(normalized)) {
            failByKey[key] = (failByKey[key] || 0) + 1;
            if (!hasFail) {
              if (errorMessages.length < 10) {
                errorMessages.push(`[${file}] "${inputStr}" - ${key}: expected ${JSON.stringify(normalized)}, got ${JSON.stringify(actual)}`);
              }
              hasFail = true;
            }
          }
        }
        
        if (hasFail) totalFail++;
        else totalPass++;
      } catch(e) {
        failByKey['internal_error'] = (failByKey['internal_error'] || 0) + 1;
        totalFail++;
        if (errorMessages.length < 5) {
          errorMessages.push(`[${file}] "${inputStr}" - ERROR: ${e}`);
        }
      }
    }
  }
  
  console.log(`\nPassed: ${totalPass}, Failed: ${totalFail}`);
  console.log('\nFailures by key (test cases):');
  const sorted = Object.entries(failByKey).sort(([,a],[,b]) => b-a);
  for (const [key, count] of sorted) {
    console.log(`  ${key}: ${count}`);
  }
  console.log('\nSample errors:');
  for (const e of errorMessages) console.log(' ', e);
});
