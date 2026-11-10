import { t } from "../core/i18n.ts";
import { esc } from "./store.js";

export const shortHelp = (shortKey, fullKey) => `<div class="short-help"><div class="row"><span class="muted small grow" data-i18n="${shortKey}">${esc(t(shortKey))}</span><button type="button" class="iconbtn" data-help-toggle data-i18n-aria="ui.info_aria" aria-label="${t("ui.info_aria")}" aria-expanded="false">?</button></div><div class="short-help-full" hidden data-i18n="${fullKey}">${esc(t(fullKey))}</div></div>`;

export function setupShortHelp(){
  document.querySelectorAll('[data-short-help]').forEach(el => {
    const box = document.createElement('div');
    box.innerHTML = shortHelp(el.dataset.shortHelp, '');
    const wrapper = box.firstElementChild, full = wrapper.querySelector('.short-help-full');
    el.replaceWith(wrapper); el.classList.remove('help'); full.removeAttribute('data-i18n'); full.replaceChildren(el);
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-help-toggle]'); if (!b) return;
    const full = b.closest('.short-help').querySelector('.short-help-full');
    full.hidden = !full.hidden; b.setAttribute('aria-expanded', String(!full.hidden));
  });
}
