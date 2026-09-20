/**
 * מודול "Baccarat Tracking" — ההבדל בין מעקב, ספירת קלפים, זיהוי תבניות וכשלים לוגיים.
 * כולל מחשבון רצפים שמראה במספרים מה באמת אומר רצף.
 */
import { createRng, randInt } from '../../engine/rng.ts';
import { h, num, pct } from '../../ui/dom.ts';
import { barChart } from '../../ui/components/charts.ts';
import { button, optionGrid, slider } from '../../ui/components/controls.ts';
import { answerBanner } from '../../ui/components/feedbackUi.ts';
import { note, panel, screen, statTile } from '../../ui/components/layout.ts';
import type { ScreenInstance } from '../../ui/router.ts';
import { baccarat, baccaratAccuracy, recordBaccaratAnswer } from '../state.ts';
import { exactProbabilities } from '../engine/probability.ts';
import type { Outcome } from '../engine/game.ts';

const rng = createRng();

interface PatternQuestion {
  sequence: Outcome[];
  prompt: string;
  options: { key: string; label: string }[];
  correctKey: string;
  explanation: string;
}

const SHORT: Record<Outcome, string> = { player: 'P', banker: 'B', tie: 'T' };

function sequenceStrip(sequence: Outcome[]): HTMLElement {
  return h(
    'div',
    { class: 'history-strip', style: { justifyContent: 'center', padding: '8px 0' } },
    ...sequence.map((o) => h('span', { class: `history-chip road-${o}`, text: SHORT[o] })),
  );
}

