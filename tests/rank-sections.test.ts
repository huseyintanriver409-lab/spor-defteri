import { expect, test } from 'vitest';
import { startsRankSection, rankForMuscle, sessionLoad, type Ranked } from '../src/core/musclemap.ts';
test('section boundaries include tier, kind and evidence group without duplicate contiguous headers', () => {
 const row: Ranked = { name: 'A', kind: 'kanit', group: 0, w: 1, tier: 'iyi' };
 expect(startsRankSection(row)).toBe(true);
 expect(startsRankSection({ ...row, name: 'B' }, row)).toBe(false);
 expect(startsRankSection({ ...row, tier: 'yuksek' }, row)).toBe(true);
 expect(startsRankSection({ ...row, group: 1 }, row)).toBe(true);
 expect(startsRankSection({ ...row, kind: 'ana' }, row)).toBe(true);
 expect(startsRankSection({ ...row, kind: 'yardimci' }, { ...row, kind: 'ana' })).toBe(true);
});
test('ranked sections retain the default session-load tier of each exercise', () => {
 const muscles = (name: string) => ({ p: ['Biceps'], s: [], w: { Biceps: name === 'A' ? 1 : .25 } });
 const rows = rankForMuscle('Biceps', ['B', 'A'], muscles);
 expect(rows.map(x => x.name)).toEqual(['A', 'B']);
 for (const row of rows) expect(row.tier).toBe(sessionLoad([{ ex: row.name, sets: 9 }], muscles).Biceps.tier);
});
