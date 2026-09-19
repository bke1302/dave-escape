/** מסך ההגדרות — חוקי שולחן, חוויית משתמש ואיפוס. */
import { fullShoeComposition, roundExpectedValue } from '../engine/evEngine.ts';
import { DECK_OPTIONS, PENETRATION_OPTIONS, describeRulesHe, type DeckCount } from '../engine/rules.ts';
import { DIFFICULTY_LABEL_HE, resetAllProgress, rules, settings, updateRules, updateSettings, type DealSpeed, type Difficulty } from '../state/appState.ts';
import { h, money, pct, signedPct } from '../ui/dom.ts';
import { button, segmented, slider, toggle } from '../ui/components/controls.ts';
import { modal, toast } from '../ui/components/feedbackUi.ts';
import { note, panel, screen, statTile } from '../ui/components/layout.ts';
import { navigate, type ScreenInstance } from '../ui/router.ts';

export function settingsScreen(): ScreenInstance {
  const host = h('div', { class: 'stack' });

  const render = (): void => {
    const s = settings();
    const r = rules();
    const ev = roundExpectedValue(fullShoeComposition(r.decks), r);

    host.replaceChildren(
      panel(
        { title: 'חוקי השולחן', subtitle: describeRulesHe(r), icon: '🎴' },
        h(
          'div',
          { class: 'grid grid-2' },
          statTile('יתרון הבית', ev < 0 ? pct(-ev, 2) : `שחקן ${pct(ev, 2)}`, 'מחושב מהחוקים', ev < 0 ? 'bad' : 'good'),
          statTile('תוחלת ליד', signedPct(ev), 'אסטרטגיה בסיסית', ev < 0 ? 'bad' : 'good'),
        ),
        h('p', { class: 'text-faint', text: 'מספר חפיסות' }),
        segmented(
          DECK_OPTIONS.map((d) => ({ value: d, label: String(d) })),
          r.decks,
          (value) => {
            updateRules({ decks: value as DeckCount });
            render();
          },
          'מספר חפיסות',
        ),
        h('p', { class: 'text-faint', text: 'חוק הדילר ב-17 רכה' }),
        segmented(
          [
            { value: false, label: 'עומד (S17)' },
            { value: true, label: 'לוקח (H17)' },
          ],
          r.dealerHitsSoft17,
          (value) => {
            updateRules({ dealerHitsSoft17: value });
            render();
          },
          'חוק דילר',
        ),
        h('p', { class: 'text-faint', text: 'תשלום בלאק ג׳ק' }),
        segmented(
          [
            { value: 1.5, label: '3:2', hint: 'מומלץ' },
            { value: 1.2, label: '6:5', hint: 'גרוע לשחקן' },
          ],
          r.blackjackPayout,
          (value) => {
            updateRules({ blackjackPayout: value });
            render();
          },
          'תשלום בלאק ג׳ק',
        ),
        h('p', { class: 'text-faint', text: 'חדירה (Penetration)' }),
        segmented(
          PENETRATION_OPTIONS.map((p) => ({ value: p, label: `${Math.round(p * 100)}%` })),
          r.penetration,
          (value) => {
            updateRules({ penetration: value });
            render();
          },
          'חדירה',
        ),
        h('p', { class: 'text-faint', text: 'כניעה' }),
        segmented(
          [
            { value: 'late', label: 'כניעה מאוחרת' },
            { value: 'none', label: 'ללא כניעה' },
          ],
          r.surrender,
          (value) => {
            updateRules({ surrender: value as 'late' | 'none' });
            render();
          },
          'כניעה',
        ),
        h('p', { class: 'text-faint', text: 'הכפלה' }),
        segmented(
          [
            { value: 'any2', label: 'כל שני קלפים' },
            { value: '9-11', label: '9-11 בלבד' },
            { value: '10-11', label: '10-11 בלבד' },
          ],
          r.doubleRule,
          (value) => {
            updateRules({ doubleRule: value as 'any2' | '9-11' | '10-11' });
            render();
          },
          'חוקי הכפלה',
        ),
        toggle('הכפלה אחרי פיצול (DAS)', r.doubleAfterSplit, (value) => {
          updateRules({ doubleAfterSplit: value });
          render();
        }),
        toggle('פיצול חוזר של אסים', r.resplitAces, (value) => {
          updateRules({ resplitAces: value });
          render();
        }),
        toggle('לקיחת קלפים על אסים מפוצלים', r.hitSplitAces, (value) => {
          updateRules({ hitSplitAces: value });
          render();
        }),
        toggle('הצעת ביטוח', r.insuranceOffered, (value) => {
          updateRules({ insuranceOffered: value });
          render();
        }),
        slider('מספר ידיים מרבי בפיצול', r.maxSplitHands, 2, 4, 1, (value) => {
          updateRules({ maxSplitHands: value });
        }),
      ),

      panel(
        { title: 'חוויית משתמש', icon: '✨' },
        toggle('צלילים', s.sound, (value) => {
          updateSettings({ sound: value });
          render();
        }),
        toggle('רטט (Haptics)', s.haptics, (value) => {
          updateSettings({ haptics: value });
          render();
        }, 'זמין במכשירים תומכים'),
        toggle('אנימציות', s.animations, (value) => {
          updateSettings({ animations: value });
          document.body.classList.toggle('no-animations', !value);
          render();
        }),
        h('p', { class: 'text-faint', text: 'מהירות חלוקה' }),
        segmented(
          [
            { value: 'slow', label: 'איטית' },
            { value: 'normal', label: 'רגילה' },
            { value: 'fast', label: 'מהירה' },
          ],
          s.dealSpeed,
          (value) => {
            updateSettings({ dealSpeed: value as DealSpeed });
            render();
          },
          'מהירות',
        ),
        h('p', { class: 'text-faint', text: 'רמת קושי באימונים' }),
        segmented(
          (['beginner', 'easy', 'medium', 'hard', 'expert', 'master'] as Difficulty[]).map((d) => ({
            value: d,
            label: DIFFICULTY_LABEL_HE[d],
          })),
          s.difficulty,
          (value) => {
            updateSettings({ difficulty: value as Difficulty });
            render();
          },
          'רמת קושי',
        ),
        toggle('רמז אסטרטגיה במשחק', s.showStrategyHint, (value) => {
          updateSettings({ showStrategyHint: value });
          render();
        }),
        toggle('הצגת ספירה במשחק', s.showCount, (value) => {
          updateSettings({ showCount: value });
          render();
        }, 'כבה כדי להתאמן בתנאי אמת'),
      ),

      panel(
        { title: 'הון והימורים', icon: '💰' },
        slider('הון התחלתי', s.startingBankroll, 200, 50000, 100, (v) => updateSettings({ startingBankroll: v }), (v) => money(v)),
        slider('הימור מינימלי', s.minBet, 5, 200, 5, (v) => updateSettings({ minBet: v }), (v) => money(v)),
        slider('הימור מקסימלי', s.maxBet, 50, 5000, 50, (v) => updateSettings({ maxBet: v }), (v) => money(v)),
        slider('פריסת הימורים מרבית', s.betSpreadMax, 2, 16, 1, (v) => updateSettings({ betSpreadMax: v }), (v) => `1-${v}`),
        button('ניהול הון וסיכון חורבן', () => navigate('/bankroll'), { tone: 'ghost', wide: true }),
      ),

      panel(
        { title: 'שפה', icon: '🌐' },
        h('p', { class: 'text-dim', text: 'האפליקציה כולה בעברית עם תמיכת RTL מלאה. מונחים מקצועיים מופיעים גם באנגלית בסוגריים לצורך למידה.' }),
      ),

      panel(
        { title: 'נתונים', icon: '🗃️' },
        h('p', { class: 'text-dim', text: 'כל ההתקדמות נשמרת במכשיר בלבד. האפליקציה עובדת גם ללא אינטרנט.' }),
        button('אפס התקדמות', () => {
          modal({
            title: 'איפוס מלא',
            body: ['כל ההתקדמות, הסטטיסטיקות, ההישגים וההגדרות יימחקו. אי אפשר לבטל פעולה זו.'],
            confirmLabel: 'מחק הכל',
            cancelLabel: 'ביטול',
            tone: 'danger',
            onConfirm: () => {
              resetAllProgress();
              toast('ההתקדמות אופסה', 'info');
              render();
            },
          });
        }, { tone: 'danger', wide: true }),
      ),

      note(`כל שינוי בחוקים מעדכן מיד את טבלת האסטרטגיה, את יתרון הבית (${pct(-ev, 2)}) ואת הסימולציות.`),
    );
  };

  render();
  const element = screen({ title: 'הגדרות' }, host);
  return { element };
}
