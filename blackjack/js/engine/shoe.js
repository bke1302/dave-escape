/** נעל קלפים (Shoe) אמיתית: חפיסות מרובות, ערבוב Fisher-Yates וכרטיס חיתוך (penetration). */
import { buildShoeCards, hiLoValueOfCard } from "./cards.js";
import { fisherYatesShuffle } from "./rng.js";
export class Shoe {
    decks;
    /** חדירה — איזה חלק מהנעל מחולק לפני ערבוב. לדוגמה 0.75 = 75%. */
    penetration;
    cards = [];
    index = 0;
    rng;
    /** ספירה רצה (Running Count) לפי Hi-Lo של כל הקלפים שיצאו מהנעל. */
    runningCount = 0;
    shuffleCount = 0;
    /** דגל שנדלק כאשר הגיעו לכרטיס החיתוך — הסיבוב הנוכחי מסתיים ואז מערבבים. */
    cutCardReached = false;
    constructor(decks, penetration, rng) {
        this.decks = decks;
        this.penetration = penetration;
        this.rng = rng;
        this.shuffle();
    }
    shuffle() {
        this.cards = fisherYatesShuffle(buildShoeCards(this.decks), this.rng);
        this.index = 0;
        this.runningCount = 0;
        this.cutCardReached = false;
        this.shuffleCount++;
    }
    get totalCards() {
        return this.decks * 52;
    }
    get cardsDealt() {
        return this.index;
    }
    get cardsRemaining() {
        return this.cards.length - this.index;
    }
    /** חפיסות שנותרו (שבר עשרוני) — בסיס לחישוב True Count. */
    get decksRemaining() {
        return this.cardsRemaining / 52;
    }
    /** מספר הקלפים שאחריו מוצב כרטיס החיתוך. */
    get cutCardPosition() {
        return Math.floor(this.totalCards * this.penetration);
    }
    /** ספירה אמיתית (True Count) = ספירה רצה / חפיסות שנותרו. */
    get trueCount() {
        const decksLeft = this.decksRemaining;
        if (decksLeft <= 0.05)
            return this.runningCount * 20;
        return this.runningCount / decksLeft;
    }
    /** שליפת קלף. אם הנעל התרוקנה — מערבבים מיד (הגנה מפני "המצאת" קלפים). */
    draw() {
        if (this.index >= this.cards.length)
            this.shuffle();
        const card = this.cards[this.index++];
        this.runningCount += hiLoValueOfCard(card);
        if (this.index >= this.cutCardPosition)
            this.cutCardReached = true;
        return card;
    }
    /** האם צריך לערבב לפני הסיבוב הבא. */
    get needsShuffle() {
        return this.cutCardReached;
    }
    /** קלפים שכבר יצאו — לשימוש במסכי אימון והערכת חפיסות. */
    dealtCards() {
        return this.cards.slice(0, this.index);
    }
    /** הרכב הנעל שנותר, לפי ערך קלף 1..10 (אס = 1). לשימוש מנוע ה-EV. */
    remainingComposition() {
        const comp = new Array(11).fill(0);
        for (let i = this.index; i < this.cards.length; i++) {
            const r = this.cards[i].rank;
            if (r === 'A')
                comp[1]++;
            else if (r === 'K' || r === 'Q' || r === 'J' || r === '10')
                comp[10]++;
            else
                comp[Number(r)]++;
        }
        return comp;
    }
}
//# sourceMappingURL=shoe.js.map