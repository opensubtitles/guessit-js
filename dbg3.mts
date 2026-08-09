import { guessit } from './src/index.js';
const r: any = guessit('Planet.Earth.II.S01.2160p.UHD.BluRay.HDR.DTS-HD.MA5.1.x265-ULTRAHDCLUB', { advanced: true });
for (const [k, v] of Object.entries(r)) {
  const a: any[] = Array.isArray(v) ? v : [v];
  for (const m of a) console.log(k, JSON.stringify(m.value ?? m), m.start !== undefined ? `[${m.start},${m.end}) ${JSON.stringify(m.raw)}` : '');
}
