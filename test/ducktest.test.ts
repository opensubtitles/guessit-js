import { it } from 'vitest';
import { guessit } from '../src/index.js';
it('both cases', () => {
  const r1 = guessit('[ISLAND]One_Piece_679_[VOSTFR]_[V1]_[8bit]_[720p]_[EB7838FC].mp4');
  console.log('679 episode:', JSON.stringify(r1.episode));
  const r2 = guessit('Series/Duckman/Duckman - 101 (01) - 20021107 - I, Duckman.avi');
  console.log('duckman episode:', JSON.stringify(r2.episode), 'season:', JSON.stringify(r2.season));
});
