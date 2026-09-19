/** מסך המשחק הראשי. */
import { describeRulesHe } from '../engine/rules.ts';
import { rules, settings, state, updateSettings } from '../state/appState.ts';
import { h, money } from '../ui/dom.ts';
import { button } from '../ui/components/controls.ts';
import { note, panel, screen } from '../ui/components/layout.ts';
import { modal } from '../ui/components/feedbackUi.ts';
import { navigate, type ScreenInstance } from '../ui/router.ts';
import { TableController } from './gameController.ts';
import { resetBankroll } from '../state/appState.ts';

export function gameScreen(): ScreenInstance {
  const controller = new TableController({
    rules: rules(),
    bots: 0,
    showCount: settings().showCount,
    showHint: settings().showStrategyHint,
  });

  const element = screen(
    {
      title: 'משחק Blackjack',
      subtitle: describeRulesHe(rules()),
      showBack: true,
      variant: 'table',
      action: button('חוקים', () => {
        modal({
          title: 'חוקי השולחן',
          body: [
            describeRulesHe(rules()),
            'אפשר לשנות את כל החוקים במסך ההגדרות. כל שינוי משפיע מיד על טבלת האסטרטגיה, על יתרון הבית ועל הסימולציות.',
          ],
          confirmLabel: 'למסך ההגדרות',
          cancelLabel: 'סגור',
          onConfirm: () => navigate('/settings'),
        });
      }, { tone: 'ghost', small: true }),
    },
    controller.element,
    h(
      'div',
      { class: 'stack', style: { padding: '12px' } },
      panel(
        { title: 'כלים', icon: '🧰' },
        h(
          'div',
          { class: 'row-center' },
          button(settings().showStrategyHint ? 'כבה רמזים' : 'הפעל רמזים', () => {
            updateSettings({ showStrategyHint: !settings().showStrategyHint });
            controller.options.showHint = settings().showStrategyHint;
            controller.render();
          }, { tone: 'ghost', small: true }),
          button(settings().showCount ? 'הסתר ספירה' : 'הצג ספירה', () => {
            updateSettings({ showCount: !settings().showCount });
            controller.options.showCount = settings().showCount;
            controller.render();
          }, { tone: 'ghost', small: true }),
          button('טבלת אסטרטגיה', () => navigate('/strategy/chart'), { tone: 'ghost', small: true }),
          button('אפס הון', () => {
            modal({
              title: 'איפוס הון',
              body: [`ההון יחזור ל-${money(settings().startingBankroll)} והמפגש הנוכחי יתאפס. הסטטיסטיקות לכל החיים נשמרות.`],
              confirmLabel: 'אפס',
              cancelLabel: 'ביטול',
              tone: 'danger',
              onConfirm: () => {
                resetBankroll();
                controller.userSeat.bankroll = state().stats.bankroll;
                controller.render();
              },
            });
          }, { tone: 'ghost', small: true }),
        ),
      ),
      note('המשחק הוא כלי אימון. גם משחק מושלם אינו מבטיח רווח — ראה מסך "משחק אחראי".'),
    ),
  );

  return { element };
}
