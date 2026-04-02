import { test } from 'vitest';
import { Rebulk } from 'rebulk-js';
import { altDash } from '../src/rules/common/index.js';
import { buildOrPattern } from '../src/reutils.js';
import { and_, sepsSurround } from '../src/rules/common/validators.js';

// Replicate episodes.ts EXACTLY
test('debug full chain exact', () => {
  function seasonEpisodeConflictSolver(match: any, other: any): any { return '__default__'; }
  function isSeasonEpisodeDisabled(_: any) { return false; }
  function orderingValidator(match: any): boolean {
    const values = match.children?.to_dict?.() || {};
    if (values.season && Array.isArray(values.season)) {
      const sorted = [...values.season].sort((a: number, b: number) => a - b);
      if (JSON.stringify(sorted) !== JSON.stringify(values.season)) return false;
    }
    return true;
  }

  const config = {
    season_markers: ['s'], episode_markers: ['xe', 'ex', 'ep', 'e', 'x'],
    disc_markers: ['d'], range_separators: ['-'], discrete_separators: ['+'],
  };
  const allSeparators = [...config.range_separators, ...config.discrete_separators];
  
  const seasonMarkerPattern = buildOrPattern(config.season_markers, 'seasonMarker');
  const episodeMarkerPattern = buildOrPattern([...config.episode_markers, ...config.disc_markers], 'episodeMarker');
  const allSeparatorsPattern = buildOrPattern([...config.episode_markers, ...config.disc_markers, ...allSeparators], 'episodeSeparator', true);

  const rebulk = new Rebulk()
    .regexDefaults({ flags: 'i' })
    .stringDefaults({ ignoreCase: true })
    .defaults({
      privateNames: ['episodeSeparator', 'seasonSeparator', 'episodeMarker', 'seasonMarker'],
      formatter: { season: (v: any) => parseInt(v, 10), episode: (v: any) => parseInt(v, 10), version: (v: any) => parseInt(v, 10) },
      children: true,
      privateParent: true,
      conflictSolver: seasonEpisodeConflictSolver,
      abbreviations: [altDash],
    });

  const chain = rebulk.chain({
    tags: ['SxxExx'],
    validateAll: true,
    validator: { __parent__: and_(sepsSurround, orderingValidator) },
    disabled: isSeasonEpisodeDisabled,
  }).defaults({ tags: ['SxxExx'] });
  
  console.log('Chain children:', chain.children, 'privateParent:', chain.privateParent);

  chain.regex(seasonMarkerPattern + `(?<season>\\d+)@?` + episodeMarkerPattern + `@?(?<episode>\\d+)`)
    .repeater('+')
    .regex(allSeparatorsPattern + `@?(?<episode>\\d+)`)
    .repeater('*');

  const input = 'Game.of.Thrones.S05E07.HDTV.720p-KILLERS.mkv';
  const matches = rebulk.matches(input);
  console.log('Public matches:', matches.toArray().length);
  matches.toArray().forEach((m: any) => console.log(' -', m.name, String(m.value)));
});
