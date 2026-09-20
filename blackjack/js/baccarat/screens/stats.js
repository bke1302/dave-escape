/** לוח הסטטיסטיקות של באקרה. */
import { h, money, num, pct, signedPct } from "../../ui/dom.js";
import { barChart, lineChart, progressRing } from "../../ui/components/charts.js";
import { button } from "../../ui/components/controls.js";
import { note, panel, screen, statTile } from "../../ui/components/layout.js";
import { navigate } from "../../ui/router.js";
import { BACCARAT_DOMAIN_LABEL_HE, baccarat, baccaratAccuracy, baccaratOverallAccuracy } from "../state.js";
import { baccaratCurrentLevel } from "../content/progression.js";
import { betMath } from "../engine/probability.js";
export function baccaratStatsScreen() {
    const b = baccarat();
    const domains = Object.keys(b.trainers);
    const totalAttempts = domains.reduce((sum, d) => sum + b.trainers[d].attempts, 0);
    const avgReaction = totalAttempts
        ? domains.reduce((sum, d) => sum + b.trainers[d].totalReactionMs, 0) / totalAttempts
        : 0;
    const resolved = b.wins + b.losses;
    const winRate = resolved ? b.wins / resolved : 0;
    const measuredEdge = b.totalWagered ? -b.netProfit / b.totalWagered : 0;
    const expected = betMath(b.rules);
    const element = screen({ title: 'סטטיסטיקות באקרה', subtitle: 'המשחק שלך במספרים' }, panel({ title: 'תמונת מצב', icon: '📈' }, h('div', { class: 'row-center', style: { gap: '18px' } }, progressRing(baccaratOverallAccuracy(b), pct(baccaratOverallAccuracy(b), 0), 'דיוק כולל'), h('div', { class: 'grid grid-2', style: { flex: '1' } }, statTile('ידיים', num(b.handsPlayed)), statTile('תרגילים', num(totalAttempts)), statTile('רמה', String(baccaratCurrentLevel(b).level)), statTile('רצף שיא', num(b.bestStreak))))), panel({ title: 'ההימורים שלך', icon: '🎯' }, b.handsPlayed
        ? barChart([
            { label: 'שחקן', value: b.betsPlayer, tone: 'neutral' },
            { label: 'בנקאי', value: b.betsBanker, tone: 'neutral' },
            { label: 'תיקו', value: b.betsTie, tone: 'neutral' },
        ], (v) => num(v))
        : h('p', { class: 'text-faint', text: 'עדיין לא שיחקת יד. התחל בשולחן.' }), h('div', { class: 'grid grid-3' }, statTile('ניצחונות', num(b.wins), pct(winRate, 1), 'good'), statTile('הפסדים', num(b.losses), undefined, 'bad'), statTile('תיקו (החזר)', num(b.pushes)))), panel({ title: 'תוצאות כספיות', icon: '💰' }, h('div', { class: 'grid grid-2' }, statTile('הון נוכחי', money(b.bankroll)), statTile('תוצאת מפגש', money(b.sessionNet), undefined, b.sessionNet >= 0 ? 'good' : 'bad'), statTile('תוצאה מצטברת', money(b.netProfit), undefined, b.netProfit >= 0 ? 'good' : 'bad'), statTile('סה״כ הוהמר', money(b.totalWagered)), statTile('שיא הון', money(b.peakBankroll)), statTile('ירידת שיא', money(b.maxDrawdown), 'Drawdown', 'bad'), statTile('רצף הפסדים', num(b.longestLoseStreak), undefined, 'bad'), statTile('רצף ניצחונות', num(b.longestWinStreak), undefined, 'good')), lineChart(b.bankrollHistory, { label: 'היסטוריית הון' }), b.totalWagered > 0
        ? h('p', {
            class: 'text-faint',
            text: `יתרון הבית שנמדד במשחק שלך: ${signedPct(measuredEdge)}. לשם השוואה, החישוב המדויק לחוקים שלך: בנקאי ${pct(expected[1].houseEdge, 2)} · שחקן ${pct(expected[0].houseEdge, 2)} · תיקו ${pct(expected[2].houseEdge, 2)}. בכמות ידיים קטנה הפער בין המדידה לחישוב הוא שונות, לא משמעות.`,
        })
        : null), panel({ title: 'דיוק לפי תחום', icon: '🧠' }, totalAttempts
        ? barChart(domains
            .filter((d) => b.trainers[d].attempts > 0)
            .map((d) => ({ label: BACCARAT_DOMAIN_LABEL_HE[d], value: baccaratAccuracy(b.trainers[d]) * 100, tone: 'neutral' })), (v) => `${v.toFixed(0)}%`)
        : h('p', { class: 'text-faint', text: 'עדיין אין נתוני אימון.' }), h('div', { class: 'grid grid-2' }, statTile('זמן תגובה ממוצע', avgReaction ? `${(avgReaction / 1000).toFixed(1)} שנ׳` : '—'), statTile('זמן אימון', `${Math.round(b.trainingTimeMs / 60000)} דק׳`))), panel({ title: 'סימולציות', icon: '🧪' }, b.simulations.length
        ? h('div', { class: 'list-rows' }, ...b.simulations.slice(0, 6).map((sim) => h('div', { class: 'list-row' }, h('span', { text: `${sim.bet} · ${num(sim.hands)}` }), h('span', { class: `row-value ${sim.profit >= 0 ? 'row-good' : 'row-bad'}`, text: `${money(sim.profit)} · ${pct(sim.houseEdge, 2)}` }))))
        : h('p', { class: 'text-faint', text: 'עדיין לא הרצת סימולציה.' }), button('פתח סימולטור', () => navigate('/baccarat/simulate'), { tone: 'ghost', wide: true })), note('כל הנתונים נשמרים במכשיר שלך בלבד.'));
    return { element };
}
//# sourceMappingURL=stats.js.map