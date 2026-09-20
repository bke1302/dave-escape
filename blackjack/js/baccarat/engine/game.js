import { createRng } from "../../engine/rng.js";
import { Shoe } from "../../engine/shoe.js";
import { baccaratCardValue, handTotal, isNaturalTotal } from "./hand.js";
import { netPayout } from "./rules.js";
import { bankerDraws, explainBankerRuleHe, explainPlayerRuleHe, playerDraws } from "./thirdCard.js";
export const OUTCOME_LABEL_HE = {
    player: 'שחקן (Player)',
    banker: 'בנקאי (Banker)',
    tie: 'תיקו (Tie)',
};
export const OUTCOME_SHORT_HE = {
    player: 'P',
    banker: 'B',
    tie: 'T',
};
export const BET_LABEL_HE = {
    player: 'שחקן',
    banker: 'בנקאי',
    tie: 'תיקו',
};
export class BaccaratGame {
    rules;
    shoe;
    history = [];
    roundNumber = 0;
    constructor(rules, rng) {
        this.rules = rules;
        this.shoe = new Shoe(rules.decks, rules.penetration, rng ?? createRng());
    }
    /** האם צריך לערבב לפני הסיבוב הבא. */
    get needsShuffle() {
        return this.shoe.needsShuffle;
    }
    /** מחלק יד שלמה ומחזיר את התוצאה. */
    playRound() {
        if (this.shoe.needsShuffle)
            this.shoe.shuffle();
        this.roundNumber++;
        const playerCards = [];
        const bankerCards = [];
        const steps = [];
        // סדר החלוקה: שחקן, בנקאי, שחקן, בנקאי
        playerCards.push(this.shoe.draw());
        bankerCards.push(this.shoe.draw());
        playerCards.push(this.shoe.draw());
        bankerCards.push(this.shoe.draw());
        let playerTotal = handTotal(playerCards);
        let bankerTotal = handTotal(bankerCards);
        steps.push(`שחקן: ${playerTotal} · בנקאי: ${bankerTotal}`);
        const natural = isNaturalTotal(playerTotal, 2) || isNaturalTotal(bankerTotal, 2);
        let playerThirdValue = null;
        let playerDrew = false;
        let bankerDrew = false;
        if (natural) {
            steps.push(explainPlayerRuleHe(playerTotal, true));
        }
        else {
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
        const outcome = playerTotal > bankerTotal ? 'player' : bankerTotal > playerTotal ? 'banker' : 'tie';
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
    settleBet(bet, amount, round) {
        if (amount <= 0)
            return 0;
        if (round.outcome === 'tie') {
            if (bet === 'tie')
                return netPayout(this.rules, 'tie', amount, round.bankerTotal);
            return 0; // הימורי שחקן/בנקאי חוזרים בתיקו
        }
        if (bet === 'tie')
            return -amount;
        if (bet === round.outcome)
            return netPayout(this.rules, bet, amount, round.bankerTotal);
        return -amount;
    }
}
/** משחק סיבוב בודד מתוך ערכי קלפים נתונים — לשימוש בתרגילים ובבדיקות. */
export function resolveFromValues(playerValues, bankerValues) {
    const playerTotal = playerValues.reduce((a, b) => a + b, 0) % 10;
    const bankerTotal = bankerValues.reduce((a, b) => a + b, 0) % 10;
    return {
        playerTotal,
        bankerTotal,
        outcome: playerTotal > bankerTotal ? 'player' : bankerTotal > playerTotal ? 'banker' : 'tie',
    };
}
//# sourceMappingURL=game.js.map