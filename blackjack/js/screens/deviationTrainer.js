/** אימון סטיות לפי ספירה — Illustrious 18 ו-Fab 4. */
import { ACTION_LABEL_HE } from "../engine/basicStrategy.js";
import { DEVIATIONS, DEVIATIONS_NOTE_HE, actionForDeviation, deviationsApplicable, INSURANCE_INDEX } from "../engine/deviations.js";
import { createRng, randInt } from "../engine/rng.js";
import { accuracy, recordAnswer, rules, state } from "../state/appState.js";
import { h, pct } from "../ui/dom.js";
import { button, optionGrid, segmented } from "../ui/components/controls.js";
import { answerBanner } from "../ui/components/feedbackUi.js";
import { note, panel, screen, statTile } from "../ui/components/layout.js";
const rng = createRng();
function pickDeviation() {
    const playable = DEVIATIONS.filter((d) => d.group !== 'insurance');
    return playable[Math.floor(rng() * playable.length)];
}
function handLabel(dev) {
    if (dev.playerValues.length === 2 && dev.playerValues[0] === dev.playerValues[1]) {
        return dev.playerValues[0] === 1 ? 'זוג אסים' : `זוג ${dev.playerValues[0]}`;
    }
    return String(dev.playerValues.reduce((a, b) => a + b, 0));
}
export function deviationTrainerScreen() {
    const r = rules();
    let mode = 'drill';
    let dev = pickDeviation();
    let tc = randInt(rng, dev.index - 3, dev.index + 3);
    let answered = false;
    let feedback = null;
    let startedAt = Date.now();
    const host = h('div', { class: 'stack' });
    const next = () => {
        dev = pickDeviation();
        tc = randInt(rng, dev.index - 3, dev.index + 3);
        answered = false;
        feedback = null;
        startedAt = Date.now();
        render();
    };
    const renderDrill = () => {
        const correctAction = actionForDeviation(dev, tc);
        const actions = ['hit', 'stand', 'double', 'split', 'surrender'];
        const relevant = actions.filter((a) => a === dev.basicAction || a === dev.deviationAction || a === 'hit' || a === 'stand');
        return panel({ title: 'מה הפעולה הנכונה?', subtitle: `${handLabel(dev)} מול ${dev.dealerUp === 1 ? 'אס' : dev.dealerUp}`, icon: '📊' }, h('div', { class: 'row-center', style: { gap: '10px', padding: '4px 0' } }, h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'היד שלך' }), h('span', { class: 'count-value', text: handLabel(dev) })), h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'קלף הדילר' }), h('span', { class: 'count-value', text: dev.dealerUp === 1 ? 'A' : String(dev.dealerUp) })), h('div', { class: `count-meter tone-${tc > 1 ? 'hot' : tc < -1 ? 'cold' : 'neutral'}` }, h('span', { class: 'count-label', text: 'ספירה אמיתית' }), h('span', { class: 'count-value', text: `${tc > 0 ? '+' : ''}${tc}` }))), answered && feedback
            ? feedback
            : optionGrid([...new Set(relevant)].map((a) => ({ key: a, label: ACTION_LABEL_HE[a] })), (key, el) => {
                if (answered)
                    return;
                answered = true;
                const correct = key === correctAction;
                recordAnswer('deviations', correct, Date.now() - startedAt);
                el.classList.add(correct ? 'correct' : 'wrong');
                const applies = dev.direction === 'atOrAbove' ? tc >= dev.index : tc <= dev.index;
                feedback = h('div', { class: 'stack' }, answerBanner(correct, correct ? `נכון — ${ACTION_LABEL_HE[correctAction]}` : `לא נכון — התשובה: ${ACTION_LABEL_HE[correctAction]}`, `${dev.note} האינדקס הוא ${dev.index >= 0 ? '+' : ''}${dev.index} (${dev.direction === 'atOrAbove' ? 'ומעלה' : 'ומטה'}). בספירה ${tc >= 0 ? '+' : ''}${tc} הסטייה ${applies ? 'בתוקף' : 'אינה בתוקף'}, ולכן ${ACTION_LABEL_HE[correctAction]}.`), button('תרגיל הבא', next, { tone: 'gold', wide: true }));
                render();
            }, 2));
    };
    const renderTable = () => {
        const rows = DEVIATIONS.map((d) => h('div', { class: 'list-row' }, h('span', { text: d.group === 'insurance' ? 'ביטוח' : `${d.handLabel}` }), h('span', { class: 'row-value', text: `${d.index >= 0 ? '+' : ''}${d.index} ${d.direction === 'atOrAbove' ? '↑' : '↓'} → ${ACTION_LABEL_HE[d.deviationAction]}` })));
        return panel({ title: 'טבלת האינדקסים', subtitle: 'Illustrious 18 + Fab 4', icon: '📋' }, h('div', { class: 'list-rows' }, ...rows), h('p', { class: 'text-faint', text: DEVIATIONS_NOTE_HE }));
    };
    const render = () => {
        const s = state();
        host.replaceChildren(h('div', { class: 'grid grid-3' }, statTile('תרגילים', String(s.stats.trainers.deviations.attempts)), statTile('דיוק', pct(accuracy(s.stats.trainers.deviations), 0)), statTile('ביטוח מ-', `+${INSURANCE_INDEX}`)), segmented([
            { value: 'drill', label: 'תרגול' },
            { value: 'table', label: 'טבלה' },
        ], mode, (value) => {
            mode = value;
            render();
        }, 'מצב'), mode === 'drill' ? renderDrill() : renderTable(), deviationsApplicable(r)
            ? note('האינדקסים מתאימים לנעל של 4-8 חפיסות — כפי שהוגדר בהגדרות שלך.')
            : note(`שים לב: בחרת ${r.decks} חפיסות. מספרי האינדקס כאן מחושבים לנעל של 4-8 חפיסות ואינם מדויקים למשחק חפיסה אחת או שתיים.`, '⚠️'));
    };
    render();
    const element = screen({ title: 'אימון סטיות', subtitle: 'Deviations לפי Hi-Lo', showBack: true }, host);
    return { element };
}
//# sourceMappingURL=deviationTrainer.js.map