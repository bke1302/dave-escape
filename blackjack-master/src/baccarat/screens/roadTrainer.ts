/** מאמן קריאת לוחות — זיהוי רצפים, תיקו ושינויי תוצאה. */
import { createRng, randInt } from '../../engine/rng.ts';
import { h, num, pct } from '../../ui/dom.ts';
import { button, optionGrid } from '../../ui/components/controls.ts';
import { answerBanner } from '../../ui/components/feedbackUi.ts';
import { note, panel, screen, statTile } from '../../ui/components/layout.ts';
import type { ScreenInstance } from '../../ui/router.ts';
import { adaptiveHint, baccarat, baccaratAccuracy, recordBaccaratAnswer } from '../state.ts';
import type { Outcome } from '../engine/game.ts';
import { summarize } from '../engine/road.ts';
import { beadPlateView, bigRoadView, roadLegend } from '../ui/roadView.ts';

const rng = createRng();

type QuestionKind = 'streak' | 'newColumn' | 'ties' | 'longest' | 'prediction';

interface RoadQuestion {
  kind: QuestionKind;
  prompt: string;
  options: { key: string; label: string }[];
  correctKey: string;
  explanation: string;
}

/** מייצר היסטוריה אקראית — בדיוק כפי שהיא נוצרת בשולחן אמיתי. */
function randomHistory(length: number): Outcome[] {
  const history: Outcome[] = [];
  for (let i = 0; i < length; i++) {
    const roll = rng();
    // שיעורים מקורבים למציאות: בנקאי 45.9% · שחקן 44.6% · תיקו 9.5%
    history.push(roll < 0.459 ? 'banker' : roll < 0.905 ? 'player' : 'tie');
  }
  return history;
}

function numberOptions(correct: number, spread: number): { key: string; label: string }[] {
  const set = new Set<number>([correct]);
  while (set.size < 4) set.add(Math.max(0, correct + randInt(rng, -spread, spread)));
  return [...set].sort((a, b) => a - b).map((v) => ({ key: String(v), label: String(v) }));
}

function buildQuestion(history: Outcome[], difficulty: number): RoadQuestion {
  const s = summarize(history);
  const kinds: QuestionKind[] = difficulty >= 2 ? ['streak', 'newColumn', 'ties', 'longest', 'prediction'] : ['streak', 'ties', 'prediction'];
  const kind = kinds[Math.floor(rng() * kinds.length)];

  if (kind === 'streak') {
    return {
      kind,
      prompt: 'כמה תוצאות יש ברצף הנוכחי (העמודה האחרונה ב-Big Road)?',
      options: numberOptions(s.currentStreak, 3),
      correctKey: String(s.currentStreak),
      explanation: `העמודה האחרונה מכילה ${s.currentStreak} תוצאות של ${s.currentResult === 'banker' ? 'בנקאי' : 'שחקן'}. תיקו אינו שובר רצף.`,
    };
  }
  if (kind === 'ties') {
    return {
      kind,
      prompt: 'כמה תיקו יש בהיסטוריה המוצגת?',
      options: numberOptions(s.tie, 2),
      correctKey: String(s.tie),
      explanation: `בהיסטוריה יש ${s.tie} תיקו. ב-Big Road הם מסומנים כקו ירוק על התא האחרון ואינם פותחים עמודה.`,
    };
  }
  if (kind === 'longest') {
    return {
      kind,
      prompt: 'מהו הרצף הארוך ביותר בלוח?',
      options: numberOptions(s.longestStreak, 2),
      correctKey: String(s.longestStreak),
      explanation: `הרצף הארוך ביותר הוא ${s.longestStreak} — זו העמודה הגבוהה ביותר ב-Big Road.`,
    };
  }
  if (kind === 'newColumn') {
    const next: Outcome = rng() < 0.5 ? 'player' : 'banker';
    const opensColumn = next !== s.currentResult;
    return {
      kind,
      prompt: `התוצאה הבאה היא ${next === 'player' ? 'שחקן' : 'בנקאי'}. האם היא פותחת עמודה חדשה ב-Big Road?`,
      options: [
        { key: 'yes', label: 'כן — עמודה חדשה' },
        { key: 'no', label: 'לא — ממשיכה את העמודה' },
      ],
      correctKey: opensColumn ? 'yes' : 'no',
      explanation: `התוצאה האחרונה הייתה ${s.currentResult === 'banker' ? 'בנקאי' : 'שחקן'}. תוצאה זהה ממשיכה את העמודה, תוצאה שונה פותחת עמודה חדשה.`,
    };
  }
  return {
    kind: 'prediction',
    prompt: 'מה הלוח אומר על ההסתברות של היד הבאה?',
    options: [
      { key: 'same', label: 'הרצף יימשך' },
      { key: 'switch', label: 'התוצאה תתהפך' },
      { key: 'none', label: 'כלום — ההסתברות לא השתנתה' },
      { key: 'tie', label: 'תיקו מתקרב' },
    ],
    correctKey: 'none',
    explanation:
      'הלוח מתעד היסטוריה בלבד. כל יד מחולקת מנעל מעורבבת וההסתברות שלה נקבעת מחוקי המשחק — כ-45.9% בנקאי, 44.6% שחקן, 9.5% תיקו — בלי קשר לתוצאות הקודמות.',
  };
}

