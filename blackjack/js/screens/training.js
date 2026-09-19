/** מרכז האימונים. */
import { state } from "../state/appState.js";
import { accuracy } from "../state/appState.js";
import { LEVELS, levelComplete } from "../content/progression.js";
import { h, pct } from "../ui/dom.js";
import { panel, screen } from "../ui/components/layout.js";
import { navigate } from "../ui/router.js";
import { toast } from "../ui/components/feedbackUi.js";
import { sfx } from "../ui/feedback.js";
export function trainingScreen() {
    const s = state();
    const done = (level) => level === 0 || levelComplete(LEVELS[level - 1], s);
    const trainers = [
        {
            emoji: '🧠',
            title: 'אסטרטגיה בסיסית',
            sub: 'מה הפעולה הנכונה בכל יד',
            path: '/strategy',
            requiresLevel: 0,
            stat: () => pct(accuracy(s.stats.trainers.strategy), 0),
        },
        {
            emoji: '⚡',
            title: 'אימון ספירה',
            sub: 'קלפים בקצב — 6 רמות קושי',
            path: '/counting',
            requiresLevel: 0,
            stat: () => `${s.stats.countingSessions} מפגשים`,
        },
        {
            emoji: '🔢',
            title: 'ספירה רצה',
            sub: 'תרגילי Running Count',
            path: '/running-count',
            requiresLevel: 0,
            stat: () => pct(accuracy(s.stats.trainers.runningCount), 0),
        },
        {
            emoji: '➗',
            title: 'ספירה אמיתית',
            sub: 'True Count וחלוקה בחפיסות',
            path: '/true-count',
            requiresLevel: 0,
            stat: () => pct(accuracy(s.stats.trainers.trueCount), 0),
        },
        {
            emoji: '📦',
            title: 'הערכת חפיסות',
            sub: 'כמה חפיסות נשארו בנעל',
            path: '/deck-estimation',
            requiresLevel: 0,
            stat: () => pct(accuracy(s.stats.trainers.deckEstimation), 0),
        },
        {
            emoji: '💵',
            title: 'מאמן הימורים',
            sub: 'גודל הימור לפי ספירה אמיתית',
            path: '/betting',
            requiresLevel: 0,
            stat: () => pct(accuracy(s.stats.trainers.betting), 0),
        },
        {
            emoji: '🎰',
            title: 'סימולציית קזינו',
            sub: 'שולחן מלא, קלפים של כולם נספרים',
            path: '/casino',
            requiresLevel: 0,
            stat: () => `${s.progress.casinoRounds} סיבובים`,
        },
        {
            emoji: '🕶️',
            title: 'מצב קזינו מתקדם',
            sub: 'ללא ספירה על המסך + שאלות',
            path: '/casino-advanced',
            requiresLevel: 7,
            stat: () => `${s.progress.advancedRounds} סיבובים`,
        },
        {
            emoji: '📊',
            title: 'אימון סטיות',
            sub: 'Illustrious 18 ו-Fab 4',
            path: '/deviations',
            requiresLevel: 8,
            stat: () => pct(accuracy(s.stats.trainers.deviations), 0),
        },
    ];
    const items = trainers.map((t) => {
        const unlocked = done(t.requiresLevel);
        return h('button', {
            class: `menu-item${unlocked ? '' : ' locked'}`,
            attrs: { type: 'button' },
            on: {
                click: () => {
                    sfx.tap();
                    if (!unlocked) {
                        toast(`נפתח לאחר השלמת רמה ${t.requiresLevel}`, 'info');
                        return;
                    }
                    navigate(t.path);
                },
            },
        }, h('span', { class: 'menu-emoji', text: unlocked ? t.emoji : '🔒' }), h('span', { class: 'menu-texts' }, h('span', { class: 'menu-title', text: t.title }), h('span', { class: 'menu-sub', text: t.sub })), t.stat && unlocked ? h('span', { class: 'menu-badge', text: t.stat() }) : null, h('span', { class: 'menu-arrow', text: '‹' }));
    });
    const element = screen({ title: 'אימון', subtitle: 'מסלול מלא: מאסטרטגיה ועד ספירה בתנאי אמת' }, panel({ title: 'האימון היומי', subtitle: '5 תחנות קצרות · 25 דקות', icon: '📅', onClick: () => navigate('/daily') }), h('div', { class: 'menu-list' }, ...items));
    return { element };
}
//# sourceMappingURL=training.js.map