import { expect, it } from 'vitest';
import { filterPosePhase, YOGA_POSES } from '../src/core/library.ts';
it('selects dynamic poses without mutating metadata', () => {
  const before = structuredClone(YOGA_POSES);
  expect(filterPosePhase(YOGA_POSES, 'pre').map(p => p.ex)).toEqual(['Sun Salutation', 'Cat-Cow']);
  expect(YOGA_POSES).toEqual(before);
});
it('keeps unmarked poses in All and excludes them from Before and After', () => {
  const poses = [{ ex: 'unknown' }, { ex: 'flow', phase: 'pre' as const }, { ex: 'hold', phase: 'post' as const }];
  expect(filterPosePhase(poses, 'all')).toEqual(poses);
  expect(filterPosePhase(poses, 'post').map(p => p.ex)).toEqual(['hold']);
  expect(filterPosePhase(poses, 'pre').map(p => p.ex)).toEqual(['flow']);
});
it('classifies stretching holds as post and leaves ambiguous transitions unmarked', () => {
  expect(YOGA_POSES.filter(p => p.ex.endsWith('Stretch')).every(p => p.phase === 'post')).toBe(true);
  expect(YOGA_POSES.find(p => p.ex === 'Chaturanga')?.phase).toBeUndefined();
});
