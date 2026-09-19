/**
 * בקר שולחן משותף — משמש גם למשחק הרגיל, גם לסימולציית קזינו וגם למצב המתקדם.
 * אחראי על חיבור מנוע המשחק ל-UI, אנימציות, ספירה והימורים.
 */
import { hiLoValueOfCard, rankValue } from "../engine/cards.js";
import { decide, ACTION_LABEL_HE } from "../engine/basicStrategy.js";
import { trueCount } from "../engine/counting.js";
import { BlackjackGame, OUTCOME_LABEL_HE } from "../engine/game.js";
import { handValue } from "../engine/hand.js";
import { recordRound, settings, state, updateStats } from "../state/appState.js";
import { checkAchievements } from "../content/progression.js";
import { appStore, updateProgress } from "../state/appState.js";
import { h, money, num } from "../ui/dom.js";
import { countMeter } from "../ui/components/charts.js";
import { actionBar, button, chip, CHIP_VALUES } from "../ui/components/controls.js";
import { achievementToast, toast } from "../ui/components/feedbackUi.js";
import { handView } from "../ui/components/playingCard.js";
import { sfx } from "../ui/feedback.js";
const BOT_NAMES = ['דנה', 'יוסי', 'מיכל', 'עומר', 'רותם', 'נועה'];
export class TableController {
    game;
    options;
    bet;
    seenCards = new Set();
    rootEl;
    feltEl;
    shoeEl;
    controlsEl;
    statusEl;
    countEl;
    awaitingNext = false;
    lastNet = 0;
    constructor(options) {
        this.options = options;
        const seats = [
            ...Array.from({ length: Math.max(0, options.bots) }, (_, i) => ({
                id: `bot${i}`,
                name: BOT_NAMES[i % BOT_NAMES.length],
                bankroll: 5000,
            })),
            { id: 'user', name: 'אתה', isUser: true, bankroll: state().stats.bankroll },
        ];
        this.game = new BlackjackGame(options.rules, seats);
        this.bet = Math.max(settings().minBet, Math.min(settings().minBet * 2, settings().maxBet));
        this.feltEl = h('div', { class: 'table-felt' }, h('div', { class: 'table-arc' }));
        this.shoeEl = h('div', { class: 'table-shoe' });
        this.statusEl = h('div', { class: 'table-status' });
        this.controlsEl = h('div', { class: 'table-controls' });
        this.countEl = h('div', { class: 'row-center', style: { padding: '8px 12px 0' } });
        this.rootEl = h('div', { class: 'table-root' }, this.countEl, this.shoeEl, this.feltEl, this.statusEl, this.controlsEl);
        this.render();
    }
    get element() {
        return this.rootEl;
    }
    get userSeat() {
        return this.game.userSeat;
    }
    /** ספירה רצה נוכחית של הנעל. */
    get runningCount() {
        return this.game.shoe.runningCount;
    }
    get trueCountValue() {
        return trueCount(this.game.shoe.runningCount, this.game.shoe.decksRemaining);
    }
    animateNew(cards) {
        return cards.map((card) => {
            if (this.seenCards.has(card.id))
                return -1;
            this.seenCards.add(card.id);
            return 0;
        });
    }
    renderShoe() {
        const shoe = this.game.shoe;
        const remaining = shoe.cardsRemaining / shoe.totalCards;
        const cutAt = 1 - shoe.penetration;
        return h('div', { class: 'shoe-visual', attrs: { 'aria-label': `נעל: ${num(shoe.cardsRemaining)} קלפים נותרו` } }, h('div', { class: 'shoe-fill', style: { width: `${remaining * 100}%` } }), h('div', { class: 'shoe-cut', style: { insetInlineStart: `${cutAt * 100}%` } }), h('span', {
            class: 'shoe-caption',
            text: `${num(shoe.cardsRemaining)} קלפים · ${shoe.decksRemaining.toFixed(1)} חפיסות`,
        }));
    }
    renderCount() {
        this.countEl.replaceChildren();
        if (this.options.showCount) {
            this.countEl.appendChild(countMeter('ספירה רצה', this.runningCount));
            this.countEl.appendChild(countMeter('ספירה אמיתית', this.trueCountValue, 1));
        }
        this.countEl.appendChild(h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'הון' }), h('span', { class: 'count-value', text: money(this.userSeat.bankroll) })));
        this.shoeEl.replaceChildren(this.renderShoe());
    }
    renderFelt() {
        const game = this.game;
        this.feltEl.replaceChildren(h('div', { class: 'table-arc' }));
        const dealerHidden = game.phase === 'playerTurn' || game.phase === 'insurance';
        const dealerCards = game.dealerCards;
        if (dealerCards.length)
            this.animateNew(dealerHidden ? dealerCards.slice(0, 1) : dealerCards);
        this.feltEl.appendChild(h('div', { class: 'dealer-zone' }, h('span', { class: 'zone-title', text: 'דילר' }), dealerCards.length
            ? handView(dealerCards, { hideSecond: dealerHidden, animate: settings().animations })
            : h('div', { class: 'seat-placeholder', text: 'הדילר' })));
        const seatEls = [];
        for (const seat of game.seats) {
            if (!seat.hands.length && !seat.isUser)
                continue;
            const active = game.current?.seat.id === seat.id;
            const handEls = seat.hands.map((hand, i) => {
                this.animateNew(hand.cards);
                const isActive = active && game.current?.hand === hand;
                const tone = hand.outcome === 'win' || hand.outcome === 'blackjack'
                    ? 'win'
                    : hand.outcome === 'push'
                        ? 'push'
                        : hand.outcome
                            ? 'lose'
                            : null;
                return handView(hand.cards, {
                    small: !seat.isUser || seat.hands.length > 1,
                    active: isActive,
                    tone,
                    animate: settings().animations,
                    badge: hand.doubled ? 'הכפלה' : hand.surrendered ? 'כניעה' : seat.hands.length > 1 ? `יד ${i + 1}` : undefined,
                });
            });
            seatEls.push(h('div', { class: `seat${seat.isUser ? ' user' : ''}` }, h('span', { class: 'seat-name', text: seat.name }), h('div', { class: 'row-center', style: { gap: '4px' } }, ...(handEls.length ? handEls : [h('div', { class: 'seat-placeholder', text: 'המקום שלך' })])), seat.hands.length ? h('span', { class: 'seat-bet', text: money(seat.hands.reduce((s, x) => s + x.bet, 0)) }) : null));
        }
        this.feltEl.appendChild(h('div', { class: 'player-zone' }, h('div', { class: 'seats-row' }, ...seatEls)));
    }
    hintText() {
        if (!this.options.showHint)
            return null;
        const cur = this.game.current;
        const up = this.game.dealerUpCard;
        if (!cur || !cur.seat.isUser || !up)
            return null;
        const legal = this.game.legalActionsFor(cur.seat, cur.hand);
        if (!legal.length)
            return null;
        const decision = decide(cur.hand.cards, up, this.options.rules, {
            canDouble: legal.includes('double'),
            canSplit: legal.includes('split'),
            canSurrender: legal.includes('surrender'),
        });
        return `המלצת אסטרטגיה בסיסית: ${ACTION_LABEL_HE[decision.action]}`;
    }
    renderControls() {
        const game = this.game;
        this.controlsEl.replaceChildren();
        if (game.phase === 'idle' || game.phase === 'roundOver') {
            if (this.awaitingNext) {
                this.controlsEl.appendChild(h('div', { class: 'stack', style: { padding: '10px 12px' } }, button('סיבוב הבא', () => this.nextRound(), { tone: 'gold', wide: true })));
                return;
            }
            const betRow = h('div', { class: 'chip-rail' });
            for (const value of CHIP_VALUES) {
                betRow.appendChild(chip(value, () => {
                    const next = Math.min(settings().maxBet, this.bet + value);
                    this.bet = next;
                    this.render();
                }, this.bet + value > settings().maxBet || value > this.userSeat.bankroll));
            }
            this.controlsEl.appendChild(h('div', { class: 'stack', style: { padding: '10px 12px' } }, h('div', { class: 'row-between' }, h('span', { class: 'text-dim', text: 'ההימור שלך' }), h('span', { class: 'big-number text-gold', text: money(this.bet) })), betRow, h('div', { class: 'row-center' }, button('נקה', () => {
                this.bet = settings().minBet;
                this.render();
            }, { tone: 'ghost', small: true }), button('מינימום', () => {
                this.bet = settings().minBet;
                this.render();
            }, { tone: 'ghost', small: true }), button('מקסימום', () => {
                this.bet = Math.min(settings().maxBet, Math.max(settings().minBet, this.userSeat.bankroll));
                this.render();
            }, { tone: 'ghost', small: true })), button('חלק קלפים', () => this.deal(), {
                tone: 'primary',
                wide: true,
                disabled: this.bet <= 0 || this.bet > this.userSeat.bankroll,
            })));
            return;
        }
        if (game.phase === 'insurance') {
            const half = Math.round((this.userSeat.hands[0]?.bet ?? this.bet) / 2);
            this.controlsEl.appendChild(h('div', { class: 'stack', style: { padding: '10px 12px' } }, h('p', { class: 'text-dim', text: `לדילר יש אס. ביטוח עולה ${money(half)} ומשלם 2:1 אם לדילר יש בלאק ג'ק.` }), h('div', { class: 'row-center' }, button('קח ביטוח', () => {
                this.game.takeInsurance('user', half);
                this.game.resolveInsurance();
                this.afterPhaseChange();
            }, { tone: 'gold' }), button('ללא ביטוח', () => {
                this.game.resolveInsurance();
                this.afterPhaseChange();
            }, { tone: 'secondary' })), h('p', { class: 'text-faint', text: 'ללא ספירת קלפים הביטוח מפסיד בממוצע — נדרשת ספירה אמיתית של ‎+3 ומעלה.' })));
            return;
        }
        if (game.phase === 'playerTurn') {
            const legal = game.legalActions();
            const specs = [
                { key: 'hit', label: 'פגע', icon: '🃏', tone: 'secondary', action: 'hit' },
                { key: 'stand', label: 'עמוד', icon: '✋', tone: 'secondary', action: 'stand' },
                { key: 'double', label: 'הכפל', icon: '⏫', tone: 'gold', action: 'double' },
                { key: 'split', label: 'פצל', icon: '✂️', tone: 'secondary', action: 'split' },
                { key: 'surrender', label: 'כניעה', icon: '🏳️', tone: 'ghost', action: 'surrender' },
            ];
            const hint = this.hintText();
            this.controlsEl.appendChild(h('div', { class: 'stack' }, hint ? h('p', { class: 'text-faint', style: { textAlign: 'center' }, text: hint }) : null, actionBar(specs.map((spec) => ({
                key: spec.key,
                label: spec.label,
                icon: spec.icon,
                tone: spec.tone,
                disabled: !legal.includes(spec.action),
                onClick: () => this.act(spec.action),
            })))));
        }
    }
    renderStatus() {
        const game = this.game;
        let text = '';
        if (game.phase === 'idle' || (game.phase === 'roundOver' && !this.awaitingNext))
            text = 'בחר הימור והתחל סיבוב';
        else if (game.phase === 'insurance')
            text = 'הדילר מציע ביטוח';
        else if (game.phase === 'playerTurn')
            text = 'תורך לפעול';
        else if (game.phase === 'roundOver') {
            const outcomes = this.userSeat.hands.map((x) => (x.outcome ? OUTCOME_LABEL_HE[x.outcome] : '')).filter(Boolean);
            const net = this.lastNet;
            text = `${outcomes.join(' · ')} — ${net > 0 ? `רווח ${money(net)}` : net < 0 ? `הפסד ${money(Math.abs(net))}` : 'ללא שינוי'}`;
        }
        this.statusEl.textContent = text;
    }
    render() {
        this.renderCount();
        this.renderFelt();
        this.renderStatus();
        this.renderControls();
    }
    deal() {
        const bets = { user: this.bet };
        for (const seat of this.game.seats) {
            if (seat.isUser)
                continue;
            const units = 1 + Math.floor(Math.random() * 3);
            bets[seat.id] = settings().minBet * units;
        }
        const before = this.game.shoe.shuffleCount;
        this.game.startRound(bets);
        if (this.game.shoe.shuffleCount > before) {
            sfx.shuffle();
            toast('הנעל עורבבה — הספירה מתאפסת', 'info');
        }
        sfx.cardDeal();
        this.awaitingNext = false;
        this.afterPhaseChange();
        // מבטיח שכל השולחן — דילר, ידיים וכפתורי הפעולה — נראה במסך אחד
        window.scrollTo({ top: 0, behavior: settings().animations ? 'smooth' : 'auto' });
    }
    act(action) {
        this.game.act(action);
        if (action === 'hit' || action === 'double')
            sfx.cardDeal();
        this.afterPhaseChange();
    }
    afterPhaseChange() {
        if (this.game.phase === 'roundOver')
            this.finishRound();
        else
            this.render();
    }
    finishRound() {
        const net = this.game.userNet;
        this.lastNet = net;
        this.awaitingNext = true;
        const hands = this.userSeat.hands.length;
        if (this.options.persistBankroll !== false) {
            recordRound(net, hands);
            const unlocked = checkAchievements(appStore.get());
            if (unlocked.length) {
                updateProgress((p) => ({
                    achievements: { ...p.achievements, ...Object.fromEntries(unlocked.map((a) => [a.id, Date.now()])) },
                }));
                for (const a of unlocked)
                    achievementToast(a.icon, a.title);
            }
            updateStats({ bankroll: this.userSeat.bankroll });
        }
        const hasBlackjack = this.userSeat.hands.some((x) => x.outcome === 'blackjack');
        if (hasBlackjack)
            sfx.blackjack();
        else if (net > 0)
            sfx.win();
        else if (net < 0)
            sfx.lose();
        else
            sfx.push();
        this.render();
        this.options.onRoundEnd?.(this.game, net);
    }
    nextRound() {
        const proceed = () => {
            this.awaitingNext = false;
            this.userSeat.bankroll = this.options.persistBankroll === false ? this.userSeat.bankroll : state().stats.bankroll;
            this.render();
        };
        if (this.options.beforeNextRound)
            this.options.beforeNextRound(this.game, proceed);
        else
            proceed();
    }
    /** סכום הספירה של הקלפים שנחשפו בסיבוב האחרון. */
    roundCountDelta() {
        return this.game.roundCards.reduce((sum, c) => sum + hiLoValueOfCard(c), 0);
    }
    /** ההחלטה הנכונה לפי אסטרטגיה בסיסית ליד הנוכחית (לשאלות במצב מתקדם). */
    correctActionForCurrentHand() {
        const cur = this.game.current;
        const up = this.game.dealerUpCard;
        if (!cur || !up)
            return null;
        const legal = this.game.legalActionsFor(cur.seat, cur.hand);
        return decide(cur.hand.cards, up, this.options.rules, {
            canDouble: legal.includes('double'),
            canSplit: legal.includes('split'),
            canSurrender: legal.includes('surrender'),
        }).action;
    }
    /** ערך היד של המשתמש (לשאלות). */
    userHandTotal() {
        const hand = this.userSeat.hands[0];
        return hand ? handValue(hand.cards).total : 0;
    }
    dealerUpValue() {
        const up = this.game.dealerUpCard;
        if (!up)
            return 0;
        return up.rank === 'A' ? 1 : rankValue(up.rank);
    }
}
//# sourceMappingURL=gameController.js.map