export function baccaratTrackingScreen(): ScreenInstance {
  const host = h('div', { class: 'stack' });
  let streakLength = 5;
  let question: PatternQuestion | null = null;
  let answered = false;
  let feedback: HTMLElement | null = null;
  let startedAt = Date.now();

  const buildQuestion = (): PatternQuestion => {
    const p = exactProbabilities(baccarat().rules.decks);
    const kind = Math.floor(rng() * 3);
    if (kind === 0) {
      const len = randInt(rng, 4, 6);
      const which: Outcome = rng() < 0.5 ? 'banker' : 'player';
      return {
        sequence: new Array(len).fill(which),
        prompt: `יצא רצף של ${len} ${which === 'banker' ? 'בנקאי' : 'שחקן'}. מה ההסתברות שהיד הבאה תהיה בנקאי?`,
        options: [
          { key: 'higher', label: 'גבוהה מהרגיל — הרצף נמשך' },
          { key: 'lower', label: 'נמוכה מהרגיל — מגיע היפוך' },
          { key: 'same', label: `בדיוק כמו תמיד — ${pct(p.banker, 1)}` },
          { key: 'fifty', label: 'בדיוק 50%' },
        ],
        correctKey: 'same',
        explanation: `ההסתברות נקבעת מחוקי המשחק ומהנעל: בנקאי ${pct(p.banker, 2)} · שחקן ${pct(p.player, 2)} · תיקו ${pct(p.tie, 2)}. הרצף שכבר יצא אינו משנה אותה. האמונה שהוא כן — זהו Gambler's Fallacy (או ההפך שלו, "השולחן חם").`,
      };
    }
    if (kind === 1) {
      const seq: Outcome[] = [];
      for (let i = 0; i < 6; i++) seq.push(i % 2 === 0 ? 'player' : 'banker');
      return {
        sequence: seq,
        prompt: 'הלוח מראה תבנית מתחלפת מושלמת. מה זה אומר?',
        options: [
          { key: 'pattern', label: 'יש תבנית — כדאי להמר על ההיפוך' },
          { key: 'random', label: 'זו תוצאה אפשרית של רצף אקראי' },
          { key: 'rigged', label: 'השולחן מוטה' },
          { key: 'tie', label: 'תיקו מתקרב' },
        ],
        correctKey: 'random',
        explanation:
          'רצף אקראי מייצר תבניות שנראות משמעותיות. ההסתברות לתבנית מתחלפת באורך 6 היא בערך אותה הסתברות כמו לכל רצף ספציפי אחר באותו אורך. המוח שלנו מזהה תבניות גם כשאין להן משמעות סטטיסטית.',
      };
    }
    const seq: Outcome[] = [];
    for (let i = 0; i < 8; i++) {
      const roll = rng();
      seq.push(roll < 0.459 ? 'banker' : roll < 0.905 ? 'player' : 'tie');
    }
    return {
      sequence: seq,
      prompt: 'מה מועיל באמת במעקב אחרי תוצאות בבאקרה?',
      options: [
        { key: 'predict', label: 'לחזות את היד הבאה' },
        { key: 'manage', label: 'לעקוב אחרי ההון, ההימורים והמשמעת שלי' },
        { key: 'streak', label: 'לזהות מתי רצף עומד להסתיים' },
        { key: 'hot', label: 'לזהות שולחן "חם"' },
      ],
      correctKey: 'manage',
      explanation:
        'מעקב (Tracking) שימושי לניהול הון, לבקרה על גודל ההימור ולהבנת המשחק. הוא אינו מספק מידע על היד הבאה, כי כל יד בלתי תלויה בקודמותיה.',
    };
  };

  const render = (): void => {
    const b = baccarat();
    const p = exactProbabilities(b.rules.decks);
    // הסתברות לרצף באורך נתון: התוצאה הראשונה, ואז אותה תוצאה שוב ושוב
    const pBankerNoTie = p.banker / (p.banker + p.player);
    const streakProb = Math.pow(pBankerNoTie, streakLength - 1);
    const per100 = 100 * streakProb;

    if (!question) {
      question = buildQuestion();
      answered = false;
      feedback = null;
      startedAt = Date.now();
    }
    const q = question;

    host.replaceChildren(
      panel(
        { title: 'שלושה מושגים שמבלבלים', icon: '🔍' },
        h(
          'div',
          { class: 'stack', style: { gap: '10px' } },
          h(
            'div',
            {},
            h('div', { class: 'section-title', text: 'מעקב (Tracking)' }),
            h('p', { class: 'text-dim', text: 'רישום התוצאות והמעקב אחרי ההון וההימורים. מועיל למשמעת ולהבנה — לא מייצר יתרון מתמטי.' }),
          ),
          h(
            'div',
            {},
            h('div', { class: 'section-title', text: 'ספירת קלפים (Card Counting)' }),
            h('p', { class: 'text-dim', text: 'בבאקרה פורסמו שיטות ספירה, אך היתרון שהן מייצרות זעיר ונדיר. אין בבאקרה החלטות ואין תשלום מיוחד, ולכן הרכב הנעל כמעט לא משנה — בניגוד לבלאק ג׳ק.' }),
          ),
          h(
            'div',
            {},
            h('div', { class: 'section-title', text: 'זיהוי תבניות (Pattern Recognition)' }),
            h('p', { class: 'text-dim', text: 'חיפוש "צורות" בלוחות. רצף אקראי מייצר תבניות כל הזמן — זיהוי שלהן אינו מידע על העתיד.' }),
          ),
          h(
            'div',
            {},
            h('div', { class: 'section-title', text: 'כשל המהמר (Gambler\'s Fallacy)' }),
            h('p', { class: 'text-dim', text: 'האמונה שתוצאה "חייבת" להתהפך אחרי רצף, או שרצף "חייב" להימשך. שתי האמונות שגויות באותה מידה.' }),
          ),
        ),
      ),

      panel(
        { title: 'מחשבון רצפים', subtitle: 'כמה נדיר באמת הרצף שראית?', icon: '📏' },
        slider('אורך הרצף', streakLength, 2, 12, 1, (v) => {
          streakLength = v;
          render();
        }, (v) => `${v} ידיים`),
        h(
          'div',
          { class: 'grid grid-2' },
          statTile('הסתברות להמשך', pct(pBankerNoTie, 2), 'בנקאי, בלי תיקו'),
          statTile(`רצף של ${streakLength}`, pct(streakProb, 3), 'בהינתן התוצאה הראשונה'),
          statTile('פעמים ב-100 ידיים', num(per100, 1), 'בקירוב'),
          statTile('ההסתברות ליד הבאה', pct(p.banker, 2), 'לא משתנה לעולם'),
        ),
        barChart(
          [3, 4, 5, 6, 7, 8].map((len) => ({
            label: `רצף ${len}`,
            value: Math.pow(pBankerNoTie, len - 1) * 100,
            tone: 'neutral' as const,
          })),
          (v) => `${v.toFixed(2)}%`,
        ),
        h('p', { class: 'text-faint', text: 'שים לב: רצף שנראה "בלתי אפשרי" הוא בדרך כלל אירוע שקורה כמה פעמים בכל מפגש. נדירות של רצף בודד אינה נדירות לאורך מאות ידיים.' }),
      ),

      panel(
        { title: 'תרגול זיהוי תבניות', subtitle: q.prompt, icon: '🧠' },
        sequenceStrip(q.sequence),
        h('p', { class: 'text-faint', text: `דיוק בהסתברויות: ${pct(baccaratAccuracy(b.trainers.probability), 0)}` }),
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
              1,
            ),
      ),

      note('האפליקציה לא מציגה שום שיטה כדרך מובטחת לנצח. אין בבאקרה שיטת מעקב שהופכת את יתרון הבית לחיובי.', '⚖️'),
    );
  };

  render();
  return { element: screen({ title: 'Baccarat Tracking', subtitle: 'מעקב, תבניות וכשלים לוגיים', showBack: true }, host) };
}
