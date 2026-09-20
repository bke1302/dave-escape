/** מסך פתיחה. */
import { h, delay } from '../ui/dom.ts';
import { cardView } from '../ui/components/playingCard.ts';
import { navigate, type ScreenInstance } from '../ui/router.ts';
import { settings } from '../state/appState.ts';

export function splashScreen(): ScreenInstance {
  const element = h(
    'div',
    { class: 'splash' },
    h(
      'div',
      { class: 'splash-inner' },
      h(
        'div',
        { class: 'splash-cards' },
        cardView({ rank: 'A', suit: 'spades', id: 's1' }, { animate: false }),
        cardView({ rank: 'K', suit: 'hearts', id: 's2' }, { animate: false }),
      ),
      h('h1', { class: 'splash-title', text: 'CASINO ACADEMY' }),
      h('p', { class: 'splash-sub', text: 'בלאק ג׳ק · באקרה' }),
      h('div', { class: 'splash-loader' }, h('span', {})),
    ),
  );

  let cancelled = false;
  return {
    element,
    onMount: () => {
      void (async () => {
        await delay(1500);
        if (cancelled) return;
        navigate(settings().acceptedDisclaimer ? '/home' : '/responsible', true);
      })();
    },
    onUnmount: () => {
      cancelled = true;
    },
  };
}
