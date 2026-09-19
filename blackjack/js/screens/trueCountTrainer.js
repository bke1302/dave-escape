/** תרגילי ספירה אמיתית (True Count). */
import { isTrueCountAnswerCorrect, trueCount } from "../engine/counting.js";
import { createRng, randInt } from "../engine/rng.js";
import { accuracy, recordAnswer, state } from "../state/appState.js";
import { h, pct } from "../ui/dom.js";
import { button, optionGrid, segmented } from "../ui/components/controls.js";
import { answerBanner } from "../ui/components/feedbackUi.js";
import { note, panel, screen, statTile } from "../ui/components/layout.js";
const rng = createRng();
function newExercise(mode) {
    const decksOptions = mode === 'exact' ? [1, 2, 3, 4, 5, 6] : [1.5, 2.5, 3.5, 4.5, 0.75, 1.25];
    const decks = decksOptions[Math.floor(rng() * decksOptions.length)];
    const running = randInt(rng, -12, 16);
    return { running, decks, estimate: mode === 'estimate' };
}
export function trueCountScreen() {
    let mode = 'exact';
    let exercise = newExercise(mode);
    let answered = false;
    let feedback = null;
    let startedAt = Date.now();
    const host = h('div', { class: 'stack' });
    const options = () => {
        const exact = trueCount(exercise.running, exercise.decks, 'exact');
        const base = Math.round(exact);
        const set = new Set([base]);
        while (set.size < 6)
            set.add(base + randInt(rng, -4, 4));
        return [...set]
            .sort((a, b) => a - b)
            .map((v) => ({ key: String(v), label: `${v > 0 ? '+' : ''}${v}` }));
    };
    const render = () => {
        const s = state();
        const exact = trueCount(exercise.running, exercise.decks, 'exact');
        host.replaceChildren(h('div', { class: 'grid grid-3' }, statTile('תרגילים', String(s.stats.trainers.trueCount.attempts)), statTile('דיוק', pct(accuracy(s.stats.trainers.trueCount), 0)), statTile('רצף', String(s.stats.currentStreak))), segmented([
            { value: 'exact', label: 'מספר מדויק' },
            { value: 'estimate', label: 'הערכה ("בערך")' },
        ], mode, (value) => {
            mode = value;
            exercise = newExercise(mode);
            answered = false;
            feedback = null;
            startedAt = Date.now();
            render();
        }, 'סוג תרגיל'), panel({ title: 'חשב ספירה אמיתית', subtitle: 'True Count = ספירה רצה ÷ חפיסות שנותרו', icon: '➗' }, h('div', { class: 'row-center', style: { gap: '12px', padding: '6px 0' } }, h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'ספירה רצה' }), h('span', { class: 'count-value', text: `${exercise.running > 0 ? '+' : ''}${exercise.running}` })), h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'חפיסות שנותרו' }), h('span', { class: 'count-value', text: `${exercise.estimate ? '≈' : ''}${exercise.decks}` }))), answered && feedback
            ? feedback
            : optionGrid(options(), (key, el) => {
                if (answered)
                    return;
                answered = true;
                const value = Number(key);
                const correct = isTrueCountAnswerCorrect(value, exercise.running, exercise.decks);
                recordAnswer('trueCount', correct, Date.now() - startedAt);
                el.classList.add(correct ? 'correct' : 'wrong');
                feedback = h('div', { class: 'stack' }, answerBanner(correct, correct ? `נכון — ${exact.toFixed(2)}` : `לא נכון — התוצאה היא ${exact.toFixed(2)}`, `${exercise.running} ÷ ${exercise.decks} = ${exact.toFixed(2)}. בפועל משתמשים בערך המעוגל כלפי מטה: ${trueCount(exercise.running, exercise.decks)}. סטייה של עד חצי נקודה נחשבת תקינה.`), button('תרגיל הבא', () => {
                    exercise = newExercise(mode);
                    answered = false;
                    feedback = null;
                    startedAt = Date.now();
                    render();
                }, { tone: 'gold', wide: true }));
                render();
            }, 3)), note('ככל שנותרו פחות חפיסות, אותה ספירה רצה שווה יתרון גדול יותר. זו הסיבה שהספירה האמיתית היא המספר שקובע.'));
    };
    render();
    const element = screen({ title: 'ספירה אמיתית', subtitle: 'True Count', showBack: true }, host);
    return { element };
}
//# sourceMappingURL=trueCountTrainer.js.map