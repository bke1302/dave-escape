import { rankValue } from "./cards.js";
import { handValue, isBlackjack, isPair } from "./hand.js";
import { doubleAllowedForTotal } from "./rules.js";
import { Shoe } from "./shoe.js";
import { createRng } from "./rng.js";
import { buildChart, chartAction } from "./basicStrategy.js";
export const OUTCOME_LABEL_HE = {
    blackjack: 'בלאק ג\'ק!',
    win: 'ניצחון',
    push: 'תיקו (Push)',
    lose: 'הפסד',
    bust: 'נפסלת (Bust)',
    surrender: 'כניעה',
    dealerBlackjack: 'בלאק ג\'ק לדילר',
};
export const DEALER_ID = 'dealer';
function newHand(bet, fromSplit = false, splitAces = false) {
    return { cards: [], bet, doubled: false, surrendered: false, fromSplit, splitAces, done: false, net: 0 };
}
export class BlackjackGame {
    rules;
    shoe;
    seats;
    dealerCards = [];
    holeRevealed = false;
    phase = 'idle';
    events = [];
    /** כל הקלפים שנחשפו בסיבוב הנוכחי (לפי סדר) — לשימוש מסכי ספירה. */
    roundCards = [];
    roundNumber = 0;
    rng;
    /** ספירה רצה גלויה בתחילת הסיבוב (לשאלות "מה הייתה הספירה"). */
    countAtRoundStart = 0;
    constructor(rules, seatConfigs = [{ id: 'user', name: 'אתה', isUser: true }], rng) {
        this.rules = rules;
        this.rng = rng ?? createRng();
        this.shoe = new Shoe(rules.decks, rules.penetration, this.rng);
        this.seats = seatConfigs.map((c) => ({
            id: c.id,
            name: c.name,
            isUser: c.isUser ?? false,
            hands: [],
            activeHand: 0,
            insuranceBet: 0,
            insuranceNet: 0,
            bankroll: c.bankroll ?? 1000,
            baseBet: 0,
        }));
    }
    get userSeat() {
        return this.seats.find((s) => s.isUser) ?? this.seats[0];
    }
    get dealerUpCard() {
        return this.dealerCards[0] ?? null;
    }
    /** הקלף הסמוי — נגיש רק לאחר חשיפה (מונע "הצצה" מה-UI). */
    get dealerHoleCard() {
        return this.holeRevealed ? this.dealerCards[1] ?? null : null;
    }
    emit(event) {
        this.events.push(event);
    }
    drawTo(seatId, handIndex, hand, faceDown = false) {
        const card = this.shoe.draw();
        if (hand)
            hand.cards.push(card);
        else
            this.dealerCards.push(card);
        if (!faceDown)
            this.roundCards.push(card);
        this.emit({ type: 'deal', seatId, handIndex, card, faceDown });
        return card;
    }
    /** מתחיל סיבוב חדש. bets — הימור לכל מושב לפי מזהה. */
    startRound(bets) {
        this.events = [];
        this.roundCards = [];
        this.dealerCards = [];
        this.holeRevealed = false;
        this.roundNumber++;
        if (this.shoe.needsShuffle) {
            this.shoe.shuffle();
            this.emit({ type: 'shuffle' });
        }
        this.countAtRoundStart = this.shoe.runningCount;
        for (const seat of this.seats) {
            const bet = Math.max(0, Math.round(bets[seat.id] ?? 0));
            seat.hands = bet > 0 ? [newHand(bet)] : [];
            seat.activeHand = 0;
            seat.insuranceBet = 0;
            seat.insuranceNet = 0;
            seat.baseBet = bet;
        }
        // חלוקה: קלף לכל שחקן, קלף לדילר (חשוף), קלף שני לכל שחקן, קלף סמוי לדילר.
        for (const seat of this.seats) {
            if (seat.hands.length)
                this.drawTo(seat.id, 0, seat.hands[0]);
        }
        this.drawTo(DEALER_ID, 0, null);
        for (const seat of this.seats) {
            if (seat.hands.length)
                this.drawTo(seat.id, 0, seat.hands[0]);
        }
        this.drawTo(DEALER_ID, 0, null, true);
        const up = this.dealerCards[0];
        if (this.rules.insuranceOffered && up.rank === 'A') {
            this.phase = 'insurance';
            return;
        }
        this.afterInsurance();
    }
    /** לקיחת ביטוח (עד מחצית ההימור). */
    takeInsurance(seatId, amount) {
        const seat = this.seats.find((s) => s.id === seatId);
        if (!seat || this.phase !== 'insurance' || !seat.hands.length)
            return;
        const max = seat.hands[0].bet / 2;
        seat.insuranceBet = Math.min(Math.max(0, amount), max);
        this.emit({ type: 'insurance', seatId, amount: seat.insuranceBet });
    }
    /** סיום שלב הביטוח והמשך לבדיקת בלאק ג'ק. */
    resolveInsurance() {
        if (this.phase !== 'insurance')
            return;
        this.afterInsurance();
    }
    dealerHasBlackjack() {
        return this.dealerCards.length === 2 && handValue(this.dealerCards).total === 21;
    }
    afterInsurance() {
        const dealerBJ = this.dealerHasBlackjack();
        const up = this.dealerCards[0];
        const peekable = up.rank === 'A' || rankValue(up.rank) === 10;
        // הסדר הביטוח
        for (const seat of this.seats) {
            if (seat.insuranceBet > 0) {
                seat.insuranceNet = dealerBJ ? seat.insuranceBet * 2 : -seat.insuranceBet;
                seat.bankroll += seat.insuranceNet;
            }
        }
        if (this.rules.dealerPeeks && peekable && dealerBJ) {
            this.revealHole();
            this.settle();
            return;
        }
        this.phase = 'playerTurn';
        // ידיים עם בלאק ג'ק טבעי מסתיימות מיד.
        for (const seat of this.seats) {
            for (const hand of seat.hands) {
                if (isBlackjack(hand.cards, hand.fromSplit))
                    hand.done = true;
            }
        }
        this.advance();
    }
    revealHole() {
        if (this.holeRevealed)
            return;
        this.holeRevealed = true;
        const hole = this.dealerCards[1];
        if (hole) {
            this.roundCards.push(hole);
            this.emit({ type: 'reveal', card: hole });
        }
    }
    /** המושב והיד שתורם לפעול כרגע, או null אם אין. */
    get current() {
        if (this.phase !== 'playerTurn')
            return null;
        for (const seat of this.seats) {
            for (let i = 0; i < seat.hands.length; i++) {
                const hand = seat.hands[i];
                if (!hand.done) {
                    seat.activeHand = i;
                    return { seat, hand };
                }
            }
        }
        return null;
    }
    /** מקדם את המשחק: משחק אוטומטית עבור מושבי מחשב ועוצר כשתור המשתמש. */
    advance() {
        if (this.phase !== 'playerTurn')
            return;
        let guard = 0;
        while (guard++ < 500) {
            const cur = this.current;
            if (!cur) {
                this.startDealerTurn();
                return;
            }
            if (cur.seat.isUser)
                return;
            const action = this.botAction(cur.seat, cur.hand);
            this.applyAction(cur.seat, cur.hand, action);
        }
    }
    botAction(seat, hand) {
        const chart = buildChart(this.rules);
        const values = hand.cards.map((c) => (c.rank === 'A' ? 1 : rankValue(c.rank)));
        const up = this.dealerCards[0];
        const upValue = up.rank === 'A' ? 1 : rankValue(up.rank);
        const legal = this.legalActionsFor(seat, hand);
        const action = chartAction(chart, values, upValue, {
            canDouble: legal.includes('double'),
            canSplit: legal.includes('split'),
            canSurrender: legal.includes('surrender'),
        });
        return legal.includes(action) ? action : 'stand';
    }
    /** הפעולות החוקיות עבור היד הפעילה. */
    legalActions() {
        const cur = this.current;
        if (!cur)
            return [];
        return this.legalActionsFor(cur.seat, cur.hand);
    }
    legalActionsFor(seat, hand) {
        if (hand.done)
            return [];
        const actions = [];
        const hv = handValue(hand.cards);
        if (hv.busted || hv.total === 21)
            return [];
        const isFirstDecision = hand.cards.length === 2;
        const canHitSplitAces = !hand.splitAces || this.rules.hitSplitAces;
        if (canHitSplitAces)
            actions.push('hit');
        actions.push('stand');
        if (isFirstDecision && canHitSplitAces) {
            const allowedByRule = doubleAllowedForTotal(this.rules, hv.total, hv.soft);
            const dasOk = !hand.fromSplit || this.rules.doubleAfterSplit;
            if (allowedByRule && dasOk && seat.bankroll >= hand.bet)
                actions.push('double');
        }
        if (isFirstDecision && isPair(hand.cards)) {
            const handsCount = seat.hands.length;
            const acesPair = hand.cards[0].rank === 'A';
            const resplitOk = !hand.splitAces || this.rules.resplitAces;
            if (handsCount < this.rules.maxSplitHands && resplitOk && seat.bankroll >= hand.bet) {
                if (!acesPair || !hand.fromSplit || this.rules.resplitAces)
                    actions.push('split');
            }
        }
        if (this.rules.surrender === 'late' &&
            isFirstDecision &&
            !hand.fromSplit &&
            seat.hands.length === 1) {
            actions.push('surrender');
        }
        return actions;
    }
    /** ביצוע פעולה של המשתמש. */
    act(action) {
        const cur = this.current;
        if (!cur)
            return;
        if (!this.legalActionsFor(cur.seat, cur.hand).includes(action))
            return;
        this.applyAction(cur.seat, cur.hand, action);
        this.advance();
    }
    applyAction(seat, hand, action) {
        const handIndex = seat.hands.indexOf(hand);
        this.emit({ type: 'action', seatId: seat.id, handIndex, action });
        switch (action) {
            case 'hit': {
                this.drawTo(seat.id, handIndex, hand);
                const hv = handValue(hand.cards);
                if (hv.busted || hv.total === 21)
                    hand.done = true;
                break;
            }
            case 'stand':
                hand.done = true;
                break;
            case 'double': {
                hand.bet *= 2;
                hand.doubled = true;
                this.drawTo(seat.id, handIndex, hand);
                hand.done = true;
                break;
            }
            case 'surrender':
                hand.surrendered = true;
                hand.done = true;
                break;
            case 'split': {
                const moved = hand.cards.pop();
                const acesPair = hand.cards[0].rank === 'A';
                const newer = newHand(hand.bet, true, acesPair);
                hand.fromSplit = true;
                hand.splitAces = acesPair;
                if (moved)
                    newer.cards.push(moved);
                seat.hands.splice(handIndex + 1, 0, newer);
                this.drawTo(seat.id, handIndex, hand);
                this.drawTo(seat.id, handIndex + 1, newer);
                if (acesPair && !this.rules.hitSplitAces) {
                    hand.done = true;
                    newer.done = true;
                }
                else {
                    if (handValue(hand.cards).total === 21)
                        hand.done = true;
                    if (handValue(newer.cards).total === 21)
                        newer.done = true;
                }
                break;
            }
        }
    }
    startDealerTurn() {
        this.phase = 'dealerTurn';
        this.revealHole();
        const liveHands = this.seats.some((s) => s.hands.some((h) => !h.surrendered && !handValue(h.cards).busted && !isBlackjack(h.cards, h.fromSplit)));
        if (liveHands)
            this.playDealer();
        this.settle();
    }
    /** הדילר משחק לפי החוקים: לוקח עד 17, ובמצב H17 גם ב-17 רכה. */
    playDealer() {
        this.revealHole();
        let guard = 0;
        while (guard++ < 20) {
            const hv = handValue(this.dealerCards);
            if (hv.busted)
                break;
            if (hv.total > 17)
                break;
            if (hv.total === 17 && !(hv.soft && this.rules.dealerHitsSoft17))
                break;
            if (hv.total < 17 || (hv.total === 17 && hv.soft && this.rules.dealerHitsSoft17)) {
                const card = this.shoe.draw();
                this.dealerCards.push(card);
                this.roundCards.push(card);
                this.emit({ type: 'deal', seatId: DEALER_ID, handIndex: 0, card, faceDown: false });
            }
        }
    }
    /** הסדר חשבונות והכרזת תוצאות. */
    settle() {
        this.revealHole();
        const dealerHv = handValue(this.dealerCards);
        const dealerBJ = this.dealerHasBlackjack();
        let userNet = 0;
        for (const seat of this.seats) {
            for (let i = 0; i < seat.hands.length; i++) {
                const hand = seat.hands[i];
                if (hand.outcome)
                    continue;
                const hv = handValue(hand.cards);
                const playerBJ = isBlackjack(hand.cards, hand.fromSplit);
                let outcome;
                let net;
                if (hand.surrendered) {
                    outcome = 'surrender';
                    net = -hand.bet / 2;
                }
                else if (playerBJ && dealerBJ) {
                    outcome = 'push';
                    net = 0;
                }
                else if (playerBJ) {
                    outcome = 'blackjack';
                    net = hand.bet * this.rules.blackjackPayout;
                }
                else if (dealerBJ) {
                    outcome = 'dealerBlackjack';
                    net = -hand.bet;
                }
                else if (hv.busted) {
                    outcome = 'bust';
                    net = -hand.bet;
                }
                else if (dealerHv.busted) {
                    outcome = 'win';
                    net = hand.bet;
                }
                else if (hv.total > dealerHv.total) {
                    outcome = 'win';
                    net = hand.bet;
                }
                else if (hv.total < dealerHv.total) {
                    outcome = 'lose';
                    net = -hand.bet;
                }
                else {
                    outcome = 'push';
                    net = 0;
                }
                hand.outcome = outcome;
                hand.net = net;
                seat.bankroll += net;
                if (seat.isUser)
                    userNet += net;
                this.emit({ type: 'outcome', seatId: seat.id, handIndex: i, outcome, net });
            }
            if (seat.isUser)
                userNet += seat.insuranceNet;
        }
        this.phase = 'roundOver';
        this.emit({ type: 'roundEnd', userNet });
    }
    /** סכום ההימור הכולל של מושב בסיבוב (כולל הכפלות ופיצולים). */
    totalWagered(seat) {
        return seat.hands.reduce((sum, h) => sum + h.bet, 0) + seat.insuranceBet;
    }
    /** נטו של המשתמש בסיבוב האחרון. */
    get userNet() {
        const seat = this.userSeat;
        return seat.hands.reduce((sum, h) => sum + h.net, 0) + seat.insuranceNet;
    }
}
//# sourceMappingURL=game.js.map