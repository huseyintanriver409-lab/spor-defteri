// @ts-ignore Node runtime is available to Vitest without @types/node
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
const js = readFileSync(new URL('../src/app/bodymap.js', import.meta.url), 'utf8');
test('rank section title has no literal " ? " separator and omits an empty tier label', () => {
  expect(js).not.toContain(')} ? ${');
  expect(js).toContain('${tierName ? `${esc(tierName)} · ` : ""}${kind === "kanit"');
});
test('reelViewBox falls back to the original ART viewBox and never caches invalid bounds', () => {
  const fn = js.slice(js.indexOf('function reelViewBox'), js.indexOf('const reelFigs'));
  expect(fn).toContain('try { b = document.getElementById(id).getBBox(); } catch { b = null; }');
  expect(fn).toContain('Number.isFinite');
  expect(fn).toContain('b.width <= 0 || b.height <= 0');
  expect(fn).toContain('return ART[sex][side][0].split(" ").map(Number);');
  // the cache write comes after validation, so the early return never stores a bad box
  expect(fn.indexOf('reelBounds.set(id, box)')).toBeGreaterThan(fn.indexOf('return ART[sex][side][0]'));
});
