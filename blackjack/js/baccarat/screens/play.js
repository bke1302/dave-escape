import { delay, h, money, num } from "../../ui/dom.js";
import { button, chip, CHIP_VALUES, segmented } from "../../ui/components/controls.js";
import { achievementToast, toast } from "../../ui/components/feedbackUi.js";
import { note, panel, screen, statTile } from "../../ui/components/layout.js";
import { cardView } from "../../ui/components/playingCard.js";
import { sfx } from "../../ui/feedback.js";
import { navigate } from "../../ui/router.js";
import { settings } from "../../state/appState.js";
import { BaccaratGame, BET_LABEL_HE, OUTCOME_LABEL_HE } from "../engine/game.js";
import { describeBaccaratRulesHe } from "../engine/rules.js";
import { betMath } from "../engine/probability.js";
import { DERIVED_ROADS_NOTE_HE, ROAD_NOTE_HE, summarize } from "../engine/road.js";
import { baccarat, baccaratRules, recordBaccaratHand, resetBaccaratSession, updateBaccarat } from "../state.js";
import { checkBaccaratAchievements } from "../content/progression.js";
import { beadPlateView, bigRoadView, historyStrip, roadLegend } from "../ui/roadView.js";
const SPEED_MS = { slow: 620, normal: 380, fast: 200 };
export function baccaratPlayScreen() {
    const rules = baccaratRules();
    const game = new BaccaratGame(rules);
    // שחזור ההיסטוריה השמורה כדי שהלוחות ימשיכו מהמקום שבו הפסקת
    game.history = [...baccarat().outcomes];
    let phase = 'betting';
    let bet = baccarat().lastBet;
    let amount = Math.max(baccarat().minBet, Math.min(baccarat().minBet * 2, baccarat().maxBet));
    let round = null;
    let revealedPlayer = 0;
    let revealedBanker = 0;
    let lastNet = 0;
    let historyWindow = 20;
    let cancelled = false;
    const feltEl = h('div', { class: 'bacc-felt' });
    const controlsEl = h('div', { class: 'table-controls' });
    const roadsEl = h('div', { class: 'stack' });
    const statsEl = h('div', { class: 'grid grid-3' });
    const speed = () => SPEED_MS[settings().dealSpeed] ?? 380;
    const sideView = (title, cards, revealed, total, side, winner) => h('div', { class: `bacc-side ${side}${winner ? ' winner' : ''}` }, h('span', { class: 'bacc-side-title', text: title }), h('div', { class: 'bacc-cards' }, ...(revealed > 0
        ? cards.slice(0, revealed).map((c, i) => cardView(c, { small: true, delay: i * 40, animate: settings().animations }))
        : [h('div', { class: 'seat-placeholder', text: '—' })])), h('span', { class: 'bacc-total', text: revealed > 0 ? String(total) : '—' }));
    const renderFelt = () => {
        const playerTotal = round
            ? revealedPlayer >= round.playerCards.length
                ? round.playerTotal
                : round.playerCards.slice(0, revealedPlayer).reduce((sum, c) => sum + (c.rank === 'A' ? 1 : c.rank === '10' || c.rank === 'J' || c.rank === 'Q' || c.rank === 'K' ? 0 : Number(c.rank)), 0) % 10
            : 0;
        const bankerTotal = round
            ? revealedBanker >= round.bankerCards.length
                ? round.bankerTotal
                : round.bankerCards.slice(0, revealedBanker).reduce((sum, c) => sum + (c.rank === 'A' ? 1 : c.rank === '10' || c.rank === 'J' || c.rank === 'Q' || c.rank === 'K' ? 0 : Number(c.rank)), 0) % 10
            : 0;
        const showWinner = phase === 'result' && round;
        feltEl.replaceChildren(h('div', { class: 'bacc-sides' }, sideView('שחקן (Player)', round?.playerCards ?? [], revealedPlayer, playerTotal, 'player', Boolean(showWinner && round?.outcome === 'player')), sideView('בנקאי (Banker)', round?.bankerCards ?? [], revealedBanker, bankerTotal, 'banker', Boolean(showWinner && round?.outcome === 'banker'))), h('div', {
            class: 'bacc-result',
            text: phase === 'result' && round
                ? `${OUTCOME_LABEL_HE[round.outcome]} — ${lastNet > 0 ? `רווח ${money(lastNet)}` : lastNet < 0 ? `הפסד ${money(Math.abs(lastNet))}` : 'ההימור חוזר'}`
                : phase === 'dealing'
                    ? 'מחלק...'
                    : 'בחר הימור וסכום, ואז חלק קלפים',
        }));
    };
    const renderStats = () => {
        const b = baccarat();
        const s = summarize(game.history);
        statsEl.replaceChildren(statTile('הון', money(b.bankroll)), statTile('ידיים', num(b.handsPlayed)), statTile('רצף נוכחי', `${s.currentStreak}${s.currentResult ? ` ${s.currentResult === 'banker' ? 'B' : 'P'}` : ''}`));
    };
    const renderRoads = () => {
        const s = summarize(game.history);
        roadsEl.replaceChildren(panel({ title: 'לוחות התוצאות', subtitle: `${s.total} ידיים · P ${s.player} · B ${s.banker} · T ${s.tie}`, icon: '🗺️' }, h('p', { class: 'text-faint', text: 'הדרך הגדולה (Big Road)' }), bigRoadView(game.history, 18), h('p', { class: 'text-faint', text: 'לוח חרוזים (Bead Plate)' }), beadPlateView(game.history, 12), roadLegend()), panel({ title: 'היסטוריה', icon: '🕘' }, segmented([
            { value: 10, label: '10 אחרונות' },
            { value: 20, label: '20' },
            { value: 50, label: '50' },
            { value: 100, label: '100' },
        ], historyWindow, (value) => {
            historyWindow = value;
            renderRoads();
        }, 'חלון היסטוריה'), historyStrip(game.history, historyWindow), h('p', { class: 'text-faint', text: `הרצף הארוך ביותר: ${s.longestStreak}` })), note(ROAD_NOTE_HE, '📏'), note(DERIVED_ROADS_NOTE_HE, 'ℹ️'));
    };
    const renderControls = () => {
        const b = baccarat();
        const math = betMath(rules);
        controlsEl.replaceChildren();
        if (phase === 'dealing') {
            controlsEl.appendChild(h('div', { class: 'stack', style: { padding: '12px' } }, h('p', { class: 'text-dim', style: { textAlign: 'center' }, text: 'הקלפים מחולקים לפי חוקי המשחק — אין החלטות בשלב הזה.' })));
            return;
        }
        if (phase === 'result') {
            controlsEl.appendChild(h('div', { class: 'stack', style: { padding: '12px' } }, button('יד הבאה', () => {
                phase = 'betting';
                round = null;
                revealedPlayer = 0;
                revealedBanker = 0;
                renderAll();
            }, { tone: 'gold', wide: true })));
            return;
        }
        const betRow = h('div', { class: 'bacc-bet-row' }, ...['player', 'banker', 'tie'].map((type) => {
            const info = math.find((m) => m.bet === type);
            return h('button', {
                class: `bacc-bet ${type}-bet${bet === type ? ' selected' : ''}`,
                attrs: { type: 'button', 'aria-pressed': bet === type },
                on: {
                    click: () => {
                        sfx.chip();
                        bet = type;
                        renderControls();
                    },
                },
            }, h('span', { text: BET_LABEL_HE[type] }), h('span', { class: 'bet-payout', text: info?.payout ?? '' }), h('span', { class: 'bet-payout', text: info ? `יתרון בית ${(info.houseEdge * 100).toFixed(2)}%` : '' }));
        }));
        const chipRail = h('div', { class: 'chip-rail' }, ...CHIP_VALUES.map((value) => chip(value, () => {
            amount = Math.min(b.maxBet, amount + value);
            renderControls();
        }, amount + value > b.maxBet || value > b.bankroll)));
        controlsEl.appendChild(h('div', { class: 'stack', style: { padding: '10px 12px' } }, betRow, h('div', { class: 'row-between' }, h('span', { class: 'text-dim', text: 'ההימור שלך' }), h('span', { class: 'big-number text-gold', text: money(amount) })), chipRail, h('div', { class: 'row-center' }, button('נקה', () => {
            amount = b.minBet;
            renderControls();
        }, { tone: 'ghost', small: true }), button('מקסימום', () => {
            amount = Math.min(b.maxBet, Math.max(b.minBet, b.bankroll));
            renderControls();
        }, { tone: 'ghost', small: true })), button('חלק קלפים', deal, { tone: 'primary', wide: true, disabled: amount <= 0 || amount > b.bankroll })));
    };
    const renderAll = () => {
        renderFelt();
        renderStats();
        renderControls();
        renderRoads();
    };
    async function deal() {
        if (phase !== 'betting')
            return;
        phase = 'dealing';
        revealedPlayer = 0;
        revealedBanker = 0;
        const before = game.shoe.shuffleCount;
        round = game.playRound();
        if (game.shoe.shuffleCount > before)
            toast('הנעל עורבבה', 'info');
        renderAll();
        const step = settings().animations ? speed() : 0;
        // חלוקה: שחקן, בנקאי, שחקן, בנקאי
        for (const target of ['player', 'banker', 'player', 'banker']) {
            if (cancelled)
                return;
            if (target === 'player')
                revealedPlayer++;
            else
                revealedBanker++;
            sfx.cardDeal();
            renderFelt();
            await delay(step);
        }
        if (round.playerCards.length > 2) {
            if (cancelled)
                return;
            await delay(step);
            revealedPlayer = 3;
            sfx.cardFlip();
            renderFelt();
            await delay(step);
        }
        if (round.bankerCards.length > 2) {
            if (cancelled)
                return;
            revealedBanker = 3;
            sfx.cardFlip();
            renderFelt();
            await delay(step);
        }
        if (cancelled)
            return;
        lastNet = game.settleBet(bet, amount, round);
        recordBaccaratHand(bet, amount, lastNet, round.outcome);
        const unlocked = checkBaccaratAchievements(baccarat());
        if (unlocked.length) {
            updateBaccarat((s) => ({
                achievements: { ...s.achievements, ...Object.fromEntries(unlocked.map((a) => [a.id, Date.now()])) },
            }));
            for (const a of unlocked)
                achievementToast(a.icon, a.title);
        }
        if (lastNet > 0)
            sfx.win();
        else if (lastNet < 0)
            sfx.lose();
        else
            sfx.push();
        phase = 'result';
        renderAll();
    }
    renderAll();
    const element = screen({ title: 'שולחן באקרה', subtitle: describeBaccaratRulesHe(rules), showBack: true, variant: 'table' }, h('div', { style: { padding: '8px 12px 0' } }, statsEl), feltEl, controlsEl, h('div', { class: 'stack', style: { padding: '12px' } }, roadsEl, panel({ title: 'כלים', icon: '🧰' }, h('div', { class: 'row-center' }, button('חוקי השולחן', () => navigate('/baccarat/settings'), { tone: 'ghost', small: true }), button('הסתברויות', () => navigate('/baccarat/probability'), { tone: 'ghost', small: true }), button('אפס מפגש', () => {
        resetBaccaratSession();
        game.history = [];
        renderAll();
        toast('המפגש אופס', 'info');
    }, { tone: 'ghost', small: true }))), note('אין בבאקרה החלטות במהלך היד — הקלף השלישי נקבע כולו על ידי החוקים. ההחלטה היחידה שלך היא ההימור.')));
    return {
        element,
        onUnmount: () => {
            cancelled = true;
        },
    };
}
//# sourceMappingURL=play.js.map