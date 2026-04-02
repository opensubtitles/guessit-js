import { test } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { guessit } from '../src/index.js';

test('failure summary', () => {
  const fixtureDir = 'test/fixtures';
  const files = fs.readdirSync(fixtureDir).filter(f => f.endsWith('.yaml'));
  
  const failCounts: Record<string, number> = {};
  let totalFail = 0;
  let totalPass = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(fixtureDir, file), 'utf-8');
    const fixture = yaml.load(content) as any;
    
    for (const [input, expected] of Object.entries(fixture)) {
      try {
        const result = guessit(input);
        const exp = expected as Record<string, unknown>;
        let failed = false;
        
        for (const [key, expVal] of Object.entries(exp)) {
          const actual = result[key];
          if (JSON.stringify(actual) !== JSON.stringify(expVal)) {
            // Track what type of failure
            const failKey = `${key}: expected ${JSON.stringify(expVal)}, got ${JSON.stringify(actual)}`;
            // Group by key+expected
            const groupKey = key;
            failCounts[groupKey] = (failCounts[groupKey] || 0) + 1;
            failed = true;
            break; // Count only first failure per test case
          }
        }
        
        if (failed) totalFail++;
        else totalPass++;
      } catch(e) {
        failCounts['internal_error'] = (failCounts['internal_error'] || 0) + 1;
        totalFail++;
      }
    }
  }
  
  console.log(`\nPassed: ${totalPass}, Failed: ${totalFail}`);
  console.log('\nFailures by key:');
  const sorted = Object.entries(failCounts).sort(([,a],[,b]) => b-a);
  for (const [key, count] of sorted) {
    console.log(`  ${key}: ${count}`);
  }
});
