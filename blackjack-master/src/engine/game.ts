/**
 * מנוע המשחק — מכונת מצבים מלאה לסיבוב בלאק ג'ק.
 * תומך בכמה מושבים (שחקן + שחקנים ממוחשבים לסימולציית קזינו),
 * פיצולים מרובים, הכפלה, ביטוח, כניעה ובדיקת בלאק ג'ק של הדילר.
 */
import type { Card } from './cards.ts';
import { rankValue } from './cards.ts';
import { handValue, isBlackjack, isPair } from './hand.ts';
import { doubleAllowedForTotal, type Rules } from './rules.ts';
import { Shoe } from './shoe.ts';
import { createRng, type Rng } from './rng.ts';
import { buildChart, chartAction, type PlayAction } from './basicStrategy.ts';

export type Phase = 'idle' | 'insurance' | 'playerTurn' | 'dealerTurn' | 'roundOver';

export type Outcome =
  | 'blackjack'
  | 'win'
  | 'push'
  | 'lose'
  | 'bust'
  | 'surrender'
  | 'dealerBlackjack';

export const OUTCOME_LABEL_HE: Record<Outcome, string> = {
  blackjack: 'בלאק ג\'ק!',
  win: 'ניצחון',
  push: 'תיקו (Push)',
  lose: 'הפסד',
  bust: 'נפסלת (Bust)',
  surrender: 'כניעה',
  dealerBlackjack: 'בלאק ג\'ק לדילר',
};

export interface Hand {
  cards: Card[];
  /** סך ההימור על היד (לאחר הכפלה — כפול). */
  bet: number;
  doubled: boolean;
  surrendered: boolean;
  fromSplit: boolean;
  splitAces: boolean;
  done: boolean;
  outcome?: Outcome;
  /** רווח/הפסד נטו של היד לאחר הסדר. */
  net: number;
}

export interface Seat {
  id: string;
  name: string;
  isUser: boolean;
  hands: Hand[];
  activeHand: number;
  insuranceBet: number;
  insuranceNet: number;
  bankroll: number;
  /** ההימור הבסיסי של הסיבוב הנוכחי. */
  baseBet: number;
}

export interface SeatConfig {
  id: string;
  name: string;
  isUser?: boolean;
  bankroll?: number;
}

export type GameEvent =
  | { type: 'shuffle' }
  | { type: 'deal'; seatId: string; handIndex: number; card: Card; faceDown: boolean }
  | { type: 'reveal'; card: Card }
  | { type: 'action'; seatId: string; handIndex: number; action: PlayAction }
  | { type: 'insurance'; seatId: string; amount: number }
  | { type: 'outcome'; seatId: string; handIndex: number; outcome: Outcome; net: number }
  | { type: 'roundEnd'; userNet: number };

export const DEALER_ID = 'dealer';

function newHand(bet: number, fromSplit = false, splitAces = false): Hand {
  return { cards: [], bet, doubled: false, surrendered: false, fromSplit, splitAces, done: false, net: 0 };
}

export class BlackjackGame {
  rules: Rules;
  shoe: Shoe;
  seats: Seat[];
  dealerCards: Card[] = [];
  holeRevealed = false;
  phase: Phase = 'idle';
  events: GameEvent[] = [];
  /** כל הקלפים שנחשפו בסיבוב הנוכחי (לפי סדר) — לשימוש מסכי ספירה. */
  roundCards: Card[] = [];
  roundNumber = 0;
  private rng: Rng;
  /** ספירה רצה גלויה בתחילת הסיבוב (לשאלות "מה הייתה הספירה"). */
  countAtRoundStart = 0;

