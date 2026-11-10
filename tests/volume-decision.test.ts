import { expect, it } from 'vitest';
import { beginnerVolumePlan, volumeStartDate } from '../src/core/beginner-volume.ts';
const program = { id: 'p', selectedDate: '2026-11-01', items: [{ ex: 'Squat', sets: 5, reps: '5', ss: true }] };
const input = { program, today: '2026-11-01', profile: { exp: 'new' as const, expAt: new Date('2026-11-01T12:00:00').getTime() } };
it('offers a card, accepts fewer live sets and preserves the persisted program and item metadata', () => {
  const before = structuredClone(program), key = beginnerVolumePlan(input).card!;
  expect(key).toBeTruthy();
  const result = beginnerVolumePlan({ ...input, decisions: { [key]: 'accept' } });
  expect(result.card).toBeNull();
  expect(result.items).toEqual([{ ex: 'Squat', sets: 3, reps: '5', ss: true }]);
  expect(program).toEqual(before);
});
it('never displays a rejected key again', () => {
  const key = beginnerVolumePlan(input).card!;
  const result = beginnerVolumePlan({ ...input, today: '2026-11-05', decisions: { [key]: 'reject' } });
  expect(result.card).toBeNull(); expect(result.items).toEqual(program.items);
});
it.each(['2026-11-15', '2026-12-01', '2026-10-31'])('uses normal sets outside the window: %s', today => {
  const key = beginnerVolumePlan(input).card!;
  const result = beginnerVolumePlan({ ...input, today, decisions: { [key]: 'accept' } });
  expect(result.card).toBeNull(); expect(result.items).toEqual(program.items);
});
it('uses the last day of the 14-day window', () => {
  const key = beginnerVolumePlan(input).card!;
  expect(beginnerVolumePlan({ ...input, today: '2026-11-14', decisions: { [key]: 'accept' } }).items[0].sets).toBe(3);
});
it('keeps the selection key stable after the first workout so acceptance is not lost', () => {
  const key = beginnerVolumePlan(input).card!;
  const result = beginnerVolumePlan({ ...input, today: '2026-11-05', sessions: [{ prog: 'p', date: '2026-11-05' }], decisions: { [key]: 'accept' } });
  expect(result.card).toBeNull(); expect(result.items[0].sets).toBe(3);
});
it('resolves existing start, earliest matching session, then selection; unknown dates never become today', () => {
  const sessions = [{ prog: 'p', date: '2026-10-02' }, { prog: 'other', date: '2026-01-01' }, { prog: 'p', date: '2026-10-01' }];
  expect(volumeStartDate({ ...program, startDate: '2026-09-01' }, sessions)).toBe('2026-09-01');
  expect(volumeStartDate(program, sessions)).toBe('2026-10-01');
  expect(volumeStartDate(program, [])).toBe('2026-11-01');
  expect(beginnerVolumePlan({ ...input, program: { id: 'p', items: program.items } }).card).toBeNull();
});
