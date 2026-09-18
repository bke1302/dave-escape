/** מאמן הימורים — גודל ההימור לפי ספירה אמיתית. */
import { compositionForCount, evAtTrueCount, trueCount, unitsForTrueCount, SPREAD_OPTIONS } from '../engine/counting.ts';
import { fullShoeComposition, roundExpectedValue } from '../engine/evEngine.ts';
import { createRng, randInt } from '../engine/rng.ts';
import { riskOfRuin } from '../engine/risk.ts';
import { accuracy, recordAnswer, rules, settings, state, updateSettings } from '../state/appState.ts';
import { h, money, pct, signedPct } from '../ui/dom.ts';
import { button, optionGrid, segmented } from '../ui/components/controls.ts';
import { answerBanner } from '../ui/components/feedbackUi.ts';
import { note, panel, screen, statTile } from '../ui/components/layout.ts';
import type { ScreenInstance } from '../ui/router.ts';

const rng = createRng();

export function bettingTrainerScreen(): ScreenInstance {
  const r = rules();
  const baseEv = roundExpectedValue(fullShoeComposition(r.decks), r);
  let running = randInt(rng, -8, 18);
  let decksRemaining = [1, 1.5, 2, 2.5, 3, 4, 5][Math.floor(rng() * 7)];
  let answered = false;
  let feedback: HTMLElement | null = null;
  let startedAt = Date.now();

  const host = h('div', { class: 'stack' });

  const nextExercise = (): void => {
    running = randInt(rng, -8, 18);
    decksRemaining = [1, 1.5, 2, 2.5, 3, 4, 5][Math.floor(rng() * 7)];
    answered = false;
    feedback = null;
    startedAt = Date.now();
    render();
  };

  const render = (): void => {
    const s = state();
    const spread = { unit: settings().minBet, maxUnits: settings().betSpreadMax };
    const tc = trueCount(running, decksRemaining);
    const correctUnits = unitsForTrueCount(tc, spread);
    const evLinear = evAtTrueCount(baseEv, tc);
    const evExact = roundExpectedValue(compositionForCount(decksRemaining, running), r);
    const sd = 1.15;
    const bankrollUnits = s.stats.bankroll / spread.unit;
    const ror = riskOfRuin({ bankrollUnits, evPerHand: evExact, sdPerHand: sd });

    const choices = [1, 2, 3, 4, 6, 8, 10, 12].filter((u) => u <= spread.maxUnits + 4);

    host.replaceChildren(
      h(
        'div',
        { class: 'grid grid-3' },
        statTile('תרגילים', String(s.stats.trainers.betting.attempts)),
        statTile('דיוק', pct(accuracy(s.stats.trainers.betting), 0)),
        statTile('פריסה', `1-${spread.maxUnits}`),
      ),
      panel(
        { title: 'כמה תהמר בסיבוב הבא?', icon: '💵' },
        h(
          'div',
          { class: 'row-center', style: { gap: '10px', padding: '4px 0' } },
          h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'ספירה רצה' }), h('span', { class: 'count-value', text: `${running > 0 ? '+' : ''}${running}` })),
          h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'חפיסות' }), h('span', { class: 'count-value', text: String(decksRemaining) })),
          h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'ספירה אמיתית' }), h('span', { class: 'count-value', text: `${tc > 0 ? '+' : ''}${tc}` })),
        ),
        answered && feedback
          ? feedback
          : optionGrid(
              choices.map((u) => ({ key: String(u), label: `${u} יחידות`, hint: money(u * spread.unit) })),
              (key, el) => {
                if (answered) return;
                answered = true;
                const value = Number(key);
                const correct = value === correctUnits;
                recordAnswer('betting', correct, Date.now() - startedAt);
                el.classList.add(correct ? 'correct' : 'wrong');
                feedback = h(
                  'div',
                  { class: 'stack' },
                  answerBanner(
                    correct,
                    correct ? `נכון — ${correctUnits} יחידות` : `לפי הרמפה: ${correctUnits} יחידות`,
                    `רמפת ההימורים: מספר יחידות = ספירה אמיתית פחות 1, בין 1 ל-${spread.maxUnits}. כאן: ${tc} ‎-1 → ${correctUnits}.`,
                  ),
                  h(
                    'div',
                    { class: 'grid grid-2' },
                    statTile('תוחלת בספירה זו', signedPct(evExact), 'חישוב מהרכב נעל משוער', evExact >= 0 ? 'good' : 'bad'),
                    statTile('קירוב ליניארי', signedPct(evLinear), '0.5% לנקודת ספירה'),
                    statTile('סטיית תקן ליד', `${sd.toFixed(2)} יח׳`, 'שונות גבוהה'),
                    statTile('סיכון חורבן', pct(ror, 1), `הון ${Math.round(bankrollUnits)} יחידות`, ror > 0.2 ? 'bad' : 'good'),
                  ),
                  h('p', { class: 'text-faint', text: 'התוחלת מחושבת מהרכב נעל שמתאים לספירה. זהו מודל — הרכב אמיתי יכול להיות שונה.' }),
                  button('תרגיל הבא', nextExercise, { tone: 'gold', wide: true }),
                );
                render();
              },
              4,
            ),
      ),
      panel(
        { title: 'פריסת הימורים', subtitle: 'מקסימום יחידות ביחס למינימום', icon: '📈' },
        segmented(
          SPREAD_OPTIONS.map((v) => ({ value: v, label: `1-${v}` })),
          settings().betSpreadMax,
          (value) => {
            updateSettings({ betSpreadMax: value });
            render();
          },
          'פריסת הימורים',
        ),
      ),
      note('פריסה רחבה מגדילה את התוחלת אך גם את השונות ואת הסיכון לתשומת לב. אין פריסה שמבטיחה רווח.'),
    );
  };

  render();
  const element = screen({ title: 'מאמן הימורים', subtitle: 'Bet Spread לפי True Count', showBack: true }, host);
  return { element };
}
