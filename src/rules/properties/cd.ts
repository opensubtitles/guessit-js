import { Rebulk } from 'rebulk-js';
import { dash } from '../common/index.js';
import { isDisabled } from '../common/pattern.js';
import { loadConfigPatterns } from '../../config/index.js';

export function cd(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'cd') });
  rebulk.regexDefaults({ flags: 'i', abbreviations: [dash] });

  loadConfigPatterns(rebulk, config);

  return rebulk;
}
