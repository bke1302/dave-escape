/**
 * מצב קזינו מתקדם — הספירה אינה מוצגת.
 * בסוף כל סיבוב נשאלות ארבע שאלות: ספירה רצה, ספירה אמיתית, הימור ופעולה נכונה.
 */
import { ACTION_LABEL_HE } from "../engine/basicStrategy.js";
import { unitsForTrueCount, trueCount } from "../engine/counting.js";
import { describeRulesHe } from "../engine/rules.js";
import { recordAnswer, rules, settings, updateProgress } from "../state/appState.js";
import { h, money, num } from "../ui/dom.js";
import { button, optionGrid } from "../ui/components/controls.js";
import { answerBanner, toast } from "../ui/components/feedbackUi.js";
import { note, panel, screen } from "../ui/components/layout.js";
import { TableController } from "./gameController.js";
export function casinoAdvancedScreen() {
    const quizHost = h('div', { class: 'stack' });
    const host = h('div', {});
    const controller = new TableController({
        rules: rules(),
        bots: 3,
        showCount: false,
        showHint: false,
        onRoundEnd: () => {
            updateProgress((p) => ({ advancedRounds: p.advancedRounds + 1 }));
        },
        beforeNextRound: (game, proceed) => {
            const rc = game.shoe.runningCount;
            const decks = game.shoe.decksRemaining;
            const tc = trueCount(rc, decks);
            const spread = { unit: settings().minBet, maxUnits: settings().betSpreadMax };
            const correctUnits = unitsForTrueCount(tc, spread);
            const rcOptions = buildNumberOptions(rc);
            const tcOptions = buildNumberOptions(tc);
            const betOptions = [1, 2, 4, 6, 8, 12].map((u) => ({ key: String(u), label: `${u} יחידות` }));
            const questions = [
                {
                    title: 'מה הספירה הרצה (Running Count) כרגע?',
                    options: rcOptions,
                    correctKey: String(rc),
                    columns: 3,
                    explain: () => `הספירה הרצה היא ${rc >= 0 ? '+' : ''}${rc}. זהו סכום ערכי Hi-Lo של כל הקלפים שיצאו מאז הערבוב.`,
                },
                {
                    title: `מה הספירה האמיתית (True Count)? נותרו כ-${decks.toFixed(1)} חפיסות`,
                    options: tcOptions,
                    correctKey: String(tc),
                    columns: 3,
                    explain: () => `${rc >= 0 ? '+' : ''}${rc} חלקי ${decks.toFixed(1)} חפיסות = ${tc >= 0 ? '+' : ''}${tc}.`,
                },
                {
                    title: 'כמה היית מהמר בסיבוב הבא?',
                    options: betOptions,
                    correctKey: String(correctUnits),
                    columns: 3,
                    explain: () => `לפי רמפת ההימורים (True Count פחות 1, מוגבל ל-${settings().betSpreadMax} יחידות) ההימור הוא ${correctUnits} יחידות — ${money(correctUnits * settings().minBet)}.`,
                },
            ];
            let index = 0;
            const renderQuestion = () => {
                quizHost.replaceChildren();
                if (index >= questions.length) {
                    quizHost.appendChild(panel({ title: 'סיכום הסיבוב', icon: '✅' }, h('p', { class: 'text-dim', text: `ספירה רצה ${rc >= 0 ? '+' : ''}${rc} · ספירה אמיתית ${tc >= 0 ? '+' : ''}${tc} · ${decks.toFixed(1)} חפיסות נותרו` }), button('סיבוב הבא', () => {
                        quizHost.replaceChildren();
                        proceed();
                    }, { tone: 'gold', wide: true })));
                    return;
                }
                const q = questions[index];
                const banner = h('div', {});
                quizHost.appendChild(panel({ title: `שאלה ${index + 1} מתוך ${questions.length}`, subtitle: q.title, icon: '❓' }, optionGrid(q.options, (key, el) => {
                    const correct = key === q.correctKey;
                    el.classList.add(correct ? 'correct' : 'wrong');
                    recordAnswer('casino', correct);
                    banner.replaceChildren(answerBanner(correct, correct ? 'נכון' : `לא נכון — התשובה: ${labelFor(q, q.correctKey)}`, q.explain(key)));
                    setTimeout(() => {
                        index++;
                        renderQuestion();
                    }, 1500);
                }, q.columns ?? 2), banner));
            };
            renderQuestion();
        },
    });
    host.appendChild(controller.element);
    const element = screen({
        title: 'מצב קזינו מתקדם',
        subtitle: describeRulesHe(rules()),
        showBack: true,
        variant: 'table',
    }, host, h('div', { class: 'stack', style: { padding: '12px' } }, quizHost, note('הספירה אינה מוצגת. עקוב אחרי כל הקלפים — שלך, של הדילר ושל שאר השחקנים — וענה בסוף כל סיבוב.'), panel({ title: 'פעולה נכונה', subtitle: 'בדוק את עצמך בזמן אמת', icon: '🎯' }, button('מה הפעולה הנכונה ליד הנוכחית?', () => {
        const action = controller.correctActionForCurrentHand();
        if (!action) {
            toast('אין יד פעילה כרגע', 'info');
            return;
        }
        toast(`אסטרטגיה בסיסית: ${ACTION_LABEL_HE[action]}`, 'good');
    }, { tone: 'ghost', wide: true }), h('p', { class: 'text-faint', text: `נעל: ${num(controller.game.shoe.decks)} חפיסות · חדירה ${Math.round(rules().penetration * 100)}%` }))));
    return { element };
}
function labelFor(q, key) {
    return q.options.find((o) => o.key === key)?.label ?? key;
}
/** בונה אפשרויות סביב הערך הנכון (כולל מסיחים). */
function buildNumberOptions(correct) {
    const values = new Set([correct]);
    const offsets = [-3, -2, -1, 1, 2, 3];
    while (values.size < 6) {
        const offset = offsets[Math.floor(Math.random() * offsets.length)];
        values.add(correct + offset);
    }
    return [...values]
        .sort((a, b) => a - b)
        .map((v) => ({ key: String(v), label: `${v > 0 ? '+' : ''}${v}` }));
}
//# sourceMappingURL=casinoAdvanced.js.map