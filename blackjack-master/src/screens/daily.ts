/** אימון יומי — חמש תחנות קצרות. */
import { buildShoeCards, hiLoValue, rankValue, type Card } from '../engine/cards.ts';
import { ACTION_LABEL_HE, decide } from '../engine/basicStrategy.ts';
import { runningCount, trueCount, unitsForTrueCount } from '../engine/counting.ts';
import { DEVIATIONS, actionForDeviation } from '../engine/deviations.ts';
import { handValue, isPair } from '../engine/hand.ts';
import { createRng, fisherYatesShuffle, randInt } from '../engine/rng.ts';
import { recordAnswer, rules, settings, state, todayKey, updateProgress, type TrainerDomain } from '../state/appState.ts';
import { h, num, pct } from '../ui/dom.ts';
import { button, optionGrid } from '../ui/components/controls.ts';
import { answerBanner, toast } from '../ui/components/feedbackUi.ts';
import { cardView } from '../ui/components/playingCard.ts';
import { progressBar } from '../ui/components/charts.ts';
import { note, panel, screen, statTile } from '../ui/components/layout.ts';
import type { ScreenInstance } from '../ui/router.ts';

const rng = createRng();
const QUESTIONS_PER_SEGMENT = 5;

interface Question {
  prompt: string;
  visual?: HTMLElement;
  options: { key: string; label: string }[];
  correctKey: string;
  explanation: string;
  domain: TrainerDomain;
}

interface Segment {
  id: string;
  title: string;
  icon: string;
  description: string;
  build: () => Question;
}

function numberOptions(correct: number, spread: number = 3): { key: string; label: string }[] {
  const set = new Set<number>([correct]);
  while (set.size < 4) set.add(correct + randInt(rng, -spread, spread));
  return [...set].sort((a, b) => a - b).map((v) => ({ key: String(v), label: `${v > 0 ? '+' : ''}${v}` }));
}

function cardsRow(cards: Card[]): HTMLElement {
  return h('div', { class: 'row-center', style: { gap: '5px', padding: '6px 0' } }, ...cards.map((c) => cardView(c, { small: true })));
}

function strategyQuestion(): Question {
  const r = rules();
  const cards = fisherYatesShuffle(buildShoeCards(1), rng);
  const player = [cards[0], cards[1]];
  const dealer = cards[2];
  const decision = decide(player, dealer, r, {
    canDouble: true,
    canSplit: isPair(player),
    canSurrender: r.surrender === 'late',
  });
  const hv = handValue(player);
  const options = ['hit', 'stand', 'double', ...(isPair(player) ? ['split'] : []), ...(r.surrender === 'late' ? ['surrender'] : [])];
  return {
    prompt: `היד שלך ${hv.soft ? `רכה ${hv.total}` : hv.total} מול ${dealer.rank === 'A' ? 'אס' : rankValue(dealer.rank)} — מה הפעולה?`,
    visual: cardsRow([...player, dealer]),
    options: options.map((a) => ({ key: a, label: ACTION_LABEL_HE[a as keyof typeof ACTION_LABEL_HE] })),
    correctKey: decision.action,
    explanation: decision.explanation,
    domain: 'strategy',
  };
}

function runningCountQuestion(): Question {
  const cards = fisherYatesShuffle(buildShoeCards(1), rng).slice(0, 6);
  const rc = runningCount(cards);
  return {
    prompt: 'מה הספירה הרצה של הקלפים האלה?',
    visual: cardsRow(cards),
    options: numberOptions(rc),
    correctKey: String(rc),
    explanation: `פירוט: ${cards.map((c) => `${c.rank} (${hiLoValue(c.rank) > 0 ? '+' : ''}${hiLoValue(c.rank)})`).join(' · ')}`,
    domain: 'runningCount',
  };
}

function trueCountQuestion(): Question {
  const rc = randInt(rng, -10, 16);
  const decks = [1, 1.5, 2, 2.5, 3, 4][Math.floor(rng() * 6)];
  const tc = trueCount(rc, decks);
  return {
    prompt: `ספירה רצה ${rc > 0 ? '+' : ''}${rc}, נותרו ${decks} חפיסות. מהי הספירה האמיתית?`,
    options: numberOptions(tc, 2),
    correctKey: String(tc),
    explanation: `${rc} ÷ ${decks} = ${(rc / decks).toFixed(2)} → מעוגל כלפי מטה: ${tc}.`,
    domain: 'trueCount',
  };
}

