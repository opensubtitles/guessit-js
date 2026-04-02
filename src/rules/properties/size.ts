import { Rebulk } from 'rebulk-js';
import { dash } from '../common/index.js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import { Size } from '../common/quantity.js';

export function size(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'size') });
  rebulk.regexDefaults({ flags: 'i', abbreviations: [dash] });
  rebulk.defaults({ name: 'size', validator: sepsSurround });
  rebulk.regex('\\d+-?[mgt]b', '\\d+\\.\\d+-?[mgt]b', {
    formatter: (s: string) => Size.fromstring(s).toString(),
    tags: ['release-group-prefix'],
  });

  return rebulk;
}
