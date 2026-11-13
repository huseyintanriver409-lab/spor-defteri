// @ts-expect-error Node types are not installed in this browser project.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../src/app/bodymap.js', import.meta.url), 'utf8');
test('reel uses cached path bounds without changing shared artwork', () => {
  expect(js).toContain('document.getElementById(id).getBBox()');
  expect(js).toContain('viewBox="${reelViewBox(sex, side).join(" ")}');
  expect(js).toContain('const [vb] = ART[bodySex()][side]');
});
test('cards keep one snap page and figures do not shrink with content', () => {
  expect(css).toContain('.reel-card{height:100%;min-height:100%');
  expect(css).toContain('--reel-rest:290px;flex:none');
  expect(css).toContain('100cqh - var(--reel-rest)');
  expect(css).toContain('scroll-snap-stop:always');
  expect(css).toContain('height:clamp(200px,calc(100dvh - 400px),520px)');
});
