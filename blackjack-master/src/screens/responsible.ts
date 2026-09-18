/** מסך משחק אחראי. */
import { settings, updateSettings } from '../state/appState.ts';
import { h } from '../ui/dom.ts';
import { button } from '../ui/components/controls.ts';
import { note, panel, screen } from '../ui/components/layout.ts';
import { navigate, type ScreenInstance } from '../ui/router.ts';

export function responsibleScreen(): ScreenInstance {
  const accepted = settings().acceptedDisclaimer;

  const element = screen(
    { title: 'משחק אחראי', subtitle: 'מה סימולציה יכולה — ומה לא', showBack: accepted, nav: accepted },
    panel(
      { title: 'לפני שמתחילים', icon: '⚖️' },
      h('p', { class: 'text-dim', text: 'גם אסטרטגיה נכונה וספירת קלפים אינן מבטיחות ניצחון. תוצאות קצרות טווח יכולות להיות שונות מאוד מהתוחלת המתמטית.' }),
      h('p', { class: 'text-dim', text: 'האפליקציה היא כלי לימוד וסימולציה. אין בה כסף אמיתי, והיא אינה מעודדת הימורים.' }),
    ),
    panel(
      { title: 'שלוש עובדות', icon: '📐' },
      h(
        'div',
        { class: 'list-rows' },
        h('div', { class: 'list-row' }, h('span', { text: 'יתרון הבית קיים בכל שולחן בלאק ג׳ק סטנדרטי' })),
        h('div', { class: 'list-row' }, h('span', { text: 'שונות גדולה מהתוחלת פי מאות ביד בודדת' })),
        h('div', { class: 'list-row' }, h('span', { text: 'יתרון של ספירה מתממש רק לאורך עשרות אלפי ידיים' })),
      ),
    ),
    note('כל המספרים באפליקציה מחושבים מהחוקים שבחרת ומהמנוע עצמו — ולא מהבטחות שיווקיות.'),
    accepted
      ? button('חזרה', () => navigate('/home'), { tone: 'ghost', wide: true })
      : button('הבנתי — התחל', () => {
          updateSettings({ acceptedDisclaimer: true });
          navigate('/home', true);
        }, { tone: 'gold', wide: true }),
  );

  return { element };
}
