/** מסך הבית הראשי — בחירה בין שני המשחקים ולוח מצב משולב. */
import { LEVELS, currentLevel, levelProgress } from "../content/progression.js";
import { overallAccuracy, state, todayKey } from "../state/appState.js";
import { baccarat, baccaratOverallAccuracy } from "../baccarat/state.js";
import { BACCARAT_LESSONS } from "../baccarat/content/lessons.js";
import { baccaratCurrentLevel, baccaratOverallProgress } from "../baccarat/content/progression.js";
import { LESSONS } from "../content/lessons.js";
import { h, num, pct } from "../ui/dom.js";
import { progressBar } from "../ui/components/charts.js";
import { button } from "../ui/components/controls.js";
import { panel, screen, statTile } from "../ui/components/layout.js";
import { navigate } from "../ui/router.js";
/** התקדמות כוללת בבלאק ג'ק — ממוצע ההתקדמות בעשר הרמות. */
function blackjackProgress() {
    const s = state();
    return LEVELS.reduce((sum, level) => sum + levelProgress(level, s), 0) / LEVELS.length;
}
function gameCard(spec) {
    return h('section', { class: `game-card accent-${spec.accent}` }, h('div', { class: 'game-card-head' }, h('span', { class: 'game-card-icon', text: spec.icon }), h('div', {}, h('h2', { class: 'game-card-title', text: spec.title }), h('p', { class: 'game-card-tagline', text: spec.tagline }))), progressBar(spec.progress, 'התקדמות', pct(spec.progress, 0)), h('div', { class: 'game-card-stats' }, ...spec.stats.map(([label, value]) => h('div', { class: 'game-stat' }, h('span', { class: 'game-stat-value', text: value }), h('span', { class: 'game-stat-label', text: label })))), button(spec.action, () => navigate(spec.path), { tone: 'gold', wide: true }));
}
export function mainHomeScreen() {
    const s = state();
    const b = baccarat();
    const bjLevel = currentLevel(s);
    const bcLevel = baccaratCurrentLevel(b);
    const bjLessons = LESSONS.filter((l) => s.progress.lessons[l.id]?.completed).length;
    const bcLessons = BACCARAT_LESSONS.filter((l) => b.lessons[l.id]?.completed).length;
    const totalTraining = Math.round((s.stats.trainingTimeMs + b.trainingTimeMs) / 60000);
    const dailyStreak = s.progress.daily.date === todayKey() || s.progress.daily.lastCompletedDate ? s.progress.daily.streak : 0;
    const element = screen({ variant: 'default' }, h('section', { class: 'hero main-hero' }, h('h1', { class: 'hero-title', text: 'CASINO ACADEMY' }), h('p', { class: 'hero-tagline', text: 'שני משחקים. מנוע מתמטי אחד. הכול בעברית.' }), h('div', { class: 'hero-stats' }, h('span', { class: 'hero-chip', text: `🔥 רצף ${num(dailyStreak)} ימים` }), h('span', { class: 'hero-chip', text: `⏱️ ${num(totalTraining)} דק׳ אימון` }))), gameCard({
        icon: '🃏',
        title: 'BLACKJACK',
        tagline: 'למד אסטרטגיה, ספירת קלפים וסימולציית קזינו',
        progress: blackjackProgress(),
        stats: [
            ['רמה', String(bjLevel.level)],
            ['שיעורים', `${bjLessons}/${LESSONS.length}`],
            ['ידיים', num(s.stats.handsPlayed)],
            ['דיוק', pct(overallAccuracy(s.stats), 0)],
        ],
        action: 'כניסה ל-Blackjack',
        path: '/blackjack',
        accent: 'jack',
    }), gameCard({
        icon: '♦️',
        title: 'BACCARAT',
        tagline: 'למד את המשחק צעד אחר צעד ותרגל קבלת החלטות',
        progress: baccaratOverallProgress(b),
        stats: [
            ['רמה', String(bcLevel.level)],
            ['שיעורים', `${bcLessons}/${BACCARAT_LESSONS.length}`],
            ['ידיים', num(b.handsPlayed)],
            ['דיוק', pct(baccaratOverallAccuracy(b), 0)],
        ],
        action: 'כניסה ל-Baccarat',
        path: '/baccarat',
        accent: 'bacc',
    }), panel({ title: 'לוח מצב משולב', icon: '📊', onClick: () => navigate('/overview') }, h('div', { class: 'grid grid-3' }, statTile('ידיים בסך הכול', num(s.stats.handsPlayed + b.handsPlayed)), statTile('זמן אימון', `${num(totalTraining)} דק׳`), statTile('רצף שיא', num(Math.max(s.stats.bestStreak, b.bestStreak))))), panel({ icon: '⚖️', title: 'משחק אחראי', subtitle: 'מה סימולציה יכולה — ומה לא', onClick: () => navigate('/responsible') }));
    return { element };
}
//# sourceMappingURL=mainHome.js.map