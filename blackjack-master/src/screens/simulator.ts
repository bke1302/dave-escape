/** סימולטור מונטה קרלו. */
import { SIM_DISCLAIMER_HE, STRATEGY_LABEL_HE, type SimResult, type SimStrategy } from '../engine/montecarlo.ts';
import { describeRulesHe } from '../engine/rules.ts';
import { riskOfRuin } from '../engine/risk.ts';
import { rules, settings, state, updateStats } from '../state/appState.ts';
import { h, money, num, pct, signedPct } from '../ui/dom.ts';
import { lineChart, progressBar } from '../ui/components/charts.ts';
import { button, segmented } from '../ui/components/controls.ts';
import { toast } from '../ui/components/feedbackUi.ts';
import { note, panel, screen, statTile } from '../ui/components/layout.ts';
import { navigate, type ScreenInstance } from '../ui/router.ts';
import { runSimulationAsync, type RunHandle } from '../ui/simRunner.ts';

const HAND_OPTIONS = [10000, 100000, 1000000];

export function simulatorScreen(): ScreenInstance {
  let hands = 10000;
  let strategy: SimStrategy = 'basic';
  let running = false;
  let handle: RunHandle | null = null;
  let result: SimResult | null = null;

  const progressHost = h('div', { class: 'stack' });
  const resultHost = h('div', { class: 'stack' });

  const renderResult = (): void => {
    resultHost.replaceChildren();
    if (!result) return;
    const r = result;
    const evPct = r.evPerHandUnits;

    resultHost.append(
      panel(
        { title: 'תוצאות הסימולציה', subtitle: `${STRATEGY_LABEL_HE[r.config.strategy]} · ${num(r.totalRounds)} סיבובים`, icon: '📈' },
        h(
          'div',
          { class: 'grid grid-2' },
          statTile('סה״כ ידיים', num(r.totalHands)),
          statTile('סיבובים', num(r.totalRounds)),
          statTile('אחוז ניצחון', pct(r.winRate, 1), 'מתוך ידיים', 'good'),
          statTile('אחוז הפסד', pct(r.lossRate, 1), 'מתוך ידיים', 'bad'),
          statTile('אחוז תיקו', pct(r.pushRate, 1)),
          statTile('אחוז בלאק ג׳ק', pct(r.blackjackRate, 2)),
          statTile('הימור ממוצע', money(r.averageBet)),
          statTile('סה״כ הוהמר', money(r.totalWagered)),
          statTile('רווח/הפסד', money(r.totalProfit), undefined, r.totalProfit >= 0 ? 'good' : 'bad'),
          statTile('תוחלת ליד', signedPct(evPct), 'ביחידת הימור', evPct >= 0 ? 'good' : 'bad'),
          statTile(
            'יתרון הבית',
            r.houseEdge >= 0 ? pct(r.houseEdge, 2) : `שחקן ${pct(-r.houseEdge, 2)}`,
            'ביחס לכסף שהוהמר',
            r.houseEdge > 0 ? 'bad' : 'good',
          ),
          statTile('שונות ליד', num(r.variancePerHand, 3)),
          statTile('סטיית תקן', `${r.sdPerHand.toFixed(3)} יח׳`),
          statTile('ירידת שיא', money(r.maxDrawdown), 'Max Drawdown', 'bad'),
          statTile('רצף הפסדים', num(r.longestLoseStreak), 'סיבובים', 'bad'),
          statTile('רצף ניצחונות', num(r.longestWinStreak), 'סיבובים', 'good'),
          statTile('סיכון חורבן', pct(r.riskOfRuin, 2), 'לפי התוצאות שנמדדו', r.riskOfRuin > 0.2 ? 'bad' : 'good'),
          statTile('ערבובים', num(r.shuffles)),
        ),
      ),
      panel({ title: 'מהלך ההון', icon: '💹' }, lineChart(r.bankrollSamples, { label: 'הון לאורך הסימולציה' })),
      panel(
        { title: 'איך המספרים חושבו', icon: '🔬' },
        h('p', { class: 'text-dim', text: `הסימולציה הריצה ${num(r.totalRounds)} סיבובים במנוע המשחק עצמו — אותה נעל, אותם חוקים ואותה לוגיקת דילר כמו במסך המשחק. אין כאן מספרים שנכתבו מראש.` }),
        h('p', { class: 'text-faint', text: `חוקים: ${r.config.rulesSummary} · זרע אקראי: ${r.config.seed ?? '—'} · זמן ריצה: ${(r.elapsedMs / 1000).toFixed(1)} שניות` }),
        h('p', { class: 'text-faint', text: `סיכון החורבן חושב מהתוחלת ומסטיית התקן שנמדדו, בהנחת הימור קבוע והון של ${num(r.config.bankroll / r.config.baseBet)} יחידות.` }),
      ),
      note(SIM_DISCLAIMER_HE, '⚖️'),
    );
  };

  const start = (): void => {
    if (running) return;
    running = true;
    result = null;
    renderResult();
    const seed = Math.floor(Math.random() * 1e9);
    const bar = progressBar(0, 'מריץ סימולציה', '0%');
    progressHost.replaceChildren(
      panel(
        { title: 'מריץ...', subtitle: `${num(hands)} ידיים · ${STRATEGY_LABEL_HE[strategy]}`, icon: '⏳' },
        bar,
        button('עצור', () => {
          handle?.cancel();
          running = false;
          progressHost.replaceChildren();
          render();
        }, { tone: 'ghost', wide: true }),
      ),
    );

    handle = runSimulationAsync(
      {
        hands,
        rules: rules(),
        strategy,
        baseBet: settings().minBet,
        bankroll: settings().startingBankroll,
        spread: { unit: settings().minBet, maxUnits: settings().betSpreadMax },
        seed,
      },
      (completed, total) => {
        const ratio = completed / total;
        const fill = bar.querySelector('.progress-fill') as HTMLElement | null;
        const value = bar.querySelector('.progress-value') as HTMLElement | null;
        if (fill) fill.style.width = `${ratio * 100}%`;
        if (value) value.textContent = pct(ratio, 0);
      },
      (r) => {
        running = false;
        result = r;
        progressHost.replaceChildren();
        updateStats((s) => ({
          simulations: [
            {
              at: Date.now(),
              strategy: STRATEGY_LABEL_HE[r.config.strategy],
              hands: r.totalRounds,
              edge: r.edgeOnWagered,
              profit: r.totalProfit,
              rules: r.config.rulesSummary,
            },
            ...s.simulations,
          ].slice(0, 20),
        }));
        renderResult();
        render();
        toast('הסימולציה הושלמה', 'good');
      },
      (message) => {
        running = false;
        progressHost.replaceChildren();
        toast(`שגיאה בסימולציה: ${message}`, 'bad');
        render();
      },
    );
    render();
  };

  const controlsHost = h('div', { class: 'stack' });
  const render = (): void => {
    const previous = state().stats.simulations;
    controlsHost.replaceChildren(
      panel(
        { title: 'הגדרות סימולציה', subtitle: describeRulesHe(rules()), icon: '⚙️' },
        h('p', { class: 'text-faint', text: 'מספר ידיים' }),
        segmented(
          HAND_OPTIONS.map((v) => ({ value: v, label: num(v) })),
          hands,
          (value) => {
            hands = value;
            render();
          },
          'מספר ידיים',
        ),
        h('p', { class: 'text-faint', text: 'אסטרטגיה' }),
        segmented(
          (['random', 'basic', 'counting', 'countingDeviations'] as SimStrategy[]).map((v) => ({
            value: v,
            label: STRATEGY_LABEL_HE[v],
          })),
          strategy,
          (value) => {
            strategy = value as SimStrategy;
            render();
          },
          'אסטרטגיה',
        ),
        h(
          'div',
          { class: 'grid grid-3' },
          statTile('יחידת הימור', money(settings().minBet)),
          statTile('הון התחלתי', money(settings().startingBankroll)),
          statTile('פריסה', `1-${settings().betSpreadMax}`),
        ),
        button(running ? 'מריץ...' : 'הרץ סימולציה', start, { tone: 'gold', wide: true, disabled: running }),
        button('השוואת אסטרטגיות', () => navigate('/compare'), { tone: 'ghost', wide: true }),
      ),
      ...(previous.length
        ? [panel(
            { title: 'סימולציות אחרונות', icon: '🗂️' },
            h(
              'div',
              { class: 'list-rows' },
              ...previous.slice(0, 5).map((sim) =>
                h(
                  'div',
                  { class: 'list-row' },
                  h('span', { text: `${sim.strategy} · ${num(sim.hands)} ידיים` }),
                  h('span', { class: `row-value ${sim.edge >= 0 ? 'row-good' : 'row-bad'}`, text: signedPct(sim.edge) }),
                ),
              ),
            ),
          )]
        : []),
    );
  };

  render();

  const element = screen(
    { title: 'סימולטור', subtitle: 'מונטה קרלו על מנוע המשחק', showBack: true },
    controlsHost,
    progressHost,
    resultHost,
  );

  return { element, onUnmount: () => handle?.cancel() };
}
