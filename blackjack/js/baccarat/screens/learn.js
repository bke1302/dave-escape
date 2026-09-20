/** רשימת שיעורי הבאקרה. */
import { h, pct } from "../../ui/dom.js";
import { progressBar } from "../../ui/components/charts.js";
import { panel, screen } from "../../ui/components/layout.js";
import { navigate } from "../../ui/router.js";
import { sfx } from "../../ui/feedback.js";
import { BACCARAT_LESSONS } from "../content/lessons.js";
import { baccarat } from "../state.js";
export function baccaratLearnScreen() {
    const b = baccarat();
    const completed = BACCARAT_LESSONS.filter((l) => b.lessons[l.id]?.completed).length;
    const items = BACCARAT_LESSONS.map((lesson) => {
        const progress = b.lessons[lesson.id];
        const done = progress?.completed ?? false;
        return h('button', {
            class: 'menu-item',
            attrs: { type: 'button' },
            on: {
                click: () => {
                    sfx.tap();
                    navigate(`/baccarat/learn/${lesson.id}`);
                },
            },
        }, h('span', { class: 'menu-emoji', text: done ? '✅' : String(lesson.index) }), h('span', { class: 'menu-texts' }, h('span', { class: 'menu-title', text: lesson.title }), h('span', { class: 'menu-sub', text: `${lesson.subtitle} · ${lesson.minutes} דק׳` })), done && progress ? h('span', { class: 'menu-badge', text: `${progress.bestScore}%` }) : null, h('span', { class: 'menu-arrow', text: '‹' }));
    });
    const element = screen({ title: 'למד Baccarat', subtitle: `קורס מדורג בן ${BACCARAT_LESSONS.length} פרקים`, showBack: true }, panel({ title: 'ההתקדמות שלך בקורס', icon: '📚' }, progressBar(completed / BACCARAT_LESSONS.length, `הושלמו ${completed} מתוך ${BACCARAT_LESSONS.length}`, pct(completed / BACCARAT_LESSONS.length, 0))), h('div', { class: 'menu-list' }, ...items));
    return { element };
}
//# sourceMappingURL=learn.js.map