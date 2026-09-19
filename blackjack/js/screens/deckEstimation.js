/** אימון הערכת חפיסות — כמה חפיסות נותרו בנעל. */
import { isDeckEstimateCorrect } from "../engine/counting.js";
import { createRng, randInt } from "../engine/rng.js";
import { accuracy, recordAnswer, rules, state } from "../state/appState.js";
import { h, num, pct } from "../ui/dom.js";
import { button, optionGrid } from "../ui/components/controls.js";
import { answerBanner } from "../ui/components/feedbackUi.js";
import { note, panel, screen, statTile } from "../ui/components/layout.js";
const rng = createRng();
export function deckEstimationScreen() {
    const decks = rules().decks;
    const total = decks * 52;
    let remaining = randInt(rng, Math.round(total * 0.15), total - 10);
    let answered = false;
    let feedback = null;
    let startedAt = Date.now();
    const host = h('div', { class: 'stack' });
    const nextExercise = () => {
        remaining = randInt(rng, Math.round(total * 0.15), total - 10);
        answered = false;
        feedback = null;
        startedAt = Date.now();
        render();
    };
    const render = () => {
        const s = state();
        const actualDecks = remaining / 52;
        const choices = [];
        for (let d = 0.5; d <= decks; d += 0.5)
            choices.push(d);
        host.replaceChildren(h('div', { class: 'grid grid-3' }, statTile('תרגילים', String(s.stats.trainers.deckEstimation.attempts)), statTile('דיוק', pct(accuracy(s.stats.trainers.deckEstimation), 0)), statTile('נעל', `${decks} חפיסות`)), panel({ title: 'כמה חפיסות נותרו בנעל?', subtitle: 'הערך לפי גובה ערימת הקלפים', icon: '📦' }, h('div', { class: 'shoe-visual', style: { height: '78px' } }, h('div', { class: 'shoe-fill', style: { width: `${(remaining / total) * 100}%` } }), h('div', { class: 'shoe-cut', style: { insetInlineStart: `${(1 - rules().penetration) * 100}%` } })), h('p', { class: 'text-faint', text: 'הקו האדום מסמן את כרטיס החיתוך (חדירה).' }), answered && feedback
            ? feedback
            : optionGrid(choices.map((d) => ({ key: String(d), label: `${d}` })), (key, el) => {
                if (answered)
                    return;
                answered = true;
                const value = Number(key);
                const correct = isDeckEstimateCorrect(value, actualDecks);
                recordAnswer('deckEstimation', correct, Date.now() - startedAt);
                el.classList.add(correct ? 'correct' : 'wrong');
                feedback = h('div', { class: 'stack' }, answerBanner(correct, correct ? `נכון — נותרו ${actualDecks.toFixed(2)} חפיסות` : `לא מדויק — נותרו ${actualDecks.toFixed(2)} חפיסות`, `${num(remaining)} קלפים חלקי 52 = ${actualDecks.toFixed(2)}. בהערכה מעשית מעגלים לחצי חפיסה הקרובה, וסטייה של עד חצי חפיסה נחשבת תקינה.`), button('תרגיל הבא', nextExercise, { tone: 'gold', wide: true }));
                render();
            }, 4)), note('הערכת חפיסות היא החוליה החלשה של רוב הסופרים: טעות של חצי חפיסה משנה את הספירה האמיתית ואת גודל ההימור.'));
    };
    render();
    const element = screen({ title: 'הערכת חפיסות', subtitle: 'Deck Estimation', showBack: true }, host);
    return { element };
}
//# sourceMappingURL=deckEstimation.js.map