/** תרגילי ספירה רצה — רצף קלפים, המשתמש מזין את הספירה. */
import { buildShoeCards, hiLoValue } from "../engine/cards.js";
import { runningCount } from "../engine/counting.js";
import { createRng, fisherYatesShuffle } from "../engine/rng.js";
import { accuracy, recordAnswer, state } from "../state/appState.js";
import { h, pct } from "../ui/dom.js";
import { button, numberPad, segmented } from "../ui/components/controls.js";
import { answerBanner } from "../ui/components/feedbackUi.js";
import { cardView } from "../ui/components/playingCard.js";
import { note, panel, screen, statTile } from "../ui/components/layout.js";
const rng = createRng();
export function runningCountScreen() {
    let length = 5;
    let cards = [];
    let answered = false;
    let feedback = null;
    let startedAt = Date.now();
    const host = h('div', { class: 'stack' });
    const deal = () => {
        cards = fisherYatesShuffle(buildShoeCards(1), rng).slice(0, length);
        answered = false;
        feedback = null;
        startedAt = Date.now();
        render();
    };
    const render = () => {
        const actual = runningCount(cards);
        const s = state();
        host.replaceChildren(h('div', { class: 'grid grid-3' }, statTile('תרגילים', String(s.stats.trainers.runningCount.attempts)), statTile('דיוק', pct(accuracy(s.stats.trainers.runningCount), 0)), statTile('רצף', String(s.stats.currentStreak))), panel({ title: 'מה הספירה הרצה?', subtitle: `${cards.length} קלפים ברצף`, icon: '🔢' }, h('div', { class: 'row-center', style: { gap: '6px', padding: '8px 0' } }, ...cards.map((c, i) => cardView(c, { small: true, delay: i * 70 }))), answered && feedback
            ? feedback
            : numberPad((value) => {
                if (answered)
                    return;
                answered = true;
                const correct = value === actual;
                recordAnswer('runningCount', correct, Date.now() - startedAt);
                const steps = cards
                    .map((c) => `${c.rank} (${hiLoValue(c.rank) > 0 ? '+' : ''}${hiLoValue(c.rank)})`)
                    .join(' · ');
                feedback = h('div', { class: 'stack' }, answerBanner(correct, correct ? `נכון — ${actual >= 0 ? '+' : ''}${actual}` : `לא נכון — התשובה היא ${actual >= 0 ? '+' : ''}${actual}`, `פירוט: ${steps}`), button('תרגיל הבא', deal, { tone: 'gold', wide: true }));
                render();
            }, true)), panel({ title: 'אורך הרצף', icon: '⚙️' }, segmented([
            { value: 5, label: '5 קלפים' },
            { value: 10, label: '10' },
            { value: 15, label: '15' },
            { value: 26, label: 'חצי חפיסה' },
        ], length, (value) => {
            length = value;
            deal();
        }, 'אורך רצף')), note('התשובה מוצגת רק לאחר שתענה. ערכי Hi-Lo: 2-6 = ‎+1 · 7-9 = 0 · 10/J/Q/K/A = ‎-1'));
    };
    deal();
    const element = screen({ title: 'ספירה רצה', subtitle: 'Running Count', showBack: true }, host);
    return { element };
}
//# sourceMappingURL=runningCountTrainer.js.map