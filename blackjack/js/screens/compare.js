/** השוואת אסטרטגיות על אותה סדרת קלפים. */
import { SIM_DISCLAIMER_HE, STRATEGY_LABEL_HE } from "../engine/montecarlo.js";
import { describeRulesHe } from "../engine/rules.js";
import { rules, settings } from "../state/appState.js";
import { h, money, num, pct, signedPct } from "../ui/dom.js";
import { barChart, progressBar } from "../ui/components/charts.js";
import { button, segmented } from "../ui/components/controls.js";
import { toast } from "../ui/components/feedbackUi.js";
import { note, panel, screen } from "../ui/components/layout.js";
import { compareStrategiesAsync } from "../ui/simRunner.js";
const STRATEGIES = ['random', 'basic', 'countingDeviations'];
export function compareScreen() {
    let hands = 10000;
    let running = false;
    let handle = null;
    let results = [];
    const host = h('div', { class: 'stack' });
    const render = () => {
        host.replaceChildren(panel({ title: 'השוואת אסטרטגיות', subtitle: describeRulesHe(rules()), icon: '⚖️' }, h('p', { class: 'text-dim', text: 'שלוש האסטרטגיות מורצות על אותו זרע אקראי — כלומר על אותה סדרת קלפים בדיוק. זו השוואה הוגנת.' }), segmented([10000, 100000, 1000000].map((v) => ({ value: v, label: num(v) })), hands, (value) => {
            hands = value;
            render();
        }, 'מספר ידיים'), button(running ? 'מריץ...' : 'הרץ השוואה', start, { tone: 'gold', wide: true, disabled: running })), ...(results.length
            ? [
                panel({ title: 'תוחלת ביחס לכסף שהוהמר', icon: '📊' }, barChart(results.map((r) => ({
                    label: STRATEGY_LABEL_HE[r.config.strategy],
                    value: r.edgeOnWagered * 100,
                })), (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`)),
                panel({ title: 'פירוט מלא', icon: '🧾' }, h('div', { class: 'list-rows' }, ...results.flatMap((r) => [
                    h('div', { class: 'section-title', text: STRATEGY_LABEL_HE[r.config.strategy] }),
                    row('רווח/הפסד', money(r.totalProfit), r.totalProfit >= 0),
                    row('תוחלת ליד', signedPct(r.evPerHandUnits), r.evPerHandUnits >= 0),
                    row('יתרון הבית', r.houseEdge >= 0 ? pct(r.houseEdge, 2) : `שחקן ${pct(-r.houseEdge, 2)}`, r.houseEdge <= 0),
                    row('סטיית תקן ליד', `${r.sdPerHand.toFixed(3)} יח׳`, true),
                    row('ירידת שיא', money(r.maxDrawdown), false),
                    row('אחוז ניצחון', pct(r.winRate, 1), true),
                    row('הימור ממוצע', money(r.averageBet), true),
                ]))),
                note('התוצאות מוצגות כפי שהן. הפרש בין אסטרטגיות בסדרה אחת אינו הוכחה — הוא מושפע גם משונות. ככל שמספר הידיים גדול יותר, ההשוואה אמינה יותר.', '📏'),
                note(SIM_DISCLAIMER_HE, '⚖️'),
            ]
            : []));
    };
    const row = (label, value, good) => h('div', { class: 'list-row' }, h('span', { text: label }), h('span', { class: `row-value ${good ? 'row-good' : 'row-bad'}`, text: value }));
    function start() {
        if (running)
            return;
        running = true;
        results = [];
        const bar = progressBar(0, 'מריץ השוואה', '0%');
        host.replaceChildren(panel({ title: 'מריץ...', icon: '⏳' }, bar));
        const seed = Math.floor(Math.random() * 1e9);
        let doneCount = 0;
        handle = compareStrategiesAsync({
            hands,
            rules: rules(),
            baseBet: settings().minBet,
            bankroll: settings().startingBankroll,
            spread: { unit: settings().minBet, maxUnits: settings().betSpreadMax },
            seed,
        }, STRATEGIES, (completed, total, strategy) => {
            const strategyIndex = strategy ? STRATEGIES.indexOf(strategy) : 0;
            if (strategyIndex > doneCount)
                doneCount = strategyIndex;
            const ratio = (doneCount + completed / total) / STRATEGIES.length;
            const fill = bar.querySelector('.progress-fill');
            const value = bar.querySelector('.progress-value');
            if (fill)
                fill.style.width = `${ratio * 100}%`;
            if (value)
                value.textContent = pct(ratio, 0);
        }, (r) => {
            running = false;
            results = r;
            render();
            toast('ההשוואה הושלמה', 'good');
        }, (message) => {
            running = false;
            toast(`שגיאה: ${message}`, 'bad');
            render();
        });
    }
    render();
    const element = screen({ title: 'השוואת אסטרטגיות', showBack: true }, host);
    return { element, onUnmount: () => handle?.cancel() };
}
//# sourceMappingURL=compare.js.map