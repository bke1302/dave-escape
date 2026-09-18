/** ספירת קלפים Hi-Lo: ספירה רצה, ספירה אמיתית, הערכת חפיסות ורמפת הימורים. */
import { hiLoValue } from "./cards.js";
/** ערכי Hi-Lo: 2-6 = +1, 7-9 = 0, 10/J/Q/K/A = -1. */
export function countValue(rank) {
    return hiLoValue(rank);
}
/** ספירה רצה (Running Count) של רצף קלפים. */
export function runningCount(cards) {
    return cards.reduce((sum, c) => sum + hiLoValue(c.rank), 0);
}
export function runningCountOfRanks(ranks) {
    return ranks.reduce((sum, r) => sum + hiLoValue(r), 0);
}
/**
 * ספירה אמיתית (True Count) = ספירה רצה / חפיסות שנותרו.
 * ברירת המחדל היא עיגול כלפי מטה בערך מוחלט (השיטה השמרנית הנפוצה):
 * +2.8 → +2, ‎-2.8 → ‎-2.
 */
export function trueCount(running, decksRemaining, rounding = 'floor') {
    if (decksRemaining <= 0)
        return running;
    const raw = running / decksRemaining;
    if (rounding === 'exact')
        return raw;
    if (rounding === 'round')
        return Math.round(raw);
    return raw >= 0 ? Math.floor(raw) : Math.ceil(raw);
}
/** האם תשובת המשתמש לספירה אמיתית נחשבת נכונה (סובלנות של חצי נקודה). */
export function isTrueCountAnswerCorrect(answer, running, decksRemaining) {
    const exact = trueCount(running, decksRemaining, 'exact');
    return Math.abs(answer - exact) <= 0.5 + 1e-9;
}
export const SPREAD_OPTIONS = [4, 6, 8, 10, 12, 16];
/**
 * רמפת הימורים סטנדרטית לספירת Hi-Lo: מספר היחידות = True Count פחות 1,
 * מוגבל בין יחידה אחת למקסימום שהוגדר. ב-True Count של 1 ומטה מהמרים יחידה אחת.
 */
export function unitsForTrueCount(tc, spread) {
    const units = Math.floor(tc) - 1;
    return Math.min(spread.maxUnits, Math.max(1, units));
}
export function betForTrueCount(tc, spread) {
    return unitsForTrueCount(tc, spread) * spread.unit;
}
/**
 * הערכת תוחלת לפי ספירה — קירוב ליניארי מקובל עבור Hi-Lo:
 * כל נקודת True Count מוסיפה כ-0.5% לתוחלת השחקן מעל יתרון הבית הבסיסי.
 * baseEv הוא תוחלת הסיבוב המדויקת שחושבה עבור חוקי השולחן (ראו evEngine).
 * זהו קירוב — התוחלת בפועל תלויה גם בהרכב המדויק של הנעל.
 */
export function evAtTrueCount(baseEv, tc, perPointGain = 0.005) {
    return baseEv + tc * perPointGain;
}
/** כמה קלפים בערך נשארו לפי הערכת חפיסות. */
export function cardsFromDecks(decks) {
    return Math.round(decks * 52);
}
/** הערכת חפיסות שנותרו — מעוגל לחצי חפיסה הקרוב (כך מעריכים בפועל). */
export function estimateDecksRemaining(cardsRemaining) {
    return Math.round((cardsRemaining / 52) * 2) / 2;
}
/** סובלנות מקובלת בהערכת חפיסות: חצי חפיסה. */
export function isDeckEstimateCorrect(answer, actualDecks, tolerance = 0.5) {
    return Math.abs(answer - actualDecks) <= tolerance + 1e-9;
}
/** הרכב נעל משוער התואם ספירה רצה נתונה — לחישוב EV לפי ספירה. */
export function compositionForCount(decksRemaining, running) {
    const comp = new Array(11).fill(0);
    const cards = Math.max(52 * 0.25, decksRemaining * 52);
    const perRank = cards / 13;
    for (let v = 1; v <= 9; v++)
        comp[v] = perRank;
    comp[10] = perRank * 4;
    // ספירה חיובית = יצאו קלפים נמוכים. מסירים באופן שווה מ-2..6 (או מ-10/A בספירה שלילית).
    const magnitude = Math.abs(running);
    if (magnitude > 0) {
        if (running > 0) {
            const perLow = magnitude / 5;
            for (let v = 2; v <= 6; v++)
                comp[v] = Math.max(0, comp[v] - perLow);
        }
        else {
            // ספירה שלילית = יצאו קלפים גבוהים (10 ואס). מחלקים לפי יחסם בחפיסה (16:4).
            comp[10] = Math.max(0, comp[10] - magnitude * 0.8);
            comp[1] = Math.max(0, comp[1] - magnitude * 0.2);
        }
    }
    return comp;
}
//# sourceMappingURL=counting.js.map