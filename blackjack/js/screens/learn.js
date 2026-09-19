/** מסך הקורס — רשימת השיעורים. */
import { LESSONS } from "../content/lessons.js";
import { state } from "../state/appState.js";
import { h, pct } from "../ui/dom.js";
import { progressBar } from "../ui/components/charts.js";
import { panel, screen } from "../ui/components/layout.js";
import { navigate } from "../ui/router.js";
import { sfx } from "../ui/feedback.js";
export function learnScreen() {
    const s = state();
    const completed = LESSONS.filter((l) => s.progress.lessons[l.id]?.completed).length;
    const items = LESSONS.map((lesson) => {
        const progress = s.progress.lessons[lesson.id];
        const done = progress?.completed ?? false;
        return h('button', {
            class: 'menu-item',
            attrs: { type: 'button' },
            on: {
                click: () => {
                    sfx.tap();
                    navigate(`/learn/${lesson.id}`);
                },
            },
        }, h('span', { class: 'menu-emoji', text: done ? '✅' : String(lesson.index) }), h('span', { class: 'menu-texts' }, h('span', { class: 'menu-title', text: lesson.title }), h('span', { class: 'menu-sub', text: `${lesson.subtitle} · ${lesson.minutes} דק׳` })), done && progress ? h('span', { class: 'menu-badge', text: `${progress.bestScore}%` }) : null, h('span', { class: 'menu-arrow', text: '‹' }));
    });
    const element = screen({ title: 'למד Blackjack', subtitle: `קורס מלא בן ${LESSONS.length} פרקים`, showBack: true }, panel({ title: 'ההתקדמות שלך בקורס', icon: '📚' }, progressBar(completed / LESSONS.length, `הושלמו ${completed} מתוך ${LESSONS.length}`, pct(completed / LESSONS.length, 0))), h('div', { class: 'menu-list' }, ...items));
    return { element };
}
//# sourceMappingURL=learn.js.map