  constructor(rules: Rules, seatConfigs: SeatConfig[] = [{ id: 'user', name: 'אתה', isUser: true }], rng?: Rng) {
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

  get userSeat(): Seat {
    return this.seats.find((s) => s.isUser) ?? this.seats[0];
  }

  get dealerUpCard(): Card | null {
    return this.dealerCards[0] ?? null;
  }

  /** הקלף הסמוי — נגיש רק לאחר חשיפה (מונע "הצצה" מה-UI). */
  get dealerHoleCard(): Card | null {
    return this.holeRevealed ? this.dealerCards[1] ?? null : null;
  }

  private emit(event: GameEvent): void {
    this.events.push(event);
  }

  private drawTo(seatId: string, handIndex: number, hand: Hand | null, faceDown = false): Card {
    const card = this.shoe.draw();
    if (hand) hand.cards.push(card);
    else this.dealerCards.push(card);
    if (!faceDown) this.roundCards.push(card);
    this.emit({ type: 'deal', seatId, handIndex, card, faceDown });
    return card;
  }

  /** מתחיל סיבוב חדש. bets — הימור לכל מושב לפי מזהה. */
  startRound(bets: Record<string, number>): void {
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
      if (seat.hands.length) this.drawTo(seat.id, 0, seat.hands[0]);
    }
    this.drawTo(DEALER_ID, 0, null);
    for (const seat of this.seats) {
      if (seat.hands.length) this.drawTo(seat.id, 0, seat.hands[0]);
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
  takeInsurance(seatId: string, amount: number): void {
    const seat = this.seats.find((s) => s.id === seatId);
    if (!seat || this.phase !== 'insurance' || !seat.hands.length) return;
    const max = seat.hands[0].bet / 2;
    seat.insuranceBet = Math.min(Math.max(0, amount), max);
    this.emit({ type: 'insurance', seatId, amount: seat.insuranceBet });
  }

  /** סיום שלב הביטוח והמשך לבדיקת בלאק ג'ק. */
  resolveInsurance(): void {
    if (this.phase !== 'insurance') return;
    this.afterInsurance();
  }

  private dealerHasBlackjack(): boolean {
    return this.dealerCards.length === 2 && handValue(this.dealerCards).total === 21;
  }

  private afterInsurance(): void {
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
        if (isBlackjack(hand.cards, hand.fromSplit)) hand.done = true;
      }
    }
    this.advance();
  }

  private revealHole(): void {
    if (this.holeRevealed) return;
    this.holeRevealed = true;
    const hole = this.dealerCards[1];
    if (hole) {
      this.roundCards.push(hole);
      this.emit({ type: 'reveal', card: hole });
    }
  }

