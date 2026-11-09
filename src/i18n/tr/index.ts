import settings from "./settings.ts";
import html from "./html.ts";
import cloud from "./cloud.ts";
import backup from "./backup.ts";
import importer from "./importer.ts";
import baseline from "./baseline.ts";
import live from "./live.ts";
import log from "./log.ts";
import tools from "./tools.ts";
import streak from "./streak.ts";
import history from "./history.ts";
import home from "./home.ts";
import programs from "./programs.ts";
import presets from "./presets.ts";
import library from "./library.ts";
import ui from "./ui.ts";
import app from "./app.ts";
import bodymap from "./bodymap.ts";
import stats from "./stats.ts";
import exercises from "./exercises.ts";
import core_programs from "./core_programs.ts";
import ai from "./ai.ts";
import assistant from "./assistant.ts";
import muscles from "./muscles.ts";
import core from "./core.ts";
import groups from "./groups.ts";

// Her ad alanı için bir satır: import + aşağıdaki nesneye ekle
export default { settings, html, cloud, backup, importer, baseline, live, log, tools, streak, history, home, programs, presets, library, ui, app, bodymap, stats, exercises, core_programs, ai, assistant, muscles, core, groups } as Record<string, Record<string, string>>;
