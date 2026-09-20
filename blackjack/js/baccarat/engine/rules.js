/**
 * חוקי שולחן באקרה (Punto Banco).
 * כל התשלומים והעמלות נגזרים מכאן — אין מספרים קבועים בקוד החישוב.
 */
export const DEFAULT_BACCARAT_RULES = {
    decks: 8,
    penetration: 0.85,
    commissionMode: 'commission',
    commissionRate: 0.05,
    bankerSixPayout: 0.5,
    tiePayout: 8,
};
export const DECK_OPTIONS_BACCARAT = [6, 8];
export const TIE_PAYOUT_OPTIONS = [8, 9];
export function cloneBaccaratRules(rules) {
    return { ...rules };
}
/** תיאור החוקים בעברית — מוצג בכל מסך שתלוי בהם. */
export function describeBaccaratRulesHe(rules) {
    const parts = [`${rules.decks} חפיסות`];
    if (rules.commissionMode === 'commission') {
        parts.push(`עמלת בנקאי ${(rules.commissionRate * 100).toFixed(0)}%`);
    }
    else {
        parts.push(rules.bankerSixPayout === 1
            ? 'ללא עמלה (תשלום מלא)'
            : `ללא עמלה · בנקאי עם 6 משלם ${rules.bankerSixPayout === 0.5 ? '1:2' : rules.bankerSixPayout}`);
    }
    parts.push(`תיקו ${rules.tiePayout}:1`);
    parts.push(`חדירה ${Math.round(rules.penetration * 100)}%`);
    return parts.join(' · ');
}
/**
 * התשלום נטו (ללא החזר ההימור) על ניצחון בהימור נתון.
 * bankerTotal נדרש רק לחוק "ללא עמלה".
 */
export function netPayout(rules, bet, amount, bankerTotal) {
    if (bet === 'player')
        return amount;
    if (bet === 'tie')
        return amount * rules.tiePayout;
    // בנקאי
    if (rules.commissionMode === 'commission')
        return amount * (1 - rules.commissionRate);
    return bankerTotal === 6 ? amount * rules.bankerSixPayout : amount;
}
//# sourceMappingURL=rules.js.map