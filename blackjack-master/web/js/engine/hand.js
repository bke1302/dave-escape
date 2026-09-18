/** חישובי יד: ערך, רכות (soft), בלאק ג'ק, פשיטה (bust). */
import { rankValue } from "./cards.js";
/** מחשב ערך יד: אסים נספרים כ-11 ומוקטנים ל-1 לפי הצורך. */
export function handValue(cards) {
    return handValueFromRanks(cards.map((c) => c.rank));
}
export function handValueFromRanks(ranks) {
    let total = 0;
    let aces = 0;
    for (const rank of ranks) {
        const v = rankValue(rank);
        total += v;
        if (rank === 'A')
            aces++;
    }
    let soft = aces > 0;
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    soft = aces > 0 && total <= 21;
    return { total, soft, busted: total > 21 };
}
/** ערך יד מתוך סכום ערכי קלפים (1..10) — למנוע ה-EV. */
export function totalFromValues(values) {
    let total = 0;
    let aces = 0;
    for (const v of values) {
        if (v === 1) {
            aces++;
            total += 11;
        }
        else
            total += v;
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return { total, soft: aces > 0 && total <= 21, busted: total > 21 };
}
/** בלאק ג'ק = בדיוק שני הקלפים הראשונים בסכום 21 (ואינו יד שנוצרה מפיצול). */
export function isBlackjack(cards, fromSplit = false) {
    if (fromSplit)
        return false;
    if (cards.length !== 2)
        return false;
    return handValue(cards).total === 21;
}
export function isBusted(cards) {
    return handValue(cards).busted;
}
/** האם היד זוג הניתן לפיצול (לפי ערך הקלף — 10/J/Q/K נחשבים זהים). */
export function isPair(cards) {
    if (cards.length !== 2)
        return false;
    return rankValue(cards[0].rank) === rankValue(cards[1].rank);
}
/** האם זוג אסים. */
export function isAcePair(cards) {
    return cards.length === 2 && cards[0].rank === 'A' && cards[1].rank === 'A';
}
/** תיאור היד בעברית, למשל "רכה 18" או "קשה 16". */
export function describeHandHe(cards) {
    const { total, soft, busted } = handValue(cards);
    if (busted)
        return `נפסל (${total})`;
    if (isBlackjack(cards))
        return 'בלאק ג\'ק!';
    return soft ? `רכה ${total}` : `קשה ${total}`;
}
//# sourceMappingURL=hand.js.map