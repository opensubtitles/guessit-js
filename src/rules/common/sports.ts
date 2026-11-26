/**
 * Sports series that number their seasons by year (TheTVDB lists Formula 1 2026 as
 * season 2026) and their rounds as episodes.
 */
export const YEARLY_SEASON_SPORTS = new RegExp(
  '(?:^|[^a-z0-9])(?:formula[\\s._-]?(?:1|one|2|3|e)|f[123]|motogp|moto[23]|wsbk|world[\\s._-]?superbike|wrc|' +
  'indycar|nascar|wec|dtm|btcc|supercars|ufc|wwe|nfl|nba|nhl|mlb|grand[\\s._-]?prix|round[\\s._-]?\\d+|' +
  'qualifying|practice|sprint|race)(?![a-z])', 'i');
