/** מאמן חוקי הקלף השלישי — שאלה על השחקן ואז על הבנקאי. */
import { createRng, randInt } from "../../engine/rng.js";
import { h, pct } from "../../ui/dom.js";
import { button, optionGrid } from "../../ui/components/controls.js";
import { answerBanner } from "../../ui/components/feedbackUi.js";
import { note, panel, screen, statTile } from "../../ui/components/layout.js";
import { adaptiveHint, baccarat, baccaratAccuracy, recordBaccaratAnswer } from "../state.js";
import { bankerDraws, bankerRuleTable, explainBankerRuleHe, explainPlayerRuleHe, playerDraws } from "../engine/thirdCard.js";
const rng = createRng();
function newSituation(difficulty) {
    // ברמה 1 מתמקדים במצבים ברורים; ברמות גבוהות כוללים Naturals ומצבי גבול
    const allowNatural = difficulty >= 2 && rng() < 0.2;
    const playerTotal = allowNatural ? randInt(rng, 8, 9) : randInt(rng, 0, 7);
    const bankerTotal = allowNatural && rng() < 0.5 ? randInt(rng, 8, 9) : randInt(rng, 0, 7);
    const natural = playerTotal >= 8 || bankerTotal >= 8;
    const playerThird = !natural && playerDraws(playerTotal) ? randInt(rng, 0, 9) : null;
    return { playerTotal, bankerTotal, natural, playerThird };
}
export function baccaratThirdCardTrainerScreen() {
    let situation = newSituation(adaptiveHint().difficulty);
    let stage = 'player';
    let startedAt = Date.now();
    let playerAnswerCorrect = false;
    let bankerAnswerCorrect = false;
    let showTable = false;
    const host = h('div', { class: 'stack' });
    const next = () => {
        situation = newSituation(adaptiveHint().difficulty);
        stage = 'player';
        startedAt = Date.now();
        render();
    };
    const situationView = () => h('div', { class: 'row-center', style: { gap: '10px', padding: '6px 0' } }, h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'שחקן' }), h('span', { class: 'count-value', text: String(situation.playerTotal) })), h('div', { class: 'count-meter' }, h('span', { class: 'count-label', text: 'בנקאי' }), h('span', { class: 'count-value', text: String(situation.bankerTotal) })), situation.playerThird !== null && stage !== 'player'
        ? h('div', { class: 'count-meter tone-hot' }, h('span', { class: 'count-label', text: 'קלף שלישי לשחקן' }), h('span', { class: 'count-value', text: String(situation.playerThird) }))
        : null);
    const yesNo = (onPick) => optionGrid([
        { key: 'yes', label: 'כן — לוקח קלף' },
        { key: 'no', label: 'לא — עומד' },
    ], (key, el) => onPick(key === 'yes', el), 2);
    const render = () => {
        const b = baccarat();
        const shouldPlayerDraw = !situation.natural && playerDraws(situation.playerTotal);
        const shouldBankerDraw = !situation.natural && bankerDraws(situation.bankerTotal, situation.playerThird);
        const body = [
            h('div', { class: 'grid grid-3' }, statTile('תרגילים', String(b.trainers.thirdCard.attempts)), statTile('דיוק', pct(baccaratAccuracy(b.trainers.thirdCard), 0)), statTile('רצף', String(b.currentStreak))),
        ];
        if (stage === 'player') {
            body.push(panel({ title: 'האם השחקן מקבל קלף נוסף?', subtitle: situation.natural ? 'שים לב לסכומים על השולחן' : 'לפי כלל השחקן', icon: '🃏' }, situationView(), yesNo((yes, el) => {
                const correct = yes === shouldPlayerDraw;
                playerAnswerCorrect = correct;
                recordBaccaratAnswer('thirdCard', correct, Date.now() - startedAt);
                el.classList.add(correct ? 'correct' : 'wrong');
                setTimeout(() => {
                    stage = 'banker';
                    startedAt = Date.now();
                    render();
                }, 900);
            })));
        }
        else if (stage === 'banker') {
            body.push(panel({ title: 'האם הבנקאי מקבל קלף נוסף?', subtitle: situation.playerThird !== null ? 'שים לב לקלף השלישי של השחקן' : 'השחקן עמד', icon: '🎴' }, situationView(), yesNo((yes, el) => {
                const correct = yes === shouldBankerDraw;
                bankerAnswerCorrect = correct;
                recordBaccaratAnswer('thirdCard', correct, Date.now() - startedAt);
                el.classList.add(correct ? 'correct' : 'wrong');
                setTimeout(() => {
                    stage = 'solution';
                    render();
                }, 900);
            })));
        }
        else {
            const bothCorrect = playerAnswerCorrect && bankerAnswerCorrect;
            body.push(panel({ title: 'הפתרון', icon: bothCorrect ? '🎯' : '📘' }, situationView(), answerBanner(bothCorrect, bothCorrect ? 'שתי התשובות נכונות' : `${playerAnswerCorrect ? 'השחקן: נכון' : 'השחקן: לא נכון'} · ${bankerAnswerCorrect ? 'הבנקאי: נכון' : 'הבנקאי: לא נכון'}`, `${explainPlayerRuleHe(situation.playerTotal, situation.natural)} ${situation.natural ? '' : explainBankerRuleHe(situation.bankerTotal, situation.playerThird)}`), h('div', { class: 'list-rows' }, h('div', { class: 'list-row' }, h('span', { text: 'השחקן' }), h('span', { class: `row-value ${shouldPlayerDraw ? 'row-good' : 'row-bad'}`, text: shouldPlayerDraw ? 'לוקח קלף' : 'עומד' })), h('div', { class: 'list-row' }, h('span', { text: 'הבנקאי' }), h('span', { class: `row-value ${shouldBankerDraw ? 'row-good' : 'row-bad'}`, text: shouldBankerDraw ? 'לוקח קלף' : 'עומד' }))), button('תרגיל הבא', next, { tone: 'gold', wide: true })));
        }
        body.push(panel({ title: 'טבלת חוקי הבנקאי', subtitle: showTable ? 'מתי הבנקאי לוקח קלף שלישי' : 'לחץ כדי לפתוח', icon: '📋', onClick: showTable ? undefined : () => { showTable = true; render(); } }, showTable
            ? h('table', { class: 'rule-table' }, h('thead', {}, h('tr', {}, h('th', { text: 'סכום הבנקאי' }), h('th', { text: 'לוקח קלף כאשר הקלף השלישי של השחקן הוא' }))), h('tbody', {}, ...bankerRuleTable().map((row) => h('tr', {}, h('td', { text: String(row.bankerTotal) }), h('td', { class: row.drawsOn.length ? 'rule-draw' : 'rule-stand', text: row.summary })))))
            : null), note('כשהשחקן עומד (6 או 7), הבנקאי משחק לפי הכלל הפשוט: לוקח ב-0 עד 5, עומד ב-6 ו-7.'));
        host.replaceChildren(...body.filter((x) => Boolean(x)));
    };
    render();
    return { element: screen({ title: 'מאמן הקלף השלישי', subtitle: 'Third Card Rules', showBack: true }, host) };
}
//# sourceMappingURL=thirdCardTrainer.js.map