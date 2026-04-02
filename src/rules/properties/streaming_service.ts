import { Rebulk } from 'rebulk-js';
import { Rule, RemoveMatch } from 'rebulk-js';
import type { Match } from 'rebulk-js';
import { isDisabled } from '../common/pattern.js';
import { loadConfigPatterns } from '../../config/index.js';
import { seps, dash , sepsPattern } from '../common/index.js';
import { sepsBefore, sepsAfter } from '../common/validators.js';

export function streamingService(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'streaming_service') });
  rebulk.stringDefaults({ ignoreCase: true }).regexDefaults({ flags: 'i', abbreviations: [dash] });
  rebulk.defaults({ name: 'streaming_service', tags: ['source-prefix'] });

  loadConfigPatterns(rebulk, config);

  rebulk.rules(ValidateStreamingService);

  return rebulk;
}

class ValidateStreamingService extends Rule {
  static priority = 128;
  static consequence = RemoveMatch;

  when(matches: any) {
    const toRemove = [];
    const allServices = matches.named('streaming_service');
    if (process.env.DEBUG_SS) console.log(`[VS.when] allServices count=${allServices.length}`);
    for (const service of allServices) {
      // Work around rebulk-js next()/previous() bug: they stop at the first position
      // with ANY match and filter by predicate, instead of continuing to find matches
      // that satisfy the predicate. Use range() to find suffix/prefix matches instead.
      const suffixPred = (m: Match) => !m.private && m.tags?.includes('streaming_service.suffix');
      const prefixPred = (m: Match) => !m.private && m.tags?.includes('streaming_service.prefix');

      // Find the nearest suffix match after the service
      const suffixMatches = matches.range(service.end, service.end + 30, suffixPred) as Match[];
      const suffixArray = Array.isArray(suffixMatches) ? suffixMatches : suffixMatches ? [suffixMatches] : [];
      const nextMatch = suffixArray.length > 0 ? suffixArray.reduce((a: Match, b: Match) => a.start < b.start ? a : b) : undefined;

      // Find the nearest prefix match before the service
      const prefixMatches = matches.range(Math.max(0, service.start - 30), service.start, prefixPred) as Match[];
      const prefixArray = Array.isArray(prefixMatches) ? prefixMatches : prefixMatches ? [prefixMatches] : [];
      const previousMatch = prefixArray.length > 0 ? prefixArray.reduce((a: Match, b: Match) => a.end > b.end ? a : b) : undefined;
      const hasOther = service.initiator && (service.initiator.children.named('other') as Match[]).length > 0;

      if (process.env.DEBUG_SS) {
        console.log(`[SS] service=${service.value} [${service.start},${service.end}) nextMatch=${nextMatch?.name}@${nextMatch?.start} prevMatch=${previousMatch?.name} sepsBefore=${sepsBefore(service)} sepsAfter=${sepsAfter(service)}`);
      }

      if (!hasOther) {
        const holesToNext = nextMatch
          ? (matches.holes(service.end, nextMatch.start, { predicate: (m: Match) => Boolean(String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')) }) as Match[])
          : null;
        const holesToPrev = previousMatch
          ? (matches.holes(previousMatch.end, service.start, { predicate: (m: Match) => Boolean(String(m.value).replace(new RegExp(`[${sepsPattern}]`, 'g'), '')) }) as Match[])
          : null;

        // Additional check: ensure suffix/prefix is close to the service (within ~20 chars)
        // and no other named matches (non-streaming-service) exist between them.
        const maxDistance = 20;
        const nextTooFar = nextMatch && (nextMatch.start - service.end) > maxDistance;
        const prevTooFar = previousMatch && (service.start - previousMatch.end) > maxDistance;

        // Check if there are non-streaming-service matches between service and its suffix/prefix
        const matchesBetweenNext = nextMatch
          ? (matches.range(service.end, nextMatch.start, (m: Match) =>
              m.name !== 'streaming_service' && !m.private && m.name !== 'other'
            ) as Match[])
          : null;
        const matchesBetweenPrev = previousMatch
          ? (matches.range(previousMatch.end, service.start, (m: Match) =>
              m.name !== 'streaming_service' && !m.private && m.name !== 'other'
            ) as Match[])
          : null;

        const nextHasIntervening = matchesBetweenNext && matchesBetweenNext.length > 0;
        const prevHasIntervening = matchesBetweenPrev && matchesBetweenPrev.length > 0;

        if (
          !nextMatch || nextTooFar || nextHasIntervening ||
          (holesToNext !== null && holesToNext.length > 0) ||
          !sepsBefore(service)
        ) {
          if (
            !previousMatch || prevTooFar || prevHasIntervening ||
            (holesToPrev !== null && holesToPrev.length > 0) ||
            !sepsAfter(service)
          ) {
            if (process.env.DEBUG_SS) console.log(`  [VS.when] pushing to toRemove: ${service.value}`);
            toRemove.push(service);
            continue;
          }
        }
      }

      if (service.value === 'Comedy Central') {
        toRemove.push(
          ...matches.named('edition', (m: Match) => m.value === 'Criterion')
        );
      }
    }

    if (process.env.DEBUG_SS) console.log(`[VS.when] returning toRemove.length=${toRemove.length}`);
    return toRemove;
  }
}
