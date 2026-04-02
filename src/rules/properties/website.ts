import { Rebulk } from 'rebulk-js';
import { Rule, RemoveMatch } from 'rebulk-js';
import type { Match } from 'rebulk-js';
import { seps } from '../common/index.js';
import { cleanup } from '../common/formatters.js';
import { isDisabled } from '../common/pattern.js';
import { sepsSurround } from '../common/validators.js';
import { buildOrPattern } from '../../reutils.js';

// TLD data - in production this would be loaded from a data file
const DEFAULT_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'co', 'uk', 'ca', 'de', 'fr', 'it', 'es', 'nl', 'be',
  'ch', 'se', 'no', 'dk', 'fi', 'pl', 'ru', 'cn', 'jp',
  'au', 'nz', 'in', 'br', 'mx', 'za', 'kr', 'tw', 'hk',
];

export function website(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'website') });
  rebulk.regexDefaults({ flags: 'i' }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({ name: 'website' });

  const tlds = (config['tlds'] as string[]) || DEFAULT_TLDS;
  const safeTlds = (config['safe_tlds'] as string[]) || ['com', 'org', 'net'];
  const safeSubdomains = (config['safe_subdomains'] as string[]) || ['www'];
  const safePrefix = (config['safe_prefixes'] as string[]) || [];
  const websitePrefixes = (config['prefixes'] as string[]) || [];

  rebulk.regex(
    `(?:[^a-z0-9]|^)((?:${buildOrPattern(safeSubdomains)}\\.)+(?:[a-z-0-9-]+\\.)+(?:${buildOrPattern(tlds)}))(?:[^a-z0-9]|$)`,
    { children: true }
  );
  rebulk.regex(
    `(?:[^a-z0-9]|^)((?:${buildOrPattern(safeSubdomains)}\\.)*[a-z0-9-]+\\.(?:${buildOrPattern(safeTlds)}))(?:[^a-z0-9]|$)`,
    { children: true }
  );
  rebulk.regex(
    `(?:[^a-z0-9]|^)((?:${buildOrPattern(safeSubdomains)}\\.)*[a-z0-9-]+\\.(?:${buildOrPattern(safePrefix)}\\.)+(?:${buildOrPattern(tlds)}))(?:[^a-z0-9]|$)`,
    { children: true }
  );

  rebulk.string(...websitePrefixes, {
    validator: sepsSurround,
    private: true,
    tags: ['website.prefix'],
  });

  // Pass safeTlds and safePrefix from config to the rule via closure
  class PreferTitleOverWebsiteWithConfig extends Rule {
    override consequence = RemoveMatch;
    private safeTlds: string[];
    private safePrefix: string[];

    constructor(safeTldsArg: string[], safePrefixArg: string[]) {
      super();
      this.safeTlds = safeTldsArg;
      this.safePrefix = safePrefixArg;
    }

    validFollowers(match: Match): boolean {
      return ['season', 'episode', 'year'].includes(match.name ?? '');
    }

    override when(matches: any) {
      const toRemove = [];
      for (const websiteMatch of matches.named('website')) {
        let safe = false;
        for (const safeStart of [...this.safeTlds, ...this.safePrefix]) {
          if (String(websiteMatch.value ?? '').toLowerCase().startsWith(safeStart)) {
            safe = true;
            break;
          }
        }
        if (!safe) {
          // Work around rebulk-js next() bug: use range() to find followers
          const filepart = matches.markers.atMatch(websiteMatch, (m: Match) => m.name === 'path', 0);
          const searchEnd = filepart?.end ?? (matches.inputString?.length ?? websiteMatch.end + 50);
          const followers = matches.range(websiteMatch.end, searchEnd,
            (m: Match) => !m.private && this.validFollowers(m)) as Match[];
          const followerArr = Array.isArray(followers) ? followers : followers ? [followers] : [];
          const suffix = followerArr.length > 0 ? followerArr[0] : undefined;
          if (suffix) {
            const group = matches.markers.atMatch(
              websiteMatch,
              (m: Match) => m.name === 'group',
              0
            );
            if (!group) {
              toRemove.push(websiteMatch);
            }
          }
        }
      }
      return toRemove;
    }
  }

  rebulk.rules(new PreferTitleOverWebsiteWithConfig(safeTlds, safePrefix), ValidateWebsitePrefix);

  return rebulk;
}

class ValidateWebsitePrefix extends Rule {
  static priority = 64;
  static consequence = RemoveMatch;

  when(matches: any) {
    const toRemove = [];
    for (const prefix of matches.tagged('website.prefix')) {
      // Work around rebulk-js next() bug: use range() instead
      const websites = matches.range(prefix.end, prefix.end + 100,
        (m: Match) => !m.private && m.name === 'website') as Match[];
      const webArr = Array.isArray(websites) ? websites : websites ? [websites] : [];
      const websiteMatch = webArr.length > 0 ? webArr[0] : undefined;
      if (
        !websiteMatch ||
        matches.holes(prefix.end, websiteMatch.start, cleanup, seps, (m: Match) => m.value)
      ) {
        toRemove.push(prefix);
      }
    }
    return toRemove;
  }
}
