/** מסך הבית של עולם הבלאק ג'ק — נקודת הכניסה לכל מערכות המשחק. */
import { describeRulesHe } from "../engine/rules.js";
import { accuracy, overallAccuracy, state, todayKey } from "../state/appState.js";
import { currentLevel, levelProgress } from "../content/progression.js";
import { h, money, num, pct } from "../ui/dom.js";
import { progressBar } from "../ui/components/charts.js";
import { panel, screen, statTile } from "../ui/components/layout.js";
import { navigate } from "../ui/router.js";
import { sfx } from "../ui/feedback.js";
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
export function blackjackHomeScreen() {
    const s = state();
    const level = currentLevel(s);
    const progress = levelProgress(level, s);
    const daily = s.progress.daily;
    const dailyDone = daily.date === todayKey() ? Object.values(daily.segments).filter((x) => x.done).length : 0;
    const element = screen({ variant: 'default', title: 'BLACKJACK', subtitle: 'לומדים. מתרגלים. משתפרים.', showBack: true }, h('section', { class: 'hero' }, h('h1', { class: 'hero-title', text: 'BLACKJACK MASTER' }), h('p', { class: 'hero-tagline', text: 'אסטרטגיה בסיסית · ספירת קלפים · סימולציית קזינו' }), h('div', { class: 'hero-stats' }, h('span', { class: 'hero-chip', text: `${level.icon} רמה ${level.level} · ${level.title}` }), h('span', { class: 'hero-chip', text: `💰 ${money(s.stats.bankroll)}` }), h('span', { class: 'hero-chip', text: `🎯 דיוק ${pct(overallAccuracy(s.stats), 0)}` })), progressBar(progress, `התקדמות ברמה ${level.level}`, pct(progress, 0))), h('div', { class: 'menu-list' }, menuItem({ emoji: '🎰', title: 'משחק Blackjack', sub: 'שולחן מלא עם כל החוקים', path: '/game' }), menuItem({ emoji: '🧠', title: 'למד Blackjack', sub: `קורס בן 15 פרקים · הושלמו ${Object.values(s.progress.lessons).filter((l) => l.completed).length}`, path: '/learn' }), menuItem({ emoji: '🃏', title: 'אימון ספירת קלפים', sub: 'Hi-Lo, True Count, הערכת חפיסות', path: '/training' }), menuItem({ emoji: '📊', title: 'סימולטור', sub: 'מונטה קרלו והשוואת אסטרטגיות', path: '/simulator' }), menuItem({ emoji: '🏆', title: 'ההתקדמות שלי', sub: `10 רמות · ${Object.keys(s.progress.achievements).length} הישגים`, path: '/progress' }), menuItem({ emoji: '⚙️', title: 'הגדרות', sub: describeRulesHe(s.settings.rules), path: '/settings' })), panel({ title: 'אימון יומי', subtitle: `5 תחנות · ${dailyDone}/5 הושלמו היום`, icon: '📅', onClick: () => navigate('/daily') }, progressBar(dailyDone / 5, 'התקדמות היום', `${dailyDone}/5`), h('div', { class: 'row-between' }, h('span', { class: 'pill gold', text: `🔥 רצף ${num(daily.streak)} ימים` }), h('span', { class: 'text-faint', text: 'לחץ כדי להתחיל' }))), h('div', { class: 'grid grid-3' }, statTile('ידיים ששוחקו', num(s.stats.handsPlayed)), statTile('רצף שיא', num(s.stats.bestStreak)), statTile('אסטרטגיה', pct(accuracy(s.stats.trainers.strategy), 0))), panel({ icon: '⚖️', title: 'משחק אחראי', subtitle: 'מה סימולציה יכולה ומה לא', onClick: () => navigate('/responsible') }));
    return { element };
}
//# sourceMappingURL=home.js.map