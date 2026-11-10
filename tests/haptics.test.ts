import { expect, it } from "vitest";
import { yogaTransitionHaptic } from "../src/core/haptics.ts";
it("selects separate pose and side patterns", () => {
  expect(yogaTransitionHaptic(true, false, true)).toEqual([40, 60, 40]);
  expect(yogaTransitionHaptic(true, true, false)).toEqual([20, 40, 20, 40, 20]);
  expect(yogaTransitionHaptic(true, true, true)).toEqual([20, 40, 20, 40, 20]);
});
it("does not select transition feedback for sport or an unchanged pose", () => {
  expect(yogaTransitionHaptic(false, true, true)).toBeNull();
  expect(yogaTransitionHaptic(true, false, false)).toBeNull();
});
