/** משוב חזותי: הודעות צפות, חלוניות ובאנר תוצאה. */
import { h } from "../dom.js";
import { sfx } from "../feedback.js";
import { button } from "./controls.js";
let toastHost = null;
function host() {
    if (!toastHost) {
        toastHost = h('div', { class: 'toast-host', attrs: { role: 'status', 'aria-live': 'polite' } });
        document.body.appendChild(toastHost);
    }
    return toastHost;
}
export function toast(message, tone = 'info', duration = 2600) {
    const el = h('div', { class: `toast toast-${tone}` }, message);
    host().appendChild(el);
    setTimeout(() => {
        el.classList.add('leaving');
        setTimeout(() => el.remove(), 320);
    }, duration);
}
export function modal(options) {
    const overlay = h('div', { class: 'modal-overlay', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': options.title } });
    const close = () => {
        overlay.classList.add('leaving');
        setTimeout(() => overlay.remove(), 220);
    };
    const content = h('div', { class: 'modal' }, h('h2', { class: 'modal-title', text: options.title }), h('div', { class: 'modal-body' }, ...options.body.map((b) => (typeof b === 'string' ? h('p', { text: b }) : b))), h('div', { class: 'modal-actions' }, options.cancelLabel
        ? button(options.cancelLabel, () => {
            options.onCancel?.();
            close();
        }, { tone: 'ghost' })
        : null, button(options.confirmLabel ?? 'הבנתי', () => {
        options.onConfirm?.();
        close();
    }, { tone: options.tone === 'danger' ? 'danger' : 'gold' })));
    overlay.appendChild(content);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            options.onCancel?.();
            close();
        }
    });
    document.body.appendChild(overlay);
}
/** באנר תשובה נכונה/שגויה עם הסבר. */
export function answerBanner(correct, title, explanation) {
    if (correct)
        sfx.correct();
    else
        sfx.wrong();
    return h('div', { class: `answer-banner ${correct ? 'correct' : 'wrong'}`, attrs: { role: 'status' } }, h('span', { class: 'answer-mark', text: correct ? '✔' : '✕' }), h('div', { class: 'answer-texts' }, h('strong', { text: title }), h('p', { text: explanation })));
}
/** הודעת הישג. */
export function achievementToast(icon, title) {
    sfx.levelUp();
    const el = h('div', { class: 'toast toast-achievement' }, h('span', { class: 'toast-icon', text: icon }), h('div', {}, h('strong', { text: 'הישג חדש!' }), h('p', { text: title })));
    host().appendChild(el);
    setTimeout(() => {
        el.classList.add('leaving');
        setTimeout(() => el.remove(), 320);
    }, 3600);
}
//# sourceMappingURL=feedbackUi.js.map