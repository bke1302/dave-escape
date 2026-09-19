/** מסך פתיחה. */
import { h, delay } from "../ui/dom.js";
import { cardView } from "../ui/components/playingCard.js";
import { navigate } from "../ui/router.js";
import { settings } from "../state/appState.js";
export function splashScreen() {
    const element = h('div', { class: 'splash' }, h('div', { class: 'splash-inner' }, h('div', { class: 'splash-cards' }, cardView({ rank: 'A', suit: 'spades', id: 's1' }, { animate: false }), cardView({ rank: 'K', suit: 'hearts', id: 's2' }, { animate: false })), h('h1', { class: 'splash-title', text: 'BLACKJACK MASTER' }), h('p', { class: 'splash-sub', text: 'לומדים. מתרגלים. משתפרים.' }), h('div', { class: 'splash-loader' }, h('span', {}))));
    let cancelled = false;
    return {
        element,
        onMount: () => {
            void (async () => {
                await delay(1500);
                if (cancelled)
                    return;
                navigate(settings().acceptedDisclaimer ? '/home' : '/responsible', true);
            })();
        },
        onUnmount: () => {
            cancelled = true;
        },
    };
}
//# sourceMappingURL=splash.js.map