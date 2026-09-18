/** לוח סטטיסטיקות מלא. */
import { DOMAIN_LABEL_HE, accuracy, averageReaction, overallAccuracy, state } from "../state/appState.js";
import { currentLevel } from "../content/progression.js";
import { h, money, num, pct, signedPct } from "../ui/dom.js";
import { barChart, lineChart, progressRing } from "../ui/components/charts.js";
import { note, panel, screen, statTile } from "../ui/components/layout.js";
import { navigate } from "../ui/router.js";
import { button } from "../ui/components/controls.js";
export function statsScreen() {
    const s = state();
    const st = s.stats;
    const domains = Object.keys(st.trainers);
    const level = currentLevel(s);
    const totalAttempts = domains.reduce((sum, d) => sum + st.trainers[d].attempts, 0);
    const avgReaction = totalAttempts > 0
        ? domains.reduce((sum, d) => sum + st.trainers[d].totalReactionMs, 0) / totalAttempts
        : 0;
    const element = screen({ title: 'נתונים', subtitle: 'כל המדדים שלך במקום אחד' }, panel({ title: 'תמונת מצב', icon: '📊' }, h('div', { class: 'row-center', style: { gap: '18px' } }, progressRing(overallAccuracy(st), pct(overallAccuracy(st), 0), 'דיוק כולל'), h('div', { class: 'grid grid-2', style: { flex: '1' } }, statTile('ידיים', num(st.handsPlayed)), statTile('סיבובים', num(st.roundsPlayed)), statTile('תרגילים', num(totalAttempts)), statTile('רמה', `${level.level}`)))), panel({ title: 'דיוק לפי תחום', icon: '🎯' }, barChart(domains
        .filter((d) => st.trainers[d].attempts > 0)
        .map((d) => ({ label: DOMAIN_LABEL_HE[d], value: accuracy(st.trainers[d]) * 100, tone: 'neutral' })), (v) => `${v.toFixed(0)}%`), totalAttempts === 0 ? h('p', { class: 'text-faint', text: 'עדיין אין נתונים — התחל באימון כדי למלא את הלוח.' }) : null), panel({ title: 'מדדי אימון', icon: '⏱️' }, h('div', { class: 'grid grid-2' }, statTile('זמן תגובה ממוצע', avgReaction ? `${(avgReaction / 1000).toFixed(1)} שנ׳` : '—'), statTile('זמן אימון כולל', `${Math.round(st.trainingTimeMs / 60000)} דק׳`), statTile('רצף נוכחי', num(st.currentStreak)), statTile('רצף שיא', num(st.bestStreak)), statTile('מפגשי ספירה', num(st.countingSessions)), statTile('חפיסות מושלמות', num(st.perfectDecks)))), panel({ title: 'הון', icon: '💰' }, h('div', { class: 'grid grid-2' }, statTile('הון נוכחי', money(st.bankroll)), statTile('מפגש נוכחי', money(st.sessionNet), undefined, st.sessionNet >= 0 ? 'good' : 'bad'), statTile('שיא', money(st.peakBankroll)), statTile('ירידת שיא', money(st.maxDrawdown), 'Drawdown', 'bad')), lineChart(st.bankrollHistory, { label: 'היסטוריית הון' }), button('ניהול הון וסיכון', () => navigate('/bankroll'), { tone: 'ghost', wide: true })), panel({ title: 'תוצאות סימולציה', icon: '🧪' }, st.simulations.length
        ? h('div', { class: 'list-rows' }, ...st.simulations.slice(0, 8).map((sim) => h('div', { class: 'list-row' }, h('span', { text: `${sim.strategy} · ${num(sim.hands)}` }), h('span', { class: `row-value ${sim.edge >= 0 ? 'row-good' : 'row-bad'}`, text: `${signedPct(sim.edge)} · ${money(sim.profit)}` }))))
        : h('p', { class: 'text-faint', text: 'עדיין לא הרצת סימולציה.' }), button('פתח סימולטור', () => navigate('/simulator'), { tone: 'ghost', wide: true })), note('כל הנתונים נשמרים במכשיר שלך בלבד ועובדים גם ללא חיבור לאינטרנט.'));
    return { element };
}
//# sourceMappingURL=stats.js.map