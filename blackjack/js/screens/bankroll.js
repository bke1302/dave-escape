/** ניהול הון ומחשבון סיכון חורבן (Risk of Ruin). */
import { fullShoeComposition, roundExpectedValue } from "../engine/evEngine.js";
import { bankrollForRisk, kellyFraction, projection, riskOfRuin, riskOfRuinFinite, RISK_ASSUMPTIONS_HE } from "../engine/risk.js";
import { resetBankroll, rules, settings, state, updateSettings } from "../state/appState.js";
import { h, money, num, pct, signedPct } from "../ui/dom.js";
import { lineChart } from "../ui/components/charts.js";
import { button, slider } from "../ui/components/controls.js";
import { modal } from "../ui/components/feedbackUi.js";
import { note, panel, screen, statTile } from "../ui/components/layout.js";
export function bankrollScreen() {
    const s = state();
    const r = rules();
    const baseEv = roundExpectedValue(fullShoeComposition(r.decks), r);
    let bankroll = s.settings.startingBankroll;
    let unit = s.settings.minBet;
    let edge = 0.01; // יתרון שחקן מונח לצורך החישוב
    let sd = 1.15;
    let handsPerSession = 5000;
    const host = h('div', { class: 'stack' });
    const render = () => {
        const units = unit > 0 ? bankroll / unit : 0;
        const ror = riskOfRuin({ bankrollUnits: units, evPerHand: edge, sdPerHand: sd });
        const rorSession = riskOfRuinFinite({ bankrollUnits: units, evPerHand: edge, sdPerHand: sd }, handsPerSession);
        const needed1 = bankrollForRisk(0.01, edge, sd);
        const needed5 = bankrollForRisk(0.05, edge, sd);
        const kelly = kellyFraction(edge, sd);
        const proj = projection(edge, sd, handsPerSession, unit);
        const st = state().stats;
        host.replaceChildren(panel({ title: 'ההון שלך', subtitle: 'מצב נוכחי במשחק', icon: '💰' }, h('div', { class: 'grid grid-2' }, statTile('הון נוכחי', money(st.bankroll)), statTile('תוצאת מפגש', money(st.sessionNet), undefined, st.sessionNet >= 0 ? 'good' : 'bad'), statTile('שיא הון', money(st.peakBankroll)), statTile('ירידת שיא', money(st.maxDrawdown), 'Drawdown', 'bad'), statTile('תוצאה מצטברת', money(st.lifetimeNet), 'לכל החיים', st.lifetimeNet >= 0 ? 'good' : 'bad'), statTile('ידיים', num(st.handsPlayed))), lineChart(st.bankrollHistory, { label: 'היסטוריית הון' }), button('אפס מפגש', () => {
            modal({
                title: 'איפוס מפגש',
                body: ['ההון יחזור לערך ההתחלתי והמפגש יתאפס. הנתונים המצטברים נשמרים.'],
                confirmLabel: 'אפס',
                cancelLabel: 'ביטול',
                tone: 'danger',
                onConfirm: () => {
                    resetBankroll();
                    render();
                },
            });
        }, { tone: 'ghost', wide: true })), panel({ title: 'הגדרות הון', icon: '⚙️' }, slider('הון התחלתי', bankroll, 200, 50000, 100, (v) => {
            bankroll = v;
            updateSettings({ startingBankroll: v });
            render();
        }, (v) => money(v)), slider('הימור מינימלי (יחידה)', unit, 5, 500, 5, (v) => {
            unit = v;
            updateSettings({ minBet: v });
            render();
        }, (v) => money(v)), slider('הימור מקסימלי', settings().maxBet, 50, 5000, 50, (v) => {
            updateSettings({ maxBet: v });
        }, (v) => money(v)), h('p', { class: 'text-faint', text: `ההון שלך שווה ${num(Math.floor(units))} יחידות הימור.` })), panel({ title: 'מחשבון סיכון חורבן', subtitle: 'Risk of Ruin', icon: '⚠️' }, slider('יתרון השחקן ליד', edge, -0.01, 0.03, 0.001, (v) => {
            edge = v;
            render();
        }, (v) => signedPct(v)), slider('סטיית תקן ליד', sd, 0.8, 3, 0.05, (v) => {
            sd = v;
            render();
        }, (v) => `${v.toFixed(2)} יח׳`), slider('ידיים במפגש', handsPerSession, 100, 20000, 100, (v) => {
            handsPerSession = v;
            render();
        }, (v) => num(v)), h('div', { class: 'grid grid-2' }, statTile('סיכון חורבן', edge > 0 ? pct(ror, 2) : '100%', 'משחק ללא הגבלת זמן', ror > 0.2 ? 'bad' : 'good'), statTile('סיכון במפגש', pct(rorSession, 2), `${num(handsPerSession)} ידיים`, rorSession > 0.2 ? 'bad' : 'good'), statTile('הון ל-5% סיכון', needed5 ? `${num(Math.ceil(needed5))} יח׳` : '—', needed5 ? money(Math.ceil(needed5) * unit) : 'נדרש יתרון חיובי'), statTile('הון ל-1% סיכון', needed1 ? `${num(Math.ceil(needed1))} יח׳` : '—', needed1 ? money(Math.ceil(needed1) * unit) : 'נדרש יתרון חיובי'), statTile('שבר קלי', edge > 0 ? pct(kelly, 2) : '—', 'מההון לכל הימור'), statTile('תוחלת למפגש', money(proj.expected), `±${money(1.96 * proj.sd)} (95%)`, proj.expected >= 0 ? 'good' : 'bad')), h('p', { class: 'text-faint', text: `טווח סביר לתוצאת המפגש (95%): בין ${money(proj.low)} לבין ${money(proj.high)}.` })), panel({ title: 'ההנחות שמאחורי החישוב', icon: '📐' }, h('div', { class: 'list-rows' }, ...RISK_ASSUMPTIONS_HE.map((a) => h('div', { class: 'list-row' }, h('span', { text: a })))), h('p', { class: 'text-faint', text: `לשם השוואה: תוחלת הסיבוב לפי החוקים שבחרת, באסטרטגיה בסיסית וללא ספירה, היא ${signedPct(baseEv)} ליד. יתרון חיובי מחייב ספירה, פריסת הימורים ותנאי שולחן טובים.` })), note('סיכון חורבן הוא הערכה מתמטית לפי מודל. הוא אינו הבטחה ואינו תחזית למפגש בודד.', '⚖️'));
    };
    render();
    const element = screen({ title: 'הון וסיכון', subtitle: 'Bankroll & Risk of Ruin', showBack: true }, host);
    return { element };
}
//# sourceMappingURL=bankroll.js.map