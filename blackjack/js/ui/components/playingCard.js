/** תצוגת קלף משחק — פנים, גב ואנימציית חלוקה. */
import { isRed, RANK_NAME_HE, SUIT_NAME_HE, SUIT_SYMBOL } from "../../engine/cards.js";
import { handValue, isBlackjack } from "../../engine/hand.js";
import { h } from "../dom.js";
export function cardView(card, options = {}) {
    const classes = ['playing-card'];
    if (options.small)
        classes.push('small');
    if (options.faceDown || !card)
        classes.push('face-down');
    if (card && isRed(card.suit))
        classes.push('red');
    if (options.animate !== false)
        classes.push('dealing');
    const el = h('div', {
        class: classes.join(' '),
        attrs: {
            role: 'img',
            'aria-label': options.faceDown || !card ? 'קלף סמוי' : `${RANK_NAME_HE[card.rank]} ${SUIT_NAME_HE[card.suit]}`,
        },
        style: options.delay ? { animationDelay: `${options.delay}ms` } : undefined,
    });
    if (options.faceDown || !card) {
        el.appendChild(h('div', { class: 'card-back' }, h('span', { class: 'card-back-mark', text: '♠' })));
        return el;
    }
    const symbol = SUIT_SYMBOL[card.suit];
    el.appendChild(h('div', { class: 'card-face' }, h('span', { class: 'card-corner top', text: `${card.rank}\n${symbol}` }), h('span', { class: 'card-pip', text: symbol }), h('span', { class: 'card-corner bottom', text: `${card.rank}\n${symbol}` })));
    return el;
}
export function handTotalText(cards) {
    if (!cards.length)
        return '';
    if (isBlackjack(cards))
        return 'בלאק ג\'ק';
    const hv = handValue(cards);
    if (hv.busted)
        return `${hv.total} · נפסל`;
    return hv.soft ? `${hv.total} רכה` : `${hv.total}`;
}
export function handView(cards, options = {}) {
    const visible = options.hideSecond ? cards.slice(0, 1) : cards;
    const cardEls = visible.map((card, i) => cardView(card, { small: options.small, delay: i * 60, animate: options.animate }));
    if (options.hideSecond && cards.length > 1) {
        cardEls.push(cardView(null, { faceDown: true, small: options.small, delay: cardEls.length * 60, animate: options.animate }));
    }
    const totalText = options.hideSecond
        ? handValue(cards.slice(0, 1)).total.toString()
        : handTotalText(cards);
    return h('div', {
        class: `hand${options.active ? ' active' : ''}${options.tone ? ` tone-${options.tone}` : ''}`,
    }, options.label ? h('span', { class: 'hand-label', text: options.label }) : null, h('div', { class: 'hand-cards' }, ...cardEls), options.showTotal !== false && cards.length
        ? h('span', { class: 'hand-total', text: totalText })
        : null, options.badge ? h('span', { class: 'hand-badge', text: options.badge }) : null);
}
//# sourceMappingURL=playingCard.js.map