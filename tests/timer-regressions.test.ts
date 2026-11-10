import { it, expect, vi, beforeEach } from 'vitest';
import { updateBusy } from '../src/core/update-busy.ts';
import tr from '../src/i18n/tr/live.ts';
import en from '../src/i18n/en/live.ts';
const env = vi.hoisted(() => ({ state: { rest: 90 }, nodes: new Map<string, any>() }));
vi.mock('../src/app/store.js', () => ({ state: env.state, save: vi.fn(), fmt: String, ic: () => '', toast: vi.fn(), $: (key: string) => {
 if (!env.nodes.has(key)) env.nodes.set(key, { innerHTML: '', classList: { toggle() {}, add() {}, remove() {} }, querySelectorAll: () => key === '#presets' ? [{ dataset: { s: '180' }, set onclick(fn: any) { env.nodes.set('presetClick', fn); } }] : [] });
 return env.nodes.get(key);
} }));
vi.mock('../src/app/ui.js', () => ({ buzz: vi.fn() }));
// @ts-expect-error JavaScript app module
import { beep, renderPresets, tDur, setTDur } from '../src/app/tools.js';
// @ts-expect-error JavaScript app module
import { buzz } from '../src/app/ui.js';
it('B3: defers updates for workouts and both timers even when hidden', () => {
 for (const hidden of [false, true]) {
 expect(updateBusy({}, null, 0, undefined, hidden)).toBe(true);
 expect(updateBusy(null, {}, 0, undefined, hidden)).toBe(true);
 expect(updateBusy(null, null, 100, undefined, hidden)).toBe(true);
 }
 expect(updateBusy(null, null, 0, 'INPUT')).toBe(true);
 expect(updateBusy(null, null, 0, 'BUTTON')).toBe(false);
});
it('B8: routes alarm vibration through preference-aware buzz', () => {
 beep(); expect(buzz).toHaveBeenCalledWith([250,120,250,120,250]);
});
it('B9: preset changes only timer duration', () => {
 setTDur(90); renderPresets(); env.nodes.get('presetClick')();
 expect(tDur).toBe(180); expect(env.state.rest).toBe(90);
});
it('U7: provides common completion label and RIR in both languages', () => {
 expect(tr.complete).toBe('Seti tamamla'); expect(en.complete).toBe('Complete set');
 expect(tr.rir).toBe('RIR'); expect(en.rir).toBe('RIR');
});
