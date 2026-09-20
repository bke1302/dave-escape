/**
 * מנוע סיבוב באקרה (Punto Banco).
 * לשחקן אין החלטות במהלך היד — המערכת מיישמת את חוקי הקלף השלישי.
 */
import type { Card } from '../../engine/cards.ts';
import { createRng, type Rng } from '../../engine/rng.ts';
import { Shoe } from '../../engine/shoe.ts';
import { baccaratCardValue, handTotal, isNaturalTotal } from './hand.ts';
import { netPayout, type BaccaratRules } from './rules.ts';
import { bankerDraws, explainBankerRuleHe, explainPlayerRuleHe, playerDraws } from './thirdCard.ts';

export type BetType = 'player' | 'banker' | 'tie';
export type Outcome = 'player' | 'banker' | 'tie';

export const OUTCOME_LABEL_HE: Record<Outcome, string> = {
  player: 'שחקן (Player)',
  banker: 'בנקאי (Banker)',
  tie: 'תיקו (Tie)',
};

export const OUTCOME_SHORT_HE: Record<Outcome, string> = {
  player: 'P',
  banker: 'B',
  tie: 'T',
};

export const BET_LABEL_HE: Record<BetType, string> = {
  player: 'שחקן',
  banker: 'בנקאי',
  tie: 'תיקו',
};

export interface BaccaratRound {
  playerCards: Card[];
  bankerCards: Card[];
  playerTotal: number;
  bankerTotal: number;
  outcome: Outcome;
  /** היד הסתיימה ב-Natural (8 או 9 בשני קלפים). */
  natural: boolean;
  /** ערך הקלף השלישי של השחקן, או null אם לא לקח. */
  playerThirdValue: number | null;
  playerDrew: boolean;
  bankerDrew: boolean;
  /** שלבי ההסבר בעברית — לשימוש בלימוד ובאימונים. */
  steps: string[];
}

export class BaccaratGame {
  rules: BaccaratRules;
  shoe: Shoe;
  history: Outcome[] = [];
  roundNumber = 0;

  constructor(rules: BaccaratRules, rng?: Rng) {
    this.rules = rules;
    this.shoe = new Shoe(rules.decks, rules.penetration, rng ?? createRng());
  }

  /** האם צריך לערבב לפני הסיבוב הבא. */
  get needsShuffle(): boolean {
    return this.shoe.needsShuffle;
  }

  /** מחלק יד שלמה ומחזיר את התוצאה. */
  playRound(): BaccaratRound {
    if (this.shoe.needsShuffle) this.shoe.shuffle();
    this.roundNumber++;

    const playerCards: Card[] = [];
    const bankerCards: Card[] = [];
    const steps: string[] = [];

    // סדר החלוקה: שחקן, בנקאי, שחקן, בנקאי
    playerCards.push(this.shoe.draw());
    bankerCards.push(this.shoe.draw());
    playerCards.push(this.shoe.draw());
    bankerCards.push(this.shoe.draw());

    let playerTotal = handTotal(playerCards);
    let bankerTotal = handTotal(bankerCards);
    steps.push(`שחקן: ${playerTotal} · בנקאי: ${bankerTotal}`);

    const natural = isNaturalTotal(playerTotal, 2) || isNaturalTotal(bankerTotal, 2);
    let playerThirdValue: number | null = null;
    let playerDrew = false;
    let bankerDrew = false;

    if (natural) {
      steps.push(explainPlayerRuleHe(playerTotal, true));
    } else {
      steps.push(explainPlayerRuleHe(playerTotal, false));
      if (playerDraws(playerTotal)) {
        const card = this.shoe.draw();
        playerCards.push(card);
        playerDrew = true;
        playerThirdValue = baccaratCardValue(card);
        playerTotal = handTotal(playerCards);
        steps.push(`השחקן קיבל ${playerThirdValue} → סכום ${playerTotal}`);
      }

      steps.push(explainBankerRuleHe(bankerTotal, playerThirdValue));
      if (bankerDraws(bankerTotal, playerThirdValue)) {
        const card = this.shoe.draw();
        bankerCards.push(card);
        bankerDrew = true;
        bankerTotal = handTotal(bankerCards);
        steps.push(`הבנקאי קיבל ${baccaratCardValue(card)} → סכום ${bankerTotal}`);
      }
    }

    const outcome: Outcome =
      playerTotal > bankerTotal ? 'player' : bankerTotal > playerTotal ? 'banker' : 'tie';
    steps.push(`תוצאה: ${OUTCOME_LABEL_HE[outcome]} (${playerTotal} מול ${bankerTotal})`);

    this.history.push(outcome);
    return {
      playerCards,
      bankerCards,
      playerTotal,
      bankerTotal,
      outcome,
      natural,
      playerThirdValue,
      playerDrew,
      bankerDrew,
      steps,
    };
  }

  /** רווח/הפסד נטו של הימור נתון (לא כולל החזר ההימור עצמו). */
  settleBet(bet: BetType, amount: number, round: BaccaratRound): number {
    if (amount <= 0) return 0;
    if (round.outcome === 'tie') {
      if (bet === 'tie') return netPayout(this.rules, 'tie', amount, round.bankerTotal);
      return 0; // הימורי שחקן/בנקאי חוזרים בתיקו
    }
    if (bet === 'tie') return -amount;
    if (bet === round.outcome) return netPayout(this.rules, bet, amount, round.bankerTotal);
    return -amount;
  }
}

/** משחק סיבוב בודד מתוך ערכי קלפים נתונים — לשימוש בתרגילים ובבדיקות. */
export function resolveFromValues(
  playerValues: number[],
  bankerValues: number[],
): { playerTotal: number; bankerTotal: number; outcome: Outcome } {
  const playerTotal = playerValues.reduce((a, b) => a + b, 0) % 10;
  const bankerTotal = bankerValues.reduce((a, b) => a + b, 0) % 10;
  return {
    playerTotal,
    bankerTotal,
    outcome: playerTotal > bankerTotal ? 'player' : bankerTotal > playerTotal ? 'banker' : 'tie',
  };
}