function decisionQuestion(): Question {
  const playable = DEVIATIONS.filter((d) => d.group !== 'insurance');
  const dev = playable[Math.floor(rng() * playable.length)];
  const tc = randInt(rng, dev.index - 2, dev.index + 2);
  const correct = actionForDeviation(dev, tc);
  const options = [...new Set([dev.basicAction, dev.deviationAction, 'hit', 'stand'])].slice(0, 4);
  return {
    prompt: `${dev.handLabel} · ספירה אמיתית ${tc > 0 ? '+' : ''}${tc} — מה הפעולה?`,
    options: options.map((a) => ({ key: a, label: ACTION_LABEL_HE[a as keyof typeof ACTION_LABEL_HE] })),
    correctKey: correct,
    explanation: `${dev.note} האינדקס: ${dev.index >= 0 ? '+' : ''}${dev.index}.`,
    domain: 'deviations',
  };
}

function casinoQuestion(): Question {
  const rc = randInt(rng, -6, 14);
  const decks = [1, 1.5, 2, 3, 4, 5][Math.floor(rng() * 6)];
  const tc = trueCount(rc, decks);
  const spread = { unit: settings().minBet, maxUnits: settings().betSpreadMax };
  const units = unitsForTrueCount(tc, spread);
  const set = new Set<number>([units]);
  while (set.size < 4) set.add(Math.max(1, units + randInt(rng, -3, 4)));
  return {
    prompt: `סיום סיבוב: ספירה רצה ${rc > 0 ? '+' : ''}${rc}, ${decks} חפיסות נותרו. כמה תהמר בסיבוב הבא?`,
    options: [...set].sort((a, b) => a - b).map((u) => ({ key: String(u), label: `${u} יחידות` })),
    correctKey: String(units),
    explanation: `ספירה אמיתית ${tc > 0 ? '+' : ''}${tc} → לפי הרמפה (TC פחות 1, מקסימום ${spread.maxUnits}) ההימור הוא ${units} יחידות.`,
    domain: 'betting',
  };
}

const SEGMENTS: Segment[] = [
  { id: 'strategy', title: 'אסטרטגיה בסיסית', icon: '🧠', description: '5 החלטות יד', build: strategyQuestion },
  { id: 'running', title: 'ספירה רצה', icon: '🔢', description: '5 רצפי קלפים', build: runningCountQuestion },
  { id: 'true', title: 'ספירה אמיתית', icon: '➗', description: '5 חישובי True Count', build: trueCountQuestion },
  { id: 'decision', title: 'קבלת החלטות', icon: '🎯', description: '5 סטיות לפי ספירה', build: decisionQuestion },
  { id: 'casino', title: 'סימולציית קזינו', icon: '🎰', description: '5 החלטות הימור', build: casinoQuestion },
];

