import { Rebulk } from 'rebulk-js';
import { Rule, AppendMatch } from 'rebulk-js';
import { Match, Matches } from 'rebulk-js';
import { cleanup } from '../common/formatters.js';
import { isDisabled } from '../common/pattern.js';
import { loadConfigPatterns } from '../../config/index.js';

export function bonus(config: Record<string, unknown>) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, 'bonus') });
  rebulk.regexDefaults({ name: 'bonus', flags: 'i' });

  loadConfigPatterns(rebulk, config['bonus'] as Record<string, unknown>);

  rebulk.rules(BonusToEpisodeRule, BonusTitleRule);

  return rebulk;
}

/**
 * When a bonus match follows a season-only match (no episode in the same filepart),
 * convert the bonus to an episode. E.g. "Parks_and_Recreation-s03-x01" -> episode=1 not bonus=1.
 */
class BonusToEpisodeRule extends Rule {
  static override priority = 64;

  override when(matches: Matches): Match[] {
    const bonuses = (matches.named('bonus') as Match[])?.filter((m: Match) => !m.private) ?? [];
    const toConvert: Match[] = [];
    for (const bonus of bonuses) {
      const filepart = matches.markers.atMatch(bonus, (m: Match) => m.name === 'path', 0) as Match | undefined;
      if (!filepart) continue;
      const hasSeason = !!(matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'season' && !m.private, 0) as Match | undefined);
      const hasEpisode = !!(matches.range(filepart.start, filepart.end,
        (m: Match) => m.name === 'episode' && !m.private, 0) as Match | undefined);
      if (hasSeason && !hasEpisode) {
        toConvert.push(bonus);
      }
    }
    return toConvert;
  }

  override then(matches: Matches, whenResponse: unknown): void {
    const toConvert = whenResponse as Match[];
    for (const bonus of toConvert) {
      matches.remove(bonus);
      bonus.name = 'episode';
      matches.append(bonus);
    }
  }
}

/**
 * Names that indicate "real" property boundaries that should stop the bonus title.
 * Year is NOT included because it can be part of the bonus title.
 */
const BOUNDARY_NAMES = new Set([
  'source', 'video_codec', 'audio_codec', 'screen_size',
  'container', 'release_group', 'language', 'country', 'other',
  'streaming_service', 'edition', 'audio_channels',
  'season', 'date',
]);

class BonusTitleRule extends Rule {
  static dependency = ['TitleFromPosition'];
  static properties = { bonus_title: [null] };

