/** מסך ההסתברויות, יתרון הבית ותוחלת — כולל תרגול החלטות בין ההימורים. */
import { h, money, num, pct, signedPct } from '../../ui/dom.ts';
import { barChart } from '../../ui/components/charts.ts';
import { button, optionGrid, segmented } from '../../ui/components/controls.ts';
import { answerBanner } from '../../ui/components/feedbackUi.ts';
import { note, panel, screen, statTile } from '../../ui/components/layout.ts';
import type { ScreenInstance } from '../../ui/router.ts';
import { baccarat, baccaratAccuracy, recordBaccaratAnswer, updateBaccaratRules } from '../state.ts';
import { betMath, exactProbabilities } from '../engine/probability.ts';
import { TIE_PAYOUT_OPTIONS } from '../engine/rules.ts';
import { createRng } from '../../engine/rng.ts';

const rng = createRng();

interface ProbQuestion {
  prompt: string;
  options: { key: string; label: string }[];
  correctKey: string;
  explanation: string;
}

export function baccaratProbabilityScreen(): ScreenInstance {
  const host = h('div', { class: 'stack' });
  let question: ProbQuestion | null = null;
  let answered = false;
  let feedback: HTMLElement | null = null;
  let startedAt = Date.now();
  let betUnit = 100;

  const buildQuestion = (): ProbQuestion => {
    const b = baccarat();
    const math = betMath(b.rules);
    const player = math.find((m) => m.bet === 'player')!;
    const banker = math.find((m) => m.bet === 'banker')!;
    const tie = math.find((m) => m.bet === 'tie')!;
    const p = exactProbabilities(b.rules.decks);
    const pool: ProbQuestion[] = [
      {
        prompt: 'איזה הימור נושא את יתרון הבית הנמוך ביותר בחוקים הנוכחיים?',
        options: [
          { key: 'player', label: 'שחקן' },
          { key: 'banker', label: 'בנקאי' },
          { key: 'tie', label: 'תיקו' },
        ],
        correctKey: [player, banker, tie].sort((a, c) => a.houseEdge - c.houseEdge)[0].bet,
        explanation: `בנקאי ${pct(banker.houseEdge, 2)} · שחקן ${pct(player.houseEdge, 2)} · תיקו ${pct(tie.houseEdge, 2)}. גם אחרי העמלה, הבנקאי הוא בדרך כלל הזול ביותר.`,
      },
      {
        prompt: 'מהי בערך ההסתברות לתיקו?',
        options: [
          { key: 'a', label: '2%' },
          { key: 'b', label: '9.5%' },
          { key: 'c', label: '18%' },
          { key: 'd', label: '25%' },
        ],
        correctKey: 'b',
        explanation: `ההסתברות המדויקת בנעל של ${b.rules.decks} חפיסות היא ${pct(p.tie, 2)}.`,
      },
      {
        prompt: `הימרת ${money(betUnit)} על בנקאי וניצחת. כמה רווח נטו קיבלת?`,
        options:
          b.rules.commissionMode === 'commission'
            ? [
                { key: 'full', label: money(betUnit) },
                { key: 'comm', label: money(betUnit * (1 - b.rules.commissionRate)) },
                { key: 'half', label: money(betUnit / 2) },
                { key: 'double', label: money(betUnit * 2) },
              ]
            : [
                { key: 'comm', label: money(betUnit) },
                { key: 'half', label: money(betUnit / 2) },
                { key: 'full', label: money(betUnit * 1.5) },
                { key: 'double', label: money(betUnit * 2) },
              ],
        correctKey: 'comm',
        explanation:
          b.rules.commissionMode === 'commission'
            ? `בעמלה של ${(b.rules.commissionRate * 100).toFixed(0)}% הרווח הוא ${money(betUnit * (1 - b.rules.commissionRate))}.`
            : 'ללא עמלה התשלום מלא — אלא אם הבנקאי ניצח עם 6, ואז הוא חצי.',
      },
      {
        prompt: 'למה הבנקאי מנצח יותר מהשחקן?',
        options: [
          { key: 'a', label: 'כי הוא מקבל קלפים טובים יותר' },
          { key: 'b', label: 'כי הוא פועל אחרון ורואה את הקלף השלישי של השחקן' },
          { key: 'c', label: 'כי הקזינו מטה את הקלפים' },
          { key: 'd', label: 'זו טעות, ההסתברויות שוות' },
        ],
        correctKey: 'b',
        explanation: `בנקאי ${pct(p.banker, 2)} מול שחקן ${pct(p.player, 2)} — הפער נובע מחוקי הקלף השלישי שמעניקים לבנקאי מידע נוסף.`,
      },
    ];
    return pool[Math.floor(rng() * pool.length)];
  };

  const render = (): void => {
    const b = baccarat();
    const math = betMath(b.rules);
    const p = exactProbabilities(b.rules.decks);

    host.replaceChildren(
      panel(
        { title: 'ההסתברויות המדויקות', subtitle: `נעל של ${b.rules.decks} חפיסות`, icon: '📐' },
        h(
          'div',
          { class: 'grid grid-3' },
          statTile('בנקאי', pct(p.banker, 2), 'ניצחון'),
          statTile('שחקן', pct(p.player, 2), 'ניצחון'),
          statTile('תיקו', pct(p.tie, 2)),
        ),
        barChart(
          [
            { label: 'בנקאי', value: p.banker * 100, tone: 'neutral' },
            { label: 'שחקן', value: p.player * 100, tone: 'neutral' },
            { label: 'תיקו', value: p.tie * 100, tone: 'neutral' },
          ],
          (v) => `${v.toFixed(2)}%`,
        ),
        h('p', { class: 'text-faint', text: `Natural ב-${pct(p.natural, 1)} מהידיים · ממוצע ${p.averageCards.toFixed(2)} קלפים ליד` }),
      ),

      panel(
        { title: 'המתמטיקה של כל הימור', icon: '🏛️' },
        h(
          'div',
          { class: 'list-rows' },
          ...math.map((m) =>
            h(
              'div',
              { class: 'stack', style: { gap: '4px' } },
              h('div', { class: 'section-title', text: `${m.label} · ${m.payout}` }),
              h('div', { class: 'list-row' }, h('span', { text: 'הסתברות' }), h('span', { class: 'row-value', text: pct(m.probability, 2) })),
              h('div', { class: 'list-row' }, h('span', { text: 'תוחלת ליחידת הימור' }), h('span', { class: `row-value ${m.expectedValue >= 0 ? 'row-good' : 'row-bad'}`, text: signedPct(m.expectedValue) })),
              h('div', { class: 'list-row' }, h('span', { text: 'יתרון הבית' }), h('span', { class: 'row-value row-bad', text: pct(m.houseEdge, 2) })),
              h('div', { class: 'list-row' }, h('span', { text: 'יתרון הבית (ללא תיקו)' }), h('span', { class: 'row-value', text: pct(m.houseEdgeResolved, 2) })),
              h('div', { class: 'list-row' }, h('span', { text: 'סטיית תקן ליד' }), h('span', { class: 'row-value', text: m.standardDeviation.toFixed(3) })),
              h('div', { class: 'list-row' }, h('span', { text: `הפסד צפוי על ${money(betUnit)}` }), h('span', { class: 'row-value row-bad', text: money(m.houseEdge * betUnit) })),
            ),
          ),
        ),
        h('p', { class: 'text-faint', text: 'גודל הימור לחישוב' }),
        segmented(
          [10, 50, 100, 500].map((v) => ({ value: v, label: money(v) })),
          betUnit,
          (value) => {
            betUnit = value;
            render();
          },
          'גודל הימור',
        ),
      ),

      panel(
        { title: 'השפעת החוקים', subtitle: 'שנה ובדוק מיד', icon: '⚙️' },
        h('p', { class: 'text-faint', text: 'תשלום תיקו' }),
        segmented(
          TIE_PAYOUT_OPTIONS.map((v) => ({ value: v, label: `${v}:1` })),
          b.rules.tiePayout,
          (value) => {
            updateBaccaratRules({ tiePayout: value });
            render();
          },
          'תשלום תיקו',
        ),
        h('p', { class: 'text-faint', text: 'שיטת תשלום הבנקאי' }),
        segmented(
          [
            { value: 'commission', label: 'עמלה 5%' },
            { value: 'noCommission', label: 'ללא עמלה' },
          ],
          b.rules.commissionMode,
          (value) => {
            updateBaccaratRules({ commissionMode: value as 'commission' | 'noCommission' });
            render();
          },
          'שיטת תשלום',
        ),
      ),

      (() => {
        if (!question) {
          question = buildQuestion();
          answered = false;
          feedback = null;
          startedAt = Date.now();
        }
        const q = question;
        return panel(
          { title: 'תרגול הבנה', subtitle: q.prompt, icon: '🧠' },
          h('p', { class: 'text-faint', text: `דיוק בהסתברויות: ${pct(baccaratAccuracy(b.trainers.probability), 0)} · ${num(b.trainers.probability.attempts)} שאלות` }),
          answered && feedback
            ? feedback
            : optionGrid(
                q.options,
                (key, el) => {
                  if (answered) return;
                  answered = true;
                  const correct = key === q.correctKey;
                  recordBaccaratAnswer('probability', correct, Date.now() - startedAt);
                  el.classList.add(correct ? 'correct' : 'wrong');
                  feedback = h(
                    'div',
                    { class: 'stack' },
                    answerBanner(correct, correct ? 'נכון' : `לא נכון — ${q.options.find((o) => o.key === q.correctKey)?.label}`, q.explanation),
                    button('שאלה הבאה', () => {
                      question = null;
                      render();
                    }, { tone: 'gold', wide: true }),
                  );
                  render();
                },
                2,
              ),
        );
      })(),

      note('כל המספרים במסך הזה מחושבים על ידי מנוע האפליקציה: מעבר על כל צירופי הקלפים האפשריים ויישום חוקי הקלף השלישי. אין כאן מספרים שנכתבו מראש.', '🔬'),
      note('הבנת ההסתברויות משפרת החלטות אבל לא הופכת את יתרון הבית לחיובי. אין הימור או שיטה שמבטיחים רווח.', '⚖️'),
    );
  };

  render();
  return { element: screen({ title: 'הסתברויות ויתרון הבית', subtitle: 'המתמטיקה של באקרה', showBack: true }, host) };
}