  /** המושב והיד שתורם לפעול כרגע, או null אם אין. */
  get current(): { seat: Seat; hand: Hand } | null {
    if (this.phase !== 'playerTurn') return null;
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
  advance(): void {
    if (this.phase !== 'playerTurn') return;
    let guard = 0;
    while (guard++ < 500) {
      const cur = this.current;
      if (!cur) {
        this.startDealerTurn();
        return;
      }
      if (cur.seat.isUser) return;
      const action = this.botAction(cur.seat, cur.hand);
      this.applyAction(cur.seat, cur.hand, action);
    }
  }

  private botAction(seat: Seat, hand: Hand): PlayAction {
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
  legalActions(): PlayAction[] {
    const cur = this.current;
    if (!cur) return [];
    return this.legalActionsFor(cur.seat, cur.hand);
  }

  legalActionsFor(seat: Seat, hand: Hand): PlayAction[] {
    if (hand.done) return [];
    const actions: PlayAction[] = [];
    const hv = handValue(hand.cards);
    if (hv.busted || hv.total === 21) return [];

    const isFirstDecision = hand.cards.length === 2;
    const canHitSplitAces = !hand.splitAces || this.rules.hitSplitAces;
    if (canHitSplitAces) actions.push('hit');
    actions.push('stand');

    if (isFirstDecision && canHitSplitAces) {
      const allowedByRule = doubleAllowedForTotal(this.rules, hv.total, hv.soft);
      const dasOk = !hand.fromSplit || this.rules.doubleAfterSplit;
      if (allowedByRule && dasOk && seat.bankroll >= hand.bet) actions.push('double');
    }

    if (isFirstDecision && isPair(hand.cards)) {
      const handsCount = seat.hands.length;
      const acesPair = hand.cards[0].rank === 'A';
      const resplitOk = !hand.splitAces || this.rules.resplitAces;
      if (handsCount < this.rules.maxSplitHands && resplitOk && seat.bankroll >= hand.bet) {
        if (!acesPair || !hand.fromSplit || this.rules.resplitAces) actions.push('split');
      }
    }

    if (
      this.rules.surrender === 'late' &&
      isFirstDecision &&
      !hand.fromSplit &&
      seat.hands.length === 1
    ) {
      actions.push('surrender');
    }
    return actions;
  }

  /** ביצוע פעולה של המשתמש. */
  act(action: PlayAction): void {
    const cur = this.current;
    if (!cur) return;
    if (!this.legalActionsFor(cur.seat, cur.hand).includes(action)) return;
    this.applyAction(cur.seat, cur.hand, action);
    this.advance();
  }

  private applyAction(seat: Seat, hand: Hand, action: PlayAction): void {
    const handIndex = seat.hands.indexOf(hand);
    this.emit({ type: 'action', seatId: seat.id, handIndex, action });
    switch (action) {
      case 'hit': {
        this.drawTo(seat.id, handIndex, hand);
        const hv = handValue(hand.cards);
        if (hv.busted || hv.total === 21) hand.done = true;
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
        if (moved) newer.cards.push(moved);
        seat.hands.splice(handIndex + 1, 0, newer);
        this.drawTo(seat.id, handIndex, hand);
        this.drawTo(seat.id, handIndex + 1, newer);
        if (acesPair && !this.rules.hitSplitAces) {
          hand.done = true;
          newer.done = true;
        } else {
          if (handValue(hand.cards).total === 21) hand.done = true;
          if (handValue(newer.cards).total === 21) newer.done = true;
        }
        break;
      }
    }
  }

  private startDealerTurn(): void {
    this.phase = 'dealerTurn';
    this.revealHole();
    const liveHands = this.seats.some((s) =>
      s.hands.some((h) => !h.surrendered && !handValue(h.cards).busted && !isBlackjack(h.cards, h.fromSplit)),
    );
    if (liveHands) this.playDealer();
    this.settle();
  }

  /** הדילר משחק לפי החוקים: לוקח עד 17, ובמצב H17 גם ב-17 רכה. */
  playDealer(): void {
    this.revealHole();
    let guard = 0;
    while (guard++ < 20) {
      const hv = handValue(this.dealerCards);
      if (hv.busted) break;
      if (hv.total > 17) break;
      if (hv.total === 17 && !(hv.soft && this.rules.dealerHitsSoft17)) break;
      if (hv.total < 17 || (hv.total === 17 && hv.soft && this.rules.dealerHitsSoft17)) {
        const card = this.shoe.draw();
        this.dealerCards.push(card);
        this.roundCards.push(card);
        this.emit({ type: 'deal', seatId: DEALER_ID, handIndex: 0, card, faceDown: false });
      }
    }
  }

  /** הסדר חשבונות והכרזת תוצאות. */
  settle(): void {
    this.revealHole();
    const dealerHv = handValue(this.dealerCards);
    const dealerBJ = this.dealerHasBlackjack();
    let userNet = 0;

    for (const seat of this.seats) {
      for (let i = 0; i < seat.hands.length; i++) {
        const hand = seat.hands[i];
        if (hand.outcome) continue;
        const hv = handValue(hand.cards);
        const playerBJ = isBlackjack(hand.cards, hand.fromSplit);
        let outcome: Outcome;
        let net: number;

        if (hand.surrendered) {
          outcome = 'surrender';
          net = -hand.bet / 2;
        } else if (playerBJ && dealerBJ) {
          outcome = 'push';
          net = 0;
        } else if (playerBJ) {
          outcome = 'blackjack';
          net = hand.bet * this.rules.blackjackPayout;
        } else if (dealerBJ) {
          outcome = 'dealerBlackjack';
          net = -hand.bet;
        } else if (hv.busted) {
          outcome = 'bust';
          net = -hand.bet;
        } else if (dealerHv.busted) {
          outcome = 'win';
          net = hand.bet;
        } else if (hv.total > dealerHv.total) {
          outcome = 'win';
          net = hand.bet;
        } else if (hv.total < dealerHv.total) {
          outcome = 'lose';
          net = -hand.bet;
        } else {
          outcome = 'push';
          net = 0;
        }

        hand.outcome = outcome;
        hand.net = net;
        seat.bankroll += net;
        if (seat.isUser) userNet += net;
        this.emit({ type: 'outcome', seatId: seat.id, handIndex: i, outcome, net });
      }
      if (seat.isUser) userNet += seat.insuranceNet;
    }

    this.phase = 'roundOver';
    this.emit({ type: 'roundEnd', userNet });
  }

  /** סכום ההימור הכולל של מושב בסיבוב (כולל הכפלות ופיצולים). */
  totalWagered(seat: Seat): number {
    return seat.hands.reduce((sum, h) => sum + h.bet, 0) + seat.insuranceBet;
  }

  /** נטו של המשתמש בסיבוב האחרון. */
  get userNet(): number {
    const seat = this.userSeat;
    return seat.hands.reduce((sum, h) => sum + h.net, 0) + seat.insuranceNet;
  }
}