  when(matches: any) {
    const bonusNumber = matches.named(
      'bonus',
      (m: Match) => !m.private,
      0
    );
    if (!bonusNumber) return;

    const filepath = matches.markers.atMatch(
      bonusNumber,
      (m: Match) => m.name === 'path',
      0
    );
    if (!filepath) return;

    // First, check if there's a title/alternative_title/episode_title match after the bonus number
    const titleAfterBonus = matches.range(
      bonusNumber.end,
      filepath.end + 1,
      (m: Match) => (m.name === 'title' || m.name === 'alternative_title' || m.name === 'episode_title') && !m.private,
      0,
    );
    if (titleAfterBonus && titleAfterBonus.value) {
      const inputString = matches.inputString || '';
      const containerMatch = matches.range(
        bonusNumber.end,
        filepath.end + 1,
        (m: Match) => m.name === 'container' && !m.private,
        0,
      ) as Match | undefined;
      const maxEnd = containerMatch ? containerMatch.start : filepath.end;

      // Extend the bonus title span backward to include any text between bonus and the title
      let btStart = bonusNumber.end;
      while (btStart < titleAfterBonus.start && /[\s._\-]/.test(inputString[btStart])) btStart++;

      // Extend forward: include year matches right after the title ONLY if there's
      // no other text between the year and the container/end
      let btEnd = titleAfterBonus.end;
      // Check for year match immediately after the title (with just seps between)
      const yearAfterTitle = matches.range(
        titleAfterBonus.end,
        maxEnd,
        (m: Match) => !m.private && m.name === 'year',
        0,
      ) as Match | undefined;
      if (yearAfterTitle) {
        // Check if there's only seps between title end and year, and only seps between year and end
        const gapBefore = inputString.slice(titleAfterBonus.end, yearAfterTitle.start);
        const gapAfter = inputString.slice(yearAfterTitle.end, maxEnd);
        const onlySesBefore = [...gapBefore].every(c => /[\s._\-]/.test(c));
        const onlySepsAfter = [...gapAfter].every(c => /[\s._\-]/.test(c));
        if (onlySesBefore && onlySepsAfter) {
          // Year is the last thing before container - include it in bonus title
          btEnd = yearAfterTitle.end;
        }
      }

      const rawText = inputString.slice(btStart, btEnd);
      const bonusTitleValue = cleanup(rawText);

      // Remove the title match and any matches in the extended range
      const toRemove: Match[] = [titleAfterBonus];
      const allMatchesInRange = (matches.range(
        btStart,
        btEnd,
        (m: Match) => !m.private && m.name !== 'bonus' && m.name !== 'container',
      ) as Match[]) || [];
      for (const m of allMatchesInRange) {
        if (!toRemove.includes(m)) toRemove.push(m);
      }

      const bonusTitle = new Match(btStart, btEnd, {
        name: 'bonus_title',
        value: bonusTitleValue || cleanup(String(titleAfterBonus.value)),
        inputString,
      });
      return { toRemove, toAppend: [bonusTitle] };
    }

    // Fallback: construct bonus title from raw text between bonus and first boundary match
    const inputString = matches.inputString || '';

    // Find the container position
    const containerMatch = matches.range(
      bonusNumber.end,
      filepath.end + 1,
      (m: Match) => m.name === 'container' && !m.private,
      0,
    ) as Match | undefined;
    const maxEnd = containerMatch ? containerMatch.start : filepath.end;

    // Find boundary matches after bonus (these stop the bonus title)
    const boundaryMatches = (matches.range(
      bonusNumber.end,
      maxEnd,
      (m: Match) => !m.private && BOUNDARY_NAMES.has(m.name ?? ''),
    ) as Match[]) || [];
    boundaryMatches.sort((a: Match, b: Match) => a.start - b.start);

    // End at first boundary match or container/filepart end
    let endPos = maxEnd;
    if (boundaryMatches.length > 0) {
      endPos = boundaryMatches[0].start;
    }

    // Get raw text
    let start = bonusNumber.end;
    while (start < endPos && /[\s._\-]/.test(inputString[start])) start++;
    let end = endPos;
    while (end > start && /[\s._\-]/.test(inputString[end - 1])) end--;

    if (start >= end) return;

    const rawText = inputString.slice(start, end);
    const bonusTitleValue = cleanup(rawText);
    if (!bonusTitleValue) return;

    // Remove any matches that fall entirely within the bonus title range
    const toRemove: Match[] = [];
    const matchesInRange = (matches.range(
      start,
      end,
      (m: Match) => !m.private && m.name !== 'bonus' && m.name !== 'container',
    ) as Match[]) || [];
    for (const m of matchesInRange) {
      toRemove.push(m);
    }

    const bonusTitle = new Match(start, end, {
      name: 'bonus_title',
      value: bonusTitleValue,
      inputString,
    });

    return { toRemove, toAppend: [bonusTitle] };
  }

  then(matches: any, whenResponse: any): void {
    if (!whenResponse) return;
    if (whenResponse instanceof Match) {
      matches.append(whenResponse);
      return;
    }
    const { toRemove, toAppend } = whenResponse;
    for (const m of toRemove) {
      matches.remove(m);
    }
    for (const m of toAppend) {
      matches.append(m);
    }
  }
}
