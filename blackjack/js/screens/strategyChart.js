/** טבלת אסטרטגיה בסיסית מלאה, מחושבת לפי החוקים. */
import { buildChart } from "../engine/basicStrategy.js";
import { fullShoeComposition, roundExpectedValue } from "../engine/evEngine.js";
import { describeRulesHe } from "../engine/rules.js";
import { rules } from "../state/appState.js";
import { h, pct, signedPct } from "../ui/dom.js";
import { segmented } from "../ui/components/controls.js";
import { note, panel, screen, statTile } from "../ui/components/layout.js";
import { strategyLegend, strategyTable } from "../ui/components/strategyTable.js";
export function strategyChartScreen() {
    const r = rules();
    const chart = buildChart(r);
    const ev = roundExpectedValue(fullShoeComposition(r.decks), r);
    let section = 'hard';
    const tableHost = h('div', {});
    const renderTable = () => {
        tableHost.replaceChildren(strategyTable(chart, section));
    };
    renderTable();
    const element = screen({ title: 'טבלת אסטרטגיה', subtitle: describeRulesHe(r), showBack: true }, h('div', { class: 'grid grid-2' }, statTile('יתרון הבית', ev < 0 ? pct(-ev, 2) : `שחקן ${pct(ev, 2)}`, 'לפי החוקים שנבחרו', ev < 0 ? 'bad' : 'good'), statTile('תוחלת לסיבוב', signedPct(ev), 'ביחידת הימור', ev < 0 ? 'bad' : 'good')), segmented([
        { value: 'hard', label: 'ידיים קשות' },
        { value: 'soft', label: 'ידיים רכות' },
        { value: 'pairs', label: 'זוגות' },
    ], section, (value) => {
        section = value;
        renderTable();
    }, 'סוג טבלה'), panel({}, tableHost, strategyLegend()), note('הטבלה מחושבת על ידי מנוע ה-EV של האפליקציה מתוך הרכב הנעל וחוקי השולחן — ולא מועתקת מטבלה קבועה. בנעל של 4 חפיסות ומעלה התוצאה זהה לטבלאות האסטרטגיה הבסיסית המקובלות.'), note('הנחות החישוב: התפלגות הקלפים נלקחת מהנעל לאחר הסרת הקלפים הידועים ומוחזקת קבועה בעץ החישוב; תוחלת הפיצול מחושבת ללא פיצול חוזר. בחפיסה אחת ייתכנו הבדלים קטנים מטבלאות תלויות־הרכב.', '📐'));
    return { element };
}
//# sourceMappingURL=strategyChart.js.map