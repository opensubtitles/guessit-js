import { Rebulk } from 'rebulk-js';
import { Rule, AppendMatch } from 'rebulk-js';
import type { Match } from 'rebulk-js';
import { dash } from '../common/index.js';
import { cleanup } from '../common/formatters.js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import { loadConfigPatterns } from '../../config/index.js';

export function film(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'film') });
  rebulk.regexDefaults({ flags: 'i', abbreviations: [dash] }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({ name: 'film', validator: sepsSurround });

  loadConfigPatterns(rebulk, config['film'] as Record<string, unknown>);

  rebulk.rules(FilmTitleRule);

  return rebulk;
}

class FilmTitleRule extends Rule {
  static consequence = AppendMatch;
  static properties = { film_title: [null] };

  enabled(context: Record<string, unknown>) {
    return !isDisabled(context, 'film_title');
  }

  when(matches: any) {
    const bonusNumber = matches.named(
      'film',
      (m: Match) => !m.private,
      0
    );
    if (bonusNumber) {
      const filepath = matches.markers.atMatch(
        bonusNumber,
        (m: Match) => m.name === 'path',
        0
      );
      if (!filepath) return;
      const hole = matches.holes(
        filepath.start,
        bonusNumber.start + 1,
        {
          formatter: cleanup,
          predicate: (h: Match) => !!h.value,
          index: 0,
        }
      );
      if (hole && hole.value) {
        hole.name = 'film_title';
        return hole;
      }
    }
  }
}
