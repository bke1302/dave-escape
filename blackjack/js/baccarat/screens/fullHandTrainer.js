/** מאמן יד מלאה — חשב את שתי הידיים וקבע מי מנצח. */
import { buildShoeCards } from "../../engine/cards.js";
import { createRng, fisherYatesShuffle } from "../../engine/rng.js";
import { h, pct } from "../../ui/dom.js";
import { button, optionGrid } from "../../ui/components/controls.js";
import { answerBanner } from "../../ui/components/feedbackUi.js";
import { note, panel, screen, statTile } from "../../ui/components/layout.js";
import { cardView } from "../../ui/components/playingCard.js";
import { adaptiveHint, baccarat, baccaratAccuracy, recordBaccaratAnswer } from "../state.js";
import { baccaratCardValue, handTotal } from "../engine/hand.js";
import { bankerDraws, playerDraws } from "../engine/thirdCard.js";
import { OUTCOME_LABEL_HE } from "../engine/game.js";
const rng = createRng();
/** בונה תרגיל: ברמה 1 שתי ידיים של שני קלפים, ברמות גבוהות גם קלף שלישי. */
function buildDeal(difficulty) {
    const deck = fisherYatesShuffle(buildShoeCards(1), rng);
    let index = 0;
    const playerCards = [deck[index++], deck[index++]];
    const bankerCards = [deck[index++], deck[index++]];
    let playerTotal = handTotal(playerCards);
    let bankerTotal = handTotal(bankerCards);
    let withThird = false;
    const natural = playerTotal >= 8 || bankerTotal >= 8;
    if (!natural && difficulty >= 2) {
        // ברמות מתקדמות מיישמים את חוקי הקלף השלישי במלואם
        let playerThird = null;
        if (playerDraws(playerTotal)) {
            const card = deck[index++];
            playerCards.push(card);
            playerThird = baccaratCardValue(card);
            playerTotal = handTotal(playerCards);
            withThird = true;
        }
        if (bankerDraws(bankerTotal, playerThird)) {
            bankerCards.push(deck[index++]);
            bankerTotal = handTotal(bankerCards);
            withThird = true;
        }
    }
    return {
        playerCards,
        bankerCards,
        playerTotal,
        bankerTotal,
        withThird,
        outcome: playerTotal > bankerTotal ? 'player' : bankerTotal > playerTotal ? 'banker' : 'tie',
    };
}
export function baccaratFullHandTrainerScreen() {
    let deal = buildDeal(adaptiveHint().difficulty);
    let answered = false;
    let feedback = null;
    let startedAt = Date.now();
    const host = h('div', { class: 'stack' });
    const next = () => {
        deal = buildDeal(adaptiveHint().difficulty);
        answered = false;
        feedback = null;
        startedAt = Date.now();
        render();
    };
    const handView = (title, cards, side) => h('div', { class: `bacc-side ${side}` }, h('span', { class: 'bacc-side-title', text: title }), h('div', { class: 'bacc-cards' }, ...cards.map((c, i) => cardView(c, { small: true, delay: i * 50 }))), h('span', { class: 'text-faint', text: cards.map(baccaratCardValue).join(' + ') }));
    const render = () => {
        const b = baccarat();
        host.replaceChildren(h('div', { class: 'grid grid-3' }, statTile('תרגילים', String(b.trainers.fullHand.attempts)), statTile('דיוק', pct(baccaratAccuracy(b.trainers.fullHand), 0)), statTile('רמה', `${adaptiveHint(b).difficulty}/3`)), panel({ title: 'מי מנצח?', subtitle: 'חשב את שתי הידיים וקבע את התוצאה', icon: '🧩' }, h('div', { class: 'bacc-sides' }, handView('שחקן', deal.playerCards, 'player'), handView('בנקאי', deal.bankerCards, 'banker')), answered && feedback
            ? feedback
            : optionGrid([
                { key: 'player', label: 'שחקן מנצח' },
                { key: 'banker', label: 'בנקאי מנצח' },
                { key: 'tie', label: 'תיקו' },
            ], (key, el) => {
                if (answered)
                    return;
                answered = true;
                const correct = key === deal.outcome;
                recordBaccaratAnswer('fullHand', correct, Date.now() - startedAt);
                el.classList.add(correct ? 'correct' : 'wrong');
                feedback = h('div', { class: 'stack' }, answerBanner(correct, correct ? `נכון — ${OUTCOME_LABEL_HE[deal.outcome]}` : `לא נכון — ${OUTCOME_LABEL_HE[deal.outcome]}`, `שחקן: ${deal.playerCards.map(baccaratCardValue).join(' + ')} = ${deal.playerTotal} · בנקאי: ${deal.bankerCards.map(baccaratCardValue).join(' + ')} = ${deal.bankerTotal}.${deal.withThird ? ' התרגיל כלל קלף שלישי שחולק לפי החוקים.' : ''}`), button('תרגיל הבא', next, { tone: 'gold', wide: true }));
                render();
            }, 3)), note('ככל שהדיוק שלך עולה, התרגילים יכללו יותר ידיים עם קלף שלישי.'));
    };
    render();
    return { element: screen({ title: 'יד מלאה', subtitle: 'Full Hand Trainer', showBack: true }, host) };
}
//# sourceMappingURL=fullHandTrainer.js.map