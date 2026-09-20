/** סימולטור מונטה קרלו לבאקרה + סימולציית מפגש. */
import { h, money, num, pct, signedPct } from '../../ui/dom.ts';
import { barChart, lineChart, progressBar } from '../../ui/components/charts.ts';
import { button, segmented, slider } from '../../ui/components/controls.ts';
import { toast } from '../../ui/components/feedbackUi.ts';
import { note, panel, screen, statTile } from '../../ui/components/layout.ts';
import type { ScreenInstance } from '../../ui/router.ts';
import { baccarat, updateBaccarat } from '../state.ts';
import { describeBaccaratRulesHe } from '../engine/rules.ts';
import { betMath } from '../engine/probability.ts';
import {
  BACCARAT_SIM_NOTE_HE,
  BET_CHOICE_LABEL_HE,
  METHOD_LABEL_HE,
  type BaccaratSimResult,
  type BetChoice,
  type BettingMethod,
} from '../engine/montecarlo.ts';
import { compareBaccaratAsync, runBaccaratAsync, type BaccaratRunHandle } from '../ui/simRunner.ts';

type Mode = 'monteCarlo' | 'session';

const HAND_OPTIONS = [10000, 100000, 1000000];
const COMPARE_BETS: BetChoice[] = ['player', 'banker', 'tie', 'random'];

