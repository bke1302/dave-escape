/** מאמן חישוב יד — חוק ה-Modulo 10. */
import { buildShoeCards } from "../../engine/cards.js";
import { createRng, fisherYatesShuffle } from "../../engine/rng.js";
import { h, pct } from "../../ui/dom.js";
import { button, optionGrid } from "../../ui/components/controls.js";
import { answerBanner } from "../../ui/components/feedbackUi.js";
import { note, panel, screen, statTile } from "../../ui/components/layout.js";
import { cardView } from "../../ui/components/playingCard.js";
import { adaptiveHint, baccarat, baccaratAccuracy, recordBaccaratAnswer } from "../state.js";
import { baccaratCardValue, explainTotalHe, handTotal } from "../engine/hand.js";
const rng = createRng();
export function baccaratHandTrainerScreen() {
    let cards = [];
    let answered = false;
    let feedback = null;
    let startedAt = Date.now();
    const host = h('div', { class: 'stack' });
    const deal = () => {
        const difficulty = adaptiveHint().difficulty;
        // ברמה נמוכה שני קלפים, ברמות גבוהות גם ידיים של שלושה קלפים
        const count = difficulty >= 2 && rng() < 0.5 ? 3 : 2;
        cards = fisherYatesShuffle(buildShoeCards(1), rng).slice(0, count);
        answered = false;
        feedback = null;
        startedAt = Date.now();
        render();
    };
    const render = () => {
        const b = baccarat();
        const total = handTotal(cards);
        const values = cards.map(baccaratCardValue);
        const options = new Set([total]);
        while (options.size < 4)
            options.add(Math.floor(rng() * 10));
        host.replaceChildren(h('div', { class: 'grid grid-3' }, statTile('תרגילים', String(b.trainers.handValue.attempts)), statTile('דיוק', pct(baccaratAccuracy(b.trainers.handValue), 0)), statTile('רצף', String(b.currentStreak))), panel({ title: 'כמה שווה היד?', subtitle: 'זכור: רק ספרת האחדות נספרת', icon: '➗' }, h('div', { class: 'row-center', style: { gap: '6px', padding: '10px 0' } }, ...cards.map((c, i) => cardView(c, { delay: i * 60 }))), h('p', { class: 'text-faint', style: { textAlign: 'center' }, text: `ערכי הקלפים: ${values.join(' + ')}` }), answered && feedback
            ? feedback
            : optionGrid([...options].sort((a, b2) => a - b2).map((v) => ({ key: String(v), label: String(v) })), (key, el) => {
                if (answered)
                    return;
                answered = true;
                const correct = Number(key) === total;
                recordBaccaratAnswer('handValue', correct, Date.now() - startedAt);
                el.classList.add(correct ? 'correct' : 'wrong');
                feedback = h('div', { class: 'stack' }, answerBanner(correct, correct ? `נכון — היד שווה ${total}` : `לא נכון — היד שווה ${total}`, explainTotalHe(values)), button('תרגיל הבא', deal, { tone: 'gold', wide: true }));
                render();
            }, 4)), note('אס = 1 · קלפים 2-9 = ערכם · 10, נסיך, מלכה ומלך = 0'));
    };
    deal();
    return { element: screen({ title: 'חישוב יד', subtitle: 'Modulo 10', showBack: true }, host) };
}
//# sourceMappingURL=handTrainer.js.map