/** תצוגת לוחות התוצאות של באקרה. */
import { h } from "../../ui/dom.js";
import { BigRoad, beadPlate } from "../engine/road.js";
const SHORT = { player: 'P', banker: 'B', tie: 'T' };
/** לוח חרוזים — כל תוצאה לפי סדר. */
export function beadPlateView(history, columns = 10) {
    const grid = beadPlate(history, columns, 6);
    return h('div', { class: 'road-board bead-plate', attrs: { 'aria-label': 'לוח חרוזים' } }, ...grid.map((row) => h('div', { class: 'road-row' }, ...row.map((cell) => h('div', { class: `road-cell${cell ? ` filled road-${cell}` : ''}` }, cell ? SHORT[cell] : '')))));
}
function cellView(cell) {
    if (!cell)
        return h('div', { class: 'road-cell' });
    const el = h('div', {
        class: `road-cell filled big-${cell.result}`,
        attrs: { 'aria-label': cell.result === 'player' ? 'שחקן' : 'בנקאי' },
    }, h('span', { class: 'road-ring' }));
    if (cell.ties > 0) {
        el.appendChild(h('span', { class: 'road-tie-mark', text: cell.ties > 1 ? String(cell.ties) : '' }));
    }
    return el;
}
/** הדרך הגדולה — עמודה לכל רצף. */
export function bigRoadView(history, columns = 16) {
    const road = new BigRoad();
    for (const outcome of history)
        road.add(outcome);
    const grid = road.grid(columns, 6);
    return h('div', { class: 'road-board big-road', attrs: { 'aria-label': 'הדרך הגדולה' } }, ...grid.map((row) => h('div', { class: 'road-row' }, ...row.map(cellView))));
}
/** מקרא הלוחות. */
export function roadLegend() {
    return h('div', { class: 'road-legend' }, h('span', { class: 'legend-dot big-banker' }, ''), h('span', { class: 'legend-text', text: 'בנקאי' }), h('span', { class: 'legend-dot big-player' }, ''), h('span', { class: 'legend-text', text: 'שחקן' }), h('span', { class: 'legend-dot tie-dot' }, ''), h('span', { class: 'legend-text', text: 'תיקו' }));
}
/** שורת תוצאות אחרונות בפורמט טקסטואלי. */
export function historyStrip(history, count = 20) {
    const recent = history.slice(-count);
    return h('div', { class: 'history-strip' }, ...(recent.length
        ? recent.map((o) => h('span', { class: `history-chip road-${o}`, text: SHORT[o] }))
        : [h('span', { class: 'text-faint', text: 'עדיין אין תוצאות' })]));
}
//# sourceMappingURL=roadView.js.map