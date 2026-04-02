import { Rebulk } from 'rebulk-js';
import { dash } from '../common/index.js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import { loadConfigPatterns } from '../../config/index.js';

export function edition(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'edition') });
  rebulk.regexDefaults({ flags: 'i', abbreviations: [dash] }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({ name: 'edition', validator: sepsSurround });

  loadConfigPatterns(rebulk, config['edition'] as Record<string, unknown>);

  return rebulk;
}
