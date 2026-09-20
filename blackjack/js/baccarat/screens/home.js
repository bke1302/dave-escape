/** מסך הבית של אקדמיית הבאקרה. */
import { h, money, num, pct } from "../../ui/dom.js";
import { progressBar } from "../../ui/components/charts.js";
import { panel, screen, statTile } from "../../ui/components/layout.js";
import { navigate } from "../../ui/router.js";
import { sfx } from "../../ui/feedback.js";
import { baccarat, baccaratOverallAccuracy, adaptiveHint } from "../state.js";
import { BACCARAT_LESSONS } from "../content/lessons.js";
import { baccaratCurrentLevel, baccaratLevelProgress, baccaratOverallProgress } from "../content/progression.js";
import { describeBaccaratRulesHe } from "../engine/rules.js";
import { betMath } from "../engine/probability.js";
function menuItem(spec) {
    return h('button', {
        class: 'menu-item',
        attrs: { type: 'button' },
        on: {
            click: () => {
                sfx.tap();
                navigate(spec.path);
            },
        },
    }, h('span', { class: 'menu-emoji', text: spec.emoji }), h('span', { class: 'menu-texts' }, h('span', { class: 'menu-title', text: spec.title }), h('span', { class: 'menu-sub', text: spec.sub })), spec.badge ? h('span', { class: 'menu-badge', text: spec.badge }) : null, h('span', { class: 'menu-arrow', text: '‹' }));
}
export function baccaratHomeScreen() {
    const b = baccarat();
    const level = baccaratCurrentLevel(b);
    const lessonsDone = BACCARAT_LESSONS.filter((l) => b.lessons[l.id]?.completed).length;
    const hint = adaptiveHint(b);
    const banker = betMath(b.rules).find((m) => m.bet === 'banker');
    const element = screen({ title: 'Baccarat Academy', subtitle: 'לומדים את המשחק. מתרגלים. מבינים את המתמטיקה.', showBack: true }, h('section', { class: 'hero' }, h('h1', { class: 'hero-title', text: '♦️ BACCARAT' }), h('p', { class: 'hero-tagline', text: describeBaccaratRulesHe(b.rules) }), h('div', { class: 'hero-stats' }, h('span', { class: 'hero-chip', text: `${level.icon} רמה ${level.level} · ${level.title}` }), h('span', { class: 'hero-chip', text: `💰 ${money(b.bankroll)}` }), banker ? h('span', { class: 'hero-chip', text: `🏛️ בנקאי ${pct(banker.houseEdge, 2)}` }) : null), progressBar(baccaratLevelProgress(level, b), `התקדמות ברמה ${level.level}`, pct(baccaratLevelProgress(level, b), 0))), h('div', { class: 'menu-list' }, menuItem({ emoji: '🎴', title: 'שחק עכשיו', sub: 'שולחן מלא עם לוחות תוצאות', path: '/baccarat/play' }), menuItem({ emoji: '📚', title: 'למד Baccarat', sub: `קורס בן ${BACCARAT_LESSONS.length} פרקים · הושלמו ${lessonsDone}`, path: '/baccarat/learn' }), menuItem({ emoji: '🧠', title: 'אימון החלטות', sub: 'קלף שלישי, חישוב יד, לוחות', path: '/baccarat/train' }), menuItem({ emoji: '📊', title: 'סימולטור', sub: 'מונטה קרלו וסימולציית מפגש', path: '/baccarat/simulate' }), menuItem({ emoji: '📈', title: 'סטטיסטיקות', sub: 'כל המדדים של המשחק שלך', path: '/baccarat/stats' }), menuItem({ emoji: '🏆', title: 'ההתקדמות שלי', sub: `14 רמות · ${Object.keys(b.achievements).length} הישגים`, path: '/baccarat/progress' }), menuItem({ emoji: '⚙️', title: 'הגדרות', sub: 'חוקי שולחן, עמלה ותשלומים', path: '/baccarat/settings' })), panel({ title: 'הלמידה המסתגלת שלך', subtitle: hint.message, icon: '🎯' }, h('div', { class: 'grid grid-3' }, statTile('דיוק כולל', pct(baccaratOverallAccuracy(b), 0)), statTile('ידיים', num(b.handsPlayed)), statTile('רמת קושי', `${hint.difficulty}/3`))), panel({ title: 'התקדמות באקדמיה', icon: '📘' }, progressBar(baccaratOverallProgress(b), 'סך כל המסלול', pct(baccaratOverallProgress(b), 0))));
    return { element };
}
//# sourceMappingURL=home.js.map