export function baccaratRoadTrainerScreen(): ScreenInstance {
  let history = randomHistory(randInt(rng, 14, 30));
  let question = buildQuestion(history, adaptiveHint().difficulty);
  let answered = false;
  let feedback: HTMLElement | null = null;
  let startedAt = Date.now();
  let sessionCorrect = 0;
  let sessionTotal = 0;
  let totalReaction = 0;
  const host = h('div', { class: 'stack' });

  const next = (): void => {
    history = randomHistory(randInt(rng, 14, 30));
    question = buildQuestion(history, adaptiveHint().difficulty);
    answered = false;
    feedback = null;
    startedAt = Date.now();
    render();
  };

  const render = (): void => {
    const b = baccarat();
    const avgReaction = sessionTotal ? totalReaction / sessionTotal : 0;
    host.replaceChildren(
      h(
        'div',
        { class: 'grid grid-4' },
        statTile('במפגש', `${sessionCorrect}/${sessionTotal}`),
        statTile('דיוק', pct(baccaratAccuracy(b.trainers.road), 0)),
        statTile('זמן תגובה', avgReaction ? `${(avgReaction / 1000).toFixed(1)} שנ׳` : '—'),
        statTile('ניקוד', num(sessionCorrect * 10)),
      ),
      panel(
        { title: 'קרא את הלוח', subtitle: question.prompt, icon: '🗺️' },
        h('p', { class: 'text-faint', text: 'Big Road' }),
        bigRoadView(history, 16),
        h('p', { class: 'text-faint', text: 'Bead Plate' }),
        beadPlateView(history, 10),
        roadLegend(),
        answered && feedback
          ? feedback
          : optionGrid(
              question.options,
              (key, el) => {
                if (answered) return;
                answered = true;
                const reaction = Date.now() - startedAt;
                totalReaction += reaction;
                sessionTotal++;
                const correct = key === question.correctKey;
                if (correct) sessionCorrect++;
                recordBaccaratAnswer('road', correct, reaction);
                el.classList.add(correct ? 'correct' : 'wrong');
                feedback = h(
                  'div',
                  { class: 'stack' },
                  answerBanner(
                    correct,
                    correct ? 'נכון' : `לא נכון — התשובה: ${question.options.find((o) => o.key === question.correctKey)?.label}`,
                    question.explanation,
                  ),
                  button('תרגיל הבא', next, { tone: 'gold', wide: true }),
                );
                render();
              },
              question.options.length > 2 ? 2 : 2,
            ),
      ),
      note('הלוחות עוזרים לעקוב אחרי המשחק ולהבין אותו. הם לא מנבאים את היד הבאה.'),
    );
  };

  render();
  return { element: screen({ title: 'קריאת לוחות', subtitle: 'Road Trainer', showBack: true }, host) };
}