export function dailyScreen(): ScreenInstance {
  const today = todayKey();
  if (state().progress.daily.date !== today) {
    updateProgress((p) => ({ daily: { ...p.daily, date: today, segments: {} } }));
  }

  let activeSegment: Segment | null = null;
  let question: Question | null = null;
  let index = 0;
  let correctCount = 0;
  let answered = false;
  let feedback: HTMLElement | null = null;

  const host = h('div', { class: 'stack' });

  const finishSegment = (): void => {
    const seg = activeSegment;
    if (!seg) return;
    updateProgress((p) => {
      const segments = {
        ...p.daily.segments,
        [seg.id]: { done: true, correct: correctCount, attempts: QUESTIONS_PER_SEGMENT },
      };
      const allDone = SEGMENTS.every((x) => segments[x.id]?.done);
      let { streak, lastCompletedDate, bestScore, history } = p.daily;
      if (allDone && lastCompletedDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streak = lastCompletedDate === yesterday ? streak + 1 : 1;
        lastCompletedDate = today;
        const totalCorrect = SEGMENTS.reduce((sum, x) => sum + (segments[x.id]?.correct ?? 0), 0);
        const score = Math.round((totalCorrect / (SEGMENTS.length * QUESTIONS_PER_SEGMENT)) * 100);
        bestScore = Math.max(bestScore, score);
        history = [...history, { date: today, score, accuracy: score / 100 }].slice(-30);
        toast(`האימון היומי הושלם! רצף: ${streak} ימים`, 'good');
      }
      return { daily: { ...p.daily, segments, streak, lastCompletedDate, bestScore, history } };
    });
    activeSegment = null;
    question = null;
    render();
  };

  const nextQuestion = (): void => {
    if (!activeSegment) return;
    if (index >= QUESTIONS_PER_SEGMENT) {
      finishSegment();
      return;
    }
    question = activeSegment.build();
    answered = false;
    feedback = null;
    render();
  };

  const startSegment = (segment: Segment): void => {
    activeSegment = segment;
    index = 0;
    correctCount = 0;
    nextQuestion();
  };

  const render = (): void => {
    const s = state();
    const daily = s.progress.daily;
    const doneCount = SEGMENTS.filter((x) => daily.segments[x.id]?.done).length;

    if (activeSegment && question) {
      const q = question;
      host.replaceChildren(
        panel(
          { title: `${activeSegment.title} · שאלה ${index + 1}/${QUESTIONS_PER_SEGMENT}`, subtitle: q.prompt, icon: activeSegment.icon },
          q.visual ?? null,
          answered && feedback
            ? feedback
            : optionGrid(
                q.options,
                (key, el) => {
                  if (answered) return;
                  answered = true;
                  const correct = key === q.correctKey;
                  if (correct) correctCount++;
                  recordAnswer(q.domain, correct);
                  el.classList.add(correct ? 'correct' : 'wrong');
                  feedback = h(
                    'div',
                    { class: 'stack' },
                    answerBanner(
                      correct,
                      correct ? 'נכון' : `לא נכון — התשובה: ${q.options.find((o) => o.key === q.correctKey)?.label ?? q.correctKey}`,
                      q.explanation,
                    ),
                    button(index + 1 >= QUESTIONS_PER_SEGMENT ? 'סיים תחנה' : 'שאלה הבאה', () => {
                      index++;
                      nextQuestion();
                    }, { tone: 'gold', wide: true }),
                  );
                  render();
                },
                q.options.length > 2 ? 2 : 1,
              ),
          button('צא מהתחנה', () => {
            activeSegment = null;
            question = null;
            render();
          }, { tone: 'ghost', wide: true }),
        ),
      );
      return;
    }

    host.replaceChildren(
      panel(
        { title: 'האימון היומי שלך', subtitle: `${doneCount}/${SEGMENTS.length} תחנות הושלמו היום`, icon: '📅' },
        progressBar(doneCount / SEGMENTS.length, 'התקדמות היום', pct(doneCount / SEGMENTS.length, 0)),
        h(
          'div',
          { class: 'grid grid-3' },
          statTile('רצף ימים', num(daily.streak)),
          statTile('ציון שיא', `${daily.bestScore}%`),
          statTile('ימים באימון', num(daily.history.length)),
        ),
      ),
      ...SEGMENTS.map((segment) => {
        const segState = daily.segments[segment.id];
        return panel(
          {
            title: segment.title,
            subtitle: segState?.done ? `הושלם · ${segState.correct}/${segState.attempts} נכונות` : segment.description,
            icon: segState?.done ? '✅' : segment.icon,
            onClick: () => startSegment(segment),
          },
        );
      }),
      daily.history.length
        ? panel(
            { title: 'שיפור לאורך זמן', icon: '📈' },
            h(
              'div',
              { class: 'list-rows' },
              ...daily.history.slice(-7).reverse().map((entry) =>
                h('div', { class: 'list-row' }, h('span', { text: entry.date }), h('span', { class: 'row-value', text: `${entry.score}%` })),
              ),
            ),
          )
        : note('השלם את כל חמש התחנות כדי לפתוח רצף יומי ולעקוב אחרי השיפור שלך.'),
    );
  };

  render();
  const element = screen({ title: 'אימון יומי', subtitle: '5 תחנות · כ-25 דקות', showBack: true }, host);
  return { element };
}
