import { Rebulk } from 'rebulk-js';
import { dash } from '../common/index.js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround, intCoercable, and_ } from '../common/validators.js';
import { parseNumber } from '../common/numeral.js';
import { buildOrPattern } from '../../reutils.js';

export function part(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'part') });
  rebulk.regexDefaults({
    flags: 'i',
    abbreviations: [dash],
    validator: { __parent__: sepsSurround },
  });

  const prefixes = config['prefixes'] as string[];
  const wordNumerals = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  ];
  const numeral = `(?:\\d+|[ivxlcdm]+|${wordNumerals.join('|')})`;

  function validateRoman(match: any) {
    if (intCoercable(match.raw)) {
      return true;
    }
    return sepsSurround(match);
  }

  rebulk.regex(
    `${buildOrPattern(prefixes)}-?(?P<part>${numeral})`,
    {
      prefixes,
      validateAll: true,
      privateParent: true,
      children: true,
      formatter: parseNumber,
      validator: {
        part: and_(
          validateRoman,
          (m: any) => 0 < (m.value as number) && (m.value as number) < 100
        ),
      },
    }
  );

  return rebulk;
}
