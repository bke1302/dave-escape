/** הגדרות הבאקרה — חוקי שולחן, תשלומים והון. */
import { h, money, pct } from "../../ui/dom.js";
import { button, segmented, slider } from "../../ui/components/controls.js";
import { modal, toast } from "../../ui/components/feedbackUi.js";
import { note, panel, screen, statTile } from "../../ui/components/layout.js";
import { baccarat, resetBaccaratProgress, resetBaccaratSession, updateBaccarat, updateBaccaratRules } from "../state.js";
import { DECK_OPTIONS_BACCARAT, TIE_PAYOUT_OPTIONS, describeBaccaratRulesHe } from "../engine/rules.js";
import { betMath } from "../engine/probability.js";
import { BACCARAT_RESPONSIBLE_HE } from "../content/lessons.js";
export function baccaratSettingsScreen() {
    const host = h('div', { class: 'stack' });
    const render = () => {
        const b = baccarat();
        const math = betMath(b.rules);
        host.replaceChildren(panel({ title: 'חוקי השולחן', subtitle: describeBaccaratRulesHe(b.rules), icon: '🎴' }, h('div', { class: 'grid grid-3' }, ...math.map((m) => statTile(m.label.split(' ')[0], pct(m.houseEdge, 2), 'יתרון הבית', m.houseEdge > 0.05 ? 'bad' : undefined))), h('p', { class: 'text-faint', text: 'מספר חפיסות' }), segmented(DECK_OPTIONS_BACCARAT.map((d) => ({ value: d, label: String(d) })), b.rules.decks, (value) => {
            updateBaccaratRules({ decks: value });
            render();
        }, 'מספר חפיסות'), h('p', { class: 'text-faint', text: 'שיטת תשלום הבנקאי' }), segmented([
            { value: 'commission', label: 'עם עמלה', hint: 'סטנדרטי' },
            { value: 'noCommission', label: 'ללא עמלה', hint: 'בנקאי 6 = חצי' },
        ], b.rules.commissionMode, (value) => {
            updateBaccaratRules({ commissionMode: value });
            render();
        }, 'שיטת תשלום'), ...(b.rules.commissionMode === 'commission'
            ? [
                slider('שיעור העמלה', b.rules.commissionRate * 100, 1, 10, 0.5, (v) => {
                    updateBaccaratRules({ commissionRate: v / 100 });
                    render();
                }, (v) => `${v}%`),
            ]
            : [
                h('p', { class: 'text-faint', text: 'תשלום על ניצחון בנקאי עם 6' }),
                segmented([
                    { value: 0.5, label: '1:2 (חצי)' },
                    { value: 1, label: 'תשלום מלא' },
                ], b.rules.bankerSixPayout, (value) => {
                    updateBaccaratRules({ bankerSixPayout: value });
                    render();
                }, 'תשלום בנקאי 6'),
            ]), h('p', { class: 'text-faint', text: 'תשלום תיקו' }), segmented(TIE_PAYOUT_OPTIONS.map((v) => ({ value: v, label: `${v}:1` })), b.rules.tiePayout, (value) => {
            updateBaccaratRules({ tiePayout: value });
            render();
        }, 'תשלום תיקו'), slider('חדירה (Penetration)', Math.round(b.rules.penetration * 100), 50, 95, 5, (v) => {
            updateBaccaratRules({ penetration: v / 100 });
        }, (v) => `${v}%`)), panel({ title: 'הון והימורים', icon: '💰' }, slider('הון התחלתי', b.startingBankroll, 200, 50000, 100, (v) => updateBaccarat({ startingBankroll: v }), (v) => money(v)), slider('הימור מינימלי', b.minBet, 5, 200, 5, (v) => updateBaccarat({ minBet: v }), (v) => money(v)), slider('הימור מקסימלי', b.maxBet, 50, 5000, 50, (v) => updateBaccarat({ maxBet: v }), (v) => money(v)), button('אפס מפגש', () => {
            resetBaccaratSession();
            toast('המפגש אופס', 'info');
            render();
        }, { tone: 'ghost', wide: true })), panel({ title: 'נתונים', icon: '🗃️' }, h('p', { class: 'text-dim', text: 'איפוס מוחק רק את נתוני הבאקרה. ההתקדמות בבלאק ג׳ק נשמרת במלואה.' }), button('אפס התקדמות באקרה', () => {
            modal({
                title: 'איפוס באקרה',
                body: ['כל ההתקדמות, השיעורים, ההישגים והסטטיסטיקות של הבאקרה יימחקו. נתוני הבלאק ג׳ק לא ייפגעו.'],
                confirmLabel: 'מחק',
                cancelLabel: 'ביטול',
                tone: 'danger',
                onConfirm: () => {
                    resetBaccaratProgress();
                    toast('נתוני הבאקרה אופסו', 'info');
                    render();
                },
            });
        }, { tone: 'danger', wide: true })), note(BACCARAT_RESPONSIBLE_HE, '⚖️'));
    };
    render();
    return { element: screen({ title: 'הגדרות באקרה', subtitle: 'חוקים, תשלומים והון', showBack: true }, host) };
}
//# sourceMappingURL=settings.js.map