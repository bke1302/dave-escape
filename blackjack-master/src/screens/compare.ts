/** השוואת אסטרטגיות על אותה סדרת קלפים. */
import { SIM_DISCLAIMER_HE, STRATEGY_LABEL_HE, type SimResult, type SimStrategy } from '../engine/montecarlo.ts';
import { describeRulesHe } from '../engine/rules.ts';
import { rules, settings } from '../state/appState.ts';
import { h, money, num, pct, signedPct } from '../ui/dom.ts';
import { barChart, progressBar } from '../ui/components/charts.ts';
import { button, segmented } from '../ui/components/controls.ts';
import { toast } from '../ui/components/feedbackUi.ts';
import { note, panel, screen } from '../ui/components/layout.ts';
import type { ScreenInstance } from '../ui/router.ts';
import { compareStrategiesAsync, type RunHandle } from '../ui/simRunner.ts';

const STRATEGIES: SimStrategy[] = ['random', 'basic', 'countingDeviations'];

export function compareScreen(): ScreenInstance {
  let hands = 10000;
  let running = false;
  let handle: RunHandle | null = null;
  let results: SimResult[] = [];

  const host = h('div', { class: 'stack' });

  const render = (): void => {
    host.replaceChildren(
      panel(
        { title: 'השוואת אסטרטגיות', subtitle: describeRulesHe(rules()), icon: '⚖️' },
        h('p', { class: 'text-dim', text: 'שלוש האסטרטגיות מורצות על אותו זרע אקראי — כלומר על אותה סדרת קלפים בדיוק. זו השוואה הוגנת.' }),
        segmented(
          [10000, 100000, 1000000].map((v) => ({ value: v, label: num(v) })),
          hands,
          (value) => {
            hands = value;
            render();
          },
          'מספר ידיים',
        ),
        button(running ? 'מריץ...' : 'הרץ השוואה', start, { tone: 'gold', wide: true, disabled: running }),
      ),
      ...(results.length
        ? [
            panel(
              { title: 'תוחלת ביחס לכסף שהוהמר', icon: '📊' },
              barChart(
                results.map((r) => ({
                  label: STRATEGY_LABEL_HE[r.config.strategy],
                  value: r.edgeOnWagered * 100,
                })),
                (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`,
              ),
            ),
            panel(
              { title: 'פירוט מלא', icon: '🧾' },
              h(
                'div',
                { class: 'list-rows' },
                ...results.flatMap((r) => [
                  h('div', { class: 'section-title', text: STRATEGY_LABEL_HE[r.config.strategy] }),
                  row('רווח/הפסד', money(r.totalProfit), r.totalProfit >= 0),
                  row('תוחלת ליד', signedPct(r.evPerHandUnits), r.evPerHandUnits >= 0),
                  row('יתרון הבית', r.houseEdge >= 0 ? pct(r.houseEdge, 2) : `שחקן ${pct(-r.houseEdge, 2)}`, r.houseEdge <= 0),
                  row('סטיית תקן ליד', `${r.sdPerHand.toFixed(3)} יח׳`, true),
                  row('ירידת שיא', money(r.maxDrawdown), false),
                  row('אחוז ניצחון', pct(r.winRate, 1), true),
                  row('הימור ממוצע', money(r.averageBet), true),
                ]),
              ),
            ),
            note(
              'התוצאות מוצגות כפי שהן. הפרש בין אסטרטגיות בסדרה אחת אינו הוכחה — הוא מושפע גם משונות. ככל שמספר הידיים גדול יותר, ההשוואה אמינה יותר.',
              '📏',
            ),
            note(SIM_DISCLAIMER_HE, '⚖️'),
          ]
        : []),
    );
  };

  const row = (label: string, value: string, good: boolean): HTMLElement =>
    h(
      'div',
      { class: 'list-row' },
      h('span', { text: label }),
      h('span', { class: `row-value ${good ? 'row-good' : 'row-bad'}`, text: value }),
    );

  function start(): void {
    if (running) return;
    running = true;
    results = [];
    const bar = progressBar(0, 'מריץ השוואה', '0%');
    host.replaceChildren(panel({ title: 'מריץ...', icon: '⏳' }, bar));
    const seed = Math.floor(Math.random() * 1e9);
    let doneCount = 0;

    handle = compareStrategiesAsync(
      {
        hands,
        rules: rules(),
        baseBet: settings().minBet,
        bankroll: settings().startingBankroll,
        spread: { unit: settings().minBet, maxUnits: settings().betSpreadMax },
        seed,
      },
      STRATEGIES,
      (completed, total, strategy) => {
        const strategyIndex = strategy ? STRATEGIES.indexOf(strategy) : 0;
        if (strategyIndex > doneCount) doneCount = strategyIndex;
        const ratio = (doneCount + completed / total) / STRATEGIES.length;
        const fill = bar.querySelector('.progress-fill') as HTMLElement | null;
        const value = bar.querySelector('.progress-value') as HTMLElement | null;
        if (fill) fill.style.width = `${ratio * 100}%`;
        if (value) value.textContent = pct(ratio, 0);
      },
      (r) => {
        running = false;
        results = r;
        render();
        toast('ההשוואה הושלמה', 'good');
      },
      (message) => {
        running = false;
        toast(`שגיאה: ${message}`, 'bad');
        render();
      },
    );
  }

  render();
  const element = screen({ title: 'השוואת אסטרטגיות', showBack: true }, host);
  return { element, onUnmount: () => handle?.cancel() };
}
