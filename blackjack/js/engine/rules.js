/** חוקי השולחן. כל חישובי האסטרטגיה, ה-EV והסימולציות נגזרים מהחוקים האלה. */
export const DEFAULT_RULES = {
    decks: 6,
    dealerHitsSoft17: false,
    blackjackPayout: 1.5,
    doubleAfterSplit: true,
    doubleRule: 'any2',
    surrender: 'late',
    maxSplitHands: 4,
    resplitAces: false,
    hitSplitAces: false,
    penetration: 0.75,
    insuranceOffered: true,
    dealerPeeks: true,
};
export function cloneRules(rules) {
    return { ...rules };
}
/** תיאור קצר של החוקים בעברית — מוצג בכל מסך שתלוי בחוקים. */
export function describeRulesHe(rules) {
    const parts = [];
    parts.push(`${rules.decks} חפיסות`);
    parts.push(rules.dealerHitsSoft17 ? 'דילר לוקח ב-17 רכה (H17)' : 'דילר עומד ב-17 רכה (S17)');
    parts.push(rules.blackjackPayout === 1.5 ? 'בלאק ג\'ק 3:2' : `בלאק ג'ק ${rules.blackjackPayout === 1.2 ? '6:5' : rules.blackjackPayout}`);
    parts.push(rules.doubleAfterSplit ? 'הכפלה אחרי פיצול (DAS)' : 'ללא הכפלה אחרי פיצול');
    parts.push(rules.surrender === 'late' ? 'כניעה מאוחרת' : 'ללא כניעה');
    parts.push(`חדירה ${Math.round(rules.penetration * 100)}%`);
    return parts.join(' · ');
}
/** האם מותר להכפיל יד בעלת הסכום הנתון לפי חוקי ההכפלה. */
export function doubleAllowedForTotal(rules, total, soft) {
    if (rules.doubleRule === 'any2')
        return true;
    if (soft)
        return false;
    if (rules.doubleRule === '9-11')
        return total >= 9 && total <= 11;
    return total === 10 || total === 11;
}
export const PENETRATION_OPTIONS = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85];
export const DECK_OPTIONS = [1, 2, 4, 6, 8];
//# sourceMappingURL=rules.js.map