export function baccaratSimulatorScreen(): ScreenInstance {
  let mode: Mode = 'monteCarlo';
  let hands = 10000;
  let bet: BetChoice = 'banker';
  let method: BettingMethod = 'flat';
  let sessionHands = 200;
  let running = false;
  let handle: BaccaratRunHandle | null = null;
  let result: BaccaratSimResult | null = null;
  let comparison: BaccaratSimResult[] = [];

  const controlsHost = h('div', { class: 'stack' });
  const progressHost = h('div', { class: 'stack' });
  const resultHost = h('div', { class: 'stack' });

  const saveSummary = (r: BaccaratSimResult): void => {
    updateBaccarat((s) => ({
      simulations: [
        {
          at: Date.now(),
          bet: BET_CHOICE_LABEL_HE[r.bet],
          method: METHOD_LABEL_HE[r.method],
          hands: r.hands,
          houseEdge: r.houseEdge,
          profit: r.profit,
        },
        ...s.simulations,
      ].slice(0, 20),
    }));
  };

  const resultPanel = (r: BaccaratSimResult): HTMLElement =>
    panel(
      { title: 'תוצאות', subtitle: `${BET_CHOICE_LABEL_HE[r.bet]} · ${METHOD_LABEL_HE[r.method]} · ${num(r.hands)} ידיים`, icon: '📈' },
      h(
        'div',
        { class: 'grid grid-2' },
        statTile('סה״כ ידיים', num(r.hands)),
        statTile('ניצחונות', num(r.wins), pct(r.winRate, 1), 'good'),
        statTile('הפסדים', num(r.losses), pct(r.lossRate, 1), 'bad'),
        statTile('תיקו (החזר)', num(r.pushes), pct(r.tieRate, 1)),
        statTile('תוצאות שחקן', num(r.playerResults)),
        statTile('תוצאות בנקאי', num(r.bankerResults)),
        statTile('הימור ממוצע', money(r.averageBet)),
        statTile('סה״כ הוהמר', money(r.totalWagered)),
        statTile('רווח/הפסד', money(r.profit), undefined, r.profit >= 0 ? 'good' : 'bad'),
        statTile('ROI', signedPct(r.roi), 'ביחס לכסף שהוהמר', r.roi >= 0 ? 'good' : 'bad'),
        statTile('תוחלת ליד', signedPct(r.evPerHandUnits), 'ביחידות הימור', r.evPerHandUnits >= 0 ? 'good' : 'bad'),
        statTile('יתרון הבית שנמדד', pct(r.houseEdge, 3), undefined, r.houseEdge > 0 ? 'bad' : 'good'),
        statTile('שונות ליד', num(r.variancePerHand, 3)),
        statTile('סטיית תקן', r.sdPerHand.toFixed(3)),
        statTile('ירידת שיא', money(r.maxDrawdown), 'Max Drawdown', 'bad'),
        statTile('רצף הפסדים', num(r.longestLoseStreak), undefined, 'bad'),
        statTile('רצף ניצחונות', num(r.longestWinStreak), undefined, 'good'),
        statTile('ערבובים', num(r.shuffles)),
      ),
      lineChart(r.bankrollSamples, { label: 'הון לאורך הסימולציה' }),
      h('p', { class: 'text-faint', text: `חוקים: ${r.rulesSummary} · זמן ריצה ${(r.elapsedMs / 1000).toFixed(1)} שניות` }),
    );

  const sessionPanel = (r: BaccaratSimResult): HTMLElement =>
    panel(
      { title: 'סיכום המפגש', icon: '🎬' },
      h(
        'div',
        { class: 'grid grid-2' },
        statTile('הון התחלתי', money(r.startingBankroll)),
        statTile('הון סופי', money(r.endingBankroll), undefined, r.endingBankroll >= r.startingBankroll ? 'good' : 'bad'),
        statTile('רווח/הפסד', money(r.profit), undefined, r.profit >= 0 ? 'good' : 'bad'),
        statTile('ROI', signedPct(r.roi)),
        statTile('ירידת שיא', money(r.maxDrawdown), undefined, 'bad'),
        statTile('רצף הפסדים ארוך', num(r.longestLoseStreak), undefined, 'bad'),
        statTile('ידיים', num(r.hands)),
        statTile('שיא הון', money(r.peakBankroll)),
      ),
      r.ruined ? note('ההון התאפס לפני סוף המפגש — זו בדיוק הסכנה של שיטות פרוגרסיביות.', '⚠️') : null,
      lineChart(r.bankrollSamples, { label: 'הון במהלך המפגש' }),
    );

  const start = (): void => {
    if (running) return;
    const b = baccarat();
    running = true;
    result = null;
    comparison = [];
    resultHost.replaceChildren();
    const bar = progressBar(0, 'מריץ סימולציה', '0%');
    progressHost.replaceChildren(panel({ title: 'מריץ...', icon: '⏳' }, bar));
    const updateBar = (completed: number, total: number): void => {
      const ratio = completed / total;
      const fill = bar.querySelector('.progress-fill') as HTMLElement | null;
      const value = bar.querySelector('.progress-value') as HTMLElement | null;
      if (fill) fill.style.width = `${ratio * 100}%`;
      if (value) value.textContent = pct(ratio, 0);
    };

    handle = runBaccaratAsync(
      {
        hands: mode === 'session' ? sessionHands : hands,
        rules: b.rules,
        bet,
        method,
        baseBet: b.minBet,
        maxBet: b.maxBet,
        bankroll: b.startingBankroll,
        seed: Math.floor(Math.random() * 1e9),
        stopOnRuin: mode === 'session',
      },
      updateBar,
      (r) => {
        running = false;
        result = r;
        saveSummary(r);
        progressHost.replaceChildren();
        resultHost.replaceChildren(mode === 'session' ? sessionPanel(r) : resultPanel(r), note(BACCARAT_SIM_NOTE_HE, '📏'));
        render();
        toast('הסימולציה הושלמה', 'good');
      },
      (message) => {
        running = false;
        progressHost.replaceChildren();
        toast(`שגיאה: ${message}`, 'bad');
        render();
      },
    );
    render();
  };

  const startComparison = (): void => {
    if (running) return;
    const b = baccarat();
    running = true;
    result = null;
    comparison = [];
    resultHost.replaceChildren();
    const bar = progressBar(0, 'משווה הימורים', '0%');
    progressHost.replaceChildren(panel({ title: 'מריץ השוואה...', icon: '⚖️' }, bar));
    let doneCount = 0;

    handle = compareBaccaratAsync(
      {
        hands,
        rules: b.rules,
        method: 'flat',
        baseBet: b.minBet,
        maxBet: b.maxBet,
        bankroll: b.startingBankroll,
        seed: Math.floor(Math.random() * 1e9),
      },
      COMPARE_BETS,
      (completed, total, current) => {
        const index = current ? COMPARE_BETS.indexOf(current) : 0;
        if (index > doneCount) doneCount = index;
        const ratio = (doneCount + completed / total) / COMPARE_BETS.length;
        const fill = bar.querySelector('.progress-fill') as HTMLElement | null;
        const value = bar.querySelector('.progress-value') as HTMLElement | null;
        if (fill) fill.style.width = `${ratio * 100}%`;
        if (value) value.textContent = pct(ratio, 0);
      },
      (results) => {
        running = false;
        comparison = results;
        progressHost.replaceChildren();
        const exact = betMath(baccarat().rules);
        resultHost.replaceChildren(
          panel(
            { title: 'השוואת הימורים', subtitle: `${num(hands)} ידיים · אותה סדרת קלפים לכל ההימורים`, icon: '⚖️' },
            barChart(
              results.map((r) => ({ label: BET_CHOICE_LABEL_HE[r.bet], value: -r.houseEdge * 100 })),
              (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`,
            ),
            h(
              'div',
              { class: 'list-rows' },
              ...results.map((r) => {
                const reference = exact.find((m) => m.bet === r.bet);
                return h(
                  'div',
                  { class: 'list-row' },
                  h('span', { text: BET_CHOICE_LABEL_HE[r.bet] }),
                  h('span', {
                    class: `row-value ${r.profit >= 0 ? 'row-good' : 'row-bad'}`,
                    text: `${money(r.profit)} · ${pct(r.houseEdge, 2)}${reference ? ` (חישוב: ${pct(reference.houseEdge, 2)})` : ''}`,
                  }),
                );
              }),
            ),
            h('p', { class: 'text-faint', text: 'העמודות מציגות את התוחלת שנמדדה — ככל שיש יותר ידיים, היא מתקרבת לחישוב המדויק.' }),
          ),
          note(BACCARAT_SIM_NOTE_HE, '📏'),
        );
        render();
      },
      (message) => {
        running = false;
        toast(`שגיאה: ${message}`, 'bad');
        render();
      },
    );
    render();
  };

  const render = (): void => {
    const b = baccarat();
    controlsHost.replaceChildren(
      segmented(
        [
          { value: 'monteCarlo', label: 'מונטה קרלו' },
          { value: 'session', label: 'סימולציית מפגש' },
        ],
        mode,
        (value) => {
          mode = value as Mode;
          render();
        },
        'סוג סימולציה',
      ),
      panel(
        { title: 'הגדרות', subtitle: describeBaccaratRulesHe(b.rules), icon: '⚙️' },
        ...(mode === 'monteCarlo'
          ? [
              h('p', { class: 'text-faint', text: 'מספר ידיים' }),
              segmented(HAND_OPTIONS.map((v) => ({ value: v, label: num(v) })), hands, (value) => {
                hands = value;
                render();
              }, 'מספר ידיים'),
            ]
          : [
              slider('מספר ידיים במפגש', sessionHands, 50, 2000, 50, (v) => {
                sessionHands = v;
              }, (v) => num(v)),
            ]),
        h('p', { class: 'text-faint', text: 'הימור' }),
        segmented(
          (['player', 'banker', 'tie', 'random', 'alternate'] as BetChoice[]).map((v) => ({ value: v, label: BET_CHOICE_LABEL_HE[v] })),
          bet,
          (value) => {
            bet = value as BetChoice;
            render();
          },
          'הימור',
        ),
        h('p', { class: 'text-faint', text: 'שיטת הימור' }),
        segmented(
          (['flat', 'martingale', 'dalembert', 'fibonacci', 'paroli'] as BettingMethod[]).map((v) => ({ value: v, label: METHOD_LABEL_HE[v] })),
          method,
          (value) => {
            method = value as BettingMethod;
            render();
          },
          'שיטת הימור',
        ),
        h(
          'div',
          { class: 'grid grid-3' },
          statTile('יחידת הימור', money(b.minBet)),
          statTile('הימור מרבי', money(b.maxBet)),
          statTile('הון התחלתי', money(b.startingBankroll)),
        ),
        button(running ? 'מריץ...' : mode === 'session' ? 'הרץ מפגש' : 'הרץ סימולציה', start, { tone: 'gold', wide: true, disabled: running }),
        mode === 'monteCarlo'
          ? button('השווה בין ההימורים', startComparison, { tone: 'ghost', wide: true, disabled: running })
          : null,
      ),
      ...(b.simulations.length
        ? [panel(
            { title: 'סימולציות אחרונות', icon: '🗂️' },
            h(
              'div',
              { class: 'list-rows' },
              ...b.simulations.slice(0, 5).map((sim) =>
                h(
                  'div',
                  { class: 'list-row' },
                  h('span', { text: `${sim.bet} · ${num(sim.hands)}` }),
                  h('span', { class: `row-value ${sim.profit >= 0 ? 'row-good' : 'row-bad'}`, text: `${money(sim.profit)} · ${pct(sim.houseEdge, 2)}` }),
                ),
              ),
            ),
          )]
        : []),
    );
    if (result && !comparison.length) {
      // התוצאה כבר מוצגת ב-resultHost
    }
  };

  render();
  const element = screen(
    { title: 'סימולטור באקרה', subtitle: 'מונטה קרלו על מנוע המשחק', showBack: true },
    controlsHost,
    progressHost,
    resultHost,
  );
  return { element, onUnmount: () => handle?.cancel() };
}
