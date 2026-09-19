/** סימולציית קזינו — שולחן מלא עם שחקנים נוספים. */
import { describeRulesHe } from "../engine/rules.js";
import { rules, settings, updateProgress } from "../state/appState.js";
import { h } from "../ui/dom.js";
import { note, panel, screen } from "../ui/components/layout.js";
import { button, segmented } from "../ui/components/controls.js";
import { navigate } from "../ui/router.js";
import { TableController } from "./gameController.js";
export function casinoScreen() {
    let bots = 3;
    const host = h('div', { class: 'table-host' });
    const seatPicker = h('div', { style: { padding: '10px 12px 0' } });
    const renderSeatPicker = () => {
        seatPicker.replaceChildren(segmented([
            { value: 2, label: '3 שחקנים' },
            { value: 3, label: '4 שחקנים' },
            { value: 4, label: '5 שחקנים' },
        ], bots, (value) => {
            bots = value;
            renderSeatPicker();
            build();
        }, 'מספר שחקנים בשולחן'));
    };
    const build = () => {
        const controller = new TableController({
            rules: rules(),
            bots,
            showCount: settings().showCount,
            showHint: settings().showStrategyHint,
            onRoundEnd: () => {
                updateProgress((p) => ({ casinoRounds: p.casinoRounds + 1 }));
            },
        });
        host.replaceChildren(controller.element);
    };
    renderSeatPicker();
    build();
    const element = screen({
        title: 'סימולציית קזינו',
        subtitle: describeRulesHe(rules()),
        showBack: true,
        variant: 'table',
    }, seatPicker, host, h('div', { class: 'stack', style: { padding: '12px' } }, note('הקלפים של כל השחקנים משפיעים על הספירה. עקוב אחרי כל הקלפים שיוצאים — בדיוק כמו בשולחן אמיתי.'), panel({ title: 'מצב מתקדם', subtitle: 'ללא ספירה על המסך — אתה סופר לבד', icon: '🕶️' }, button('עבור למצב מתקדם', () => navigate('/casino-advanced'), { tone: 'gold', wide: true }))));
    return { element };
}
//# sourceMappingURL=casino.js.map