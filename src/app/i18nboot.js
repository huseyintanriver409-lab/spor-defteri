// app.js'te ilk import: ui.js'in initHelp'i çalışmadan önce statik metinler çevrilir (ES modülleri sırayla yüklenir)
import { applyI18n } from "../core/i18n.ts";
applyI18n();
