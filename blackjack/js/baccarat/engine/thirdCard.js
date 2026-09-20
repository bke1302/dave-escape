/**
 * חוקי הקלף השלישי (Third Card Rules) — Punto Banco.
 *
 * אלה חוקים קבועים של המשחק; לשחקן ולבנקאי אין שיקול דעת. סדר הבדיקה:
 *  1. אם ליד כלשהי יש Natural (8 או 9 בשני קלפים) — היד נעצרת מיד.
 *  2. השחקן: לוקח קלף שלישי בסכום 0-5, עומד ב-6-7.
 *  3. הבנקאי:
 *     • אם השחקן לא לקח קלף — הבנקאי לוקח ב-0-5 ועומד ב-6-7.
 *     • אם השחקן לקח קלף שלישי בערך t:
 *         סכום 0-2 → לוקח תמיד
 *         סכום 3   → לוקח אלא אם t = 8
 *         סכום 4   → לוקח אם t בין 2 ל-7
 *         סכום 5   → לוקח אם t בין 4 ל-7
 *         סכום 6   → לוקח אם t הוא 6 או 7
 *         סכום 7   → עומד תמיד
 */
/** האם השחקן לוקח קלף שלישי (בהנחה שאין Natural). */
export function playerDraws(playerTotal) {
    return playerTotal <= 5;
}
/**
 * האם הבנקאי לוקח קלף שלישי.
 * playerThird = ערך הקלף השלישי של השחקן, או null אם השחקן עמד.
 */
export function bankerDraws(bankerTotal, playerThird) {
    if (playerThird === null)
        return bankerTotal <= 5;
    if (bankerTotal <= 2)
        return true;
    if (bankerTotal === 3)
        return playerThird !== 8;
    if (bankerTotal === 4)
        return playerThird >= 2 && playerThird <= 7;
    if (bankerTotal === 5)
        return playerThird >= 4 && playerThird <= 7;
    if (bankerTotal === 6)
        return playerThird === 6 || playerThird === 7;
    return false; // 7 ומעלה — עומד
}
/** הסבר בעברית לכלל השחקן. */
export function explainPlayerRuleHe(playerTotal, natural) {
    if (natural)
        return 'יש Natural על השולחן (8 או 9 בשני קלפים) — אף אחד לא לוקח קלף נוסף.';
    return playerDraws(playerTotal)
        ? `לשחקן ${playerTotal} — בסכום 0 עד 5 השחקן תמיד לוקח קלף שלישי.`
        : `לשחקן ${playerTotal} — בסכום 6 או 7 השחקן תמיד עומד.`;
}
/** הסבר בעברית לכלל הבנקאי. */
export function explainBankerRuleHe(bankerTotal, playerThird) {
    if (playerThird === null) {
        return bankerDraws(bankerTotal, null)
            ? `השחקן עמד, ולכן הבנקאי משחק כמו השחקן: עם ${bankerTotal} (0-5) הוא לוקח קלף.`
            : `השחקן עמד, ולכן הבנקאי משחק כמו השחקן: עם ${bankerTotal} (6-7) הוא עומד.`;
    }
    const draws = bankerDraws(bankerTotal, playerThird);
    const rule = bankerTotal <= 2
        ? 'עם 0 עד 2 הבנקאי לוקח תמיד, בלי קשר לקלף של השחקן'
        : bankerTotal === 3
            ? 'עם 3 הבנקאי לוקח אלא אם הקלף השלישי של השחקן הוא 8'
            : bankerTotal === 4
                ? 'עם 4 הבנקאי לוקח רק אם הקלף השלישי של השחקן הוא 2 עד 7'
                : bankerTotal === 5
                    ? 'עם 5 הבנקאי לוקח רק אם הקלף השלישי של השחקן הוא 4 עד 7'
                    : bankerTotal === 6
                        ? 'עם 6 הבנקאי לוקח רק אם הקלף השלישי של השחקן הוא 6 או 7'
                        : 'עם 7 הבנקאי עומד תמיד';
    return `לבנקאי ${bankerTotal}, הקלף השלישי של השחקן הוא ${playerThird}. ${rule} — ולכן הבנקאי ${draws ? 'לוקח קלף' : 'עומד'}.`;
}
export function bankerRuleTable() {
    const rows = [];
    for (let total = 0; total <= 7; total++) {
        const drawsOn = [];
        for (let third = 0; third <= 9; third++) {
            if (bankerDraws(total, third))
                drawsOn.push(third);
        }
        const summary = drawsOn.length === 10
            ? 'לוקח תמיד'
            : drawsOn.length === 0
                ? 'עומד תמיד'
                : `לוקח מול ${drawsOn.join(', ')}`;
        rows.push({ bankerTotal: total, drawsOn, summary });
    }
    return rows;
}
//# sourceMappingURL=thirdCard.js.map