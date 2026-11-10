import { YOGA_POSES } from "../core/library.ts";
import { t } from "../core/i18n.ts";
import { esc, ic } from "./store.js";
export const yogaRegions = [["all", "body"], ["hips", "target"], ["back", "activity"], ["shoulders", "arrow-up"], ["legs", "arrow-down"]];
export const regionLabel = region => t({ all: "programs.region_all", hips: "programs.region_hips", back: "programs.region_back", shoulders: "programs.region_shoulders", legs: "programs.region_legs" }[region]);
export function poseInfo(ex) {
 const p = YOGA_POSES.find(p => p.ex === ex); if (!p) return "";
 const label = t("programs.pose_info", { region: regionLabel(p.region), level: p.level, sec: p.seconds }) + (p.unilateral ? ", " + t("programs.both_sides") : "");
 return (p.phase ? '<span class="pose-phase" role="img" data-i18n-aria="programs.phase_' + p.phase + '" aria-label="' + t(p.phase === 'pre' ? 'programs.phase_pre' : 'programs.phase_post') + '">' + ic(p.phase === 'pre' ? 'arrow-right' : 'pause') + '</span>' : '') + '<span class="pose-info" role="img" aria-label="' + esc(label) + '" title="' + esc(label) + '">' + ic(yogaRegions.find(r => r[0] === p.region)[1]) + '<span aria-hidden="true">' + "●".repeat(p.level) + ' · ' + p.seconds + (p.unilateral ? ' ↔' : '') + '</span></span>';
}
