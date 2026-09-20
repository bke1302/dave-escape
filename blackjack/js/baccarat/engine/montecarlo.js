/**
 * סימולטור באקרה — מריץ את מנוע המשחק האמיתי (אותה נעל, אותם חוקי קלף שלישי).
 * כל המספרים בתוצאה נמדדים מהריצה עצמה.
 */
import { createRng } from "../../engine/rng.js";
import { RunningStats, SeriesTracker } from "../../engine/stats.js";
import { BaccaratGame } from "./game.js";
export const BET_CHOICE_LABEL_HE = {
    player: 'תמיד שחקן',
    banker: 'תמיד בנקאי',
    tie: 'תמיד תיקו',
    random: 'הימור אקראי',
    alternate: 'לסירוגין',
};
export const METHOD_LABEL_HE = {
    flat: 'הימור קבוע (Flat)',
    martingale: 'מרטינגייל (הכפלה אחרי הפסד)',
    dalembert: "ד'אלמבר (+1 אחרי הפסד)",
    fibonacci: 'פיבונאצ׳י',
    paroli: 'פרולי (הכפלה אחרי ניצחון)',
};
function nextBet(method, base, maxBet, lastNet, state) {
    switch (method) {
        case 'flat':
            return base;
        case 'martingale':
            if (lastNet < 0)
                state.step++;
            else
                state.step = 0;
            return Math.min(maxBet, base * Math.pow(2, state.step));
        case 'dalembert':
            if (lastNet < 0)
                state.step++;
            else if (lastNet > 0)
                state.step = Math.max(0, state.step - 1);
            return Math.min(maxBet, base * (1 + state.step));
        case 'fibonacci': {
            if (lastNet < 0) {
                state.fib = [state.fib[1], state.fib[0] + state.fib[1]];
            }
            else if (lastNet > 0) {
                state.fib = [1, 1];
            }
            return Math.min(maxBet, base * state.fib[0]);
        }
        case 'paroli':
            if (lastNet > 0)
                state.step = Math.min(3, state.step + 1);
            else
                state.step = 0;
            return Math.min(maxBet, base * Math.pow(2, state.step));
    }
}
export function runBaccaratSimulation(config, onProgress) {
    const started = Date.now();
    const rng = createRng(config.seed ?? Date.now() >>> 0);
    const game = new BaccaratGame(config.rules, rng);
    const perHand = new RunningStats();
    const series = new SeriesTracker(config.bankroll);
    const state = { step: 0, fib: [1, 1] };
    let bankroll = config.bankroll;
    let wins = 0;
    let losses = 0;
    let pushes = 0;
    let playerResults = 0;
    let bankerResults = 0;
    let tieResults = 0;
    let totalWagered = 0;
    let lastNet = 0;
    let ruined = false;
    const samples = [];
    const sampleEvery = Math.max(1, Math.floor(config.hands / 200));
    const progressEvery = Math.max(500, Math.floor(config.hands / 100));
    let hand = 0;
    for (; hand < config.hands; hand++) {
        const amount = Math.max(config.baseBet, nextBet(config.method, config.baseBet, config.maxBet, lastNet, state));
        const choice = config.bet === 'random'
            ? ['player', 'banker', 'tie'][Math.floor(rng() * 3)]
            : config.bet === 'alternate'
                ? hand % 2 === 0
                    ? 'player'
                    : 'banker'
                : config.bet;
        const round = game.playRound();
        if (round.outcome === 'player')
            playerResults++;
        else if (round.outcome === 'banker')
            bankerResults++;
        else
            tieResults++;
        const net = game.settleBet(choice, amount, round);
        lastNet = net;
        if (net > 0)
            wins++;
        else if (net < 0)
            losses++;
        else
            pushes++;
        totalWagered += amount;
        bankroll += net;
        perHand.push(net / config.baseBet);
        series.update(net);
        if (hand % sampleEvery === 0)
            samples.push(bankroll);
        if (onProgress && hand % progressEvery === 0) {
            onProgress({ completed: hand, total: config.hands, bankroll });
        }
        if (config.stopOnRuin && bankroll <= 0) {
            ruined = true;
            hand++;
            break;
        }
    }
    const played = hand;
    const profit = bankroll - config.bankroll;
    samples.push(bankroll);
    return {
        hands: played,
        bet: config.bet,
        method: config.method,
        rulesSummary: `${config.rules.decks} חפיסות · ${config.rules.commissionMode === 'commission' ? `עמלה ${(config.rules.commissionRate * 100).toFixed(0)}%` : 'ללא עמלה'} · תיקו ${config.rules.tiePayout}:1`,
        wins,
        losses,
        pushes,
        playerResults,
        bankerResults,
        tieResults,
        winRate: played ? wins / played : 0,
        lossRate: played ? losses / played : 0,
        tieRate: played ? tieResults / played : 0,
        totalWagered,
        averageBet: played ? totalWagered / played : 0,
        profit,
        roi: totalWagered ? profit / totalWagered : 0,
        evPerHandUnits: played ? profit / config.baseBet / played : 0,
        houseEdge: totalWagered ? -profit / totalWagered : 0,
        variancePerHand: perHand.variance,
        sdPerHand: perHand.sd,
        maxDrawdown: series.maxDrawdown,
        longestWinStreak: series.longestWinStreak,
        longestLoseStreak: series.longestLoseStreak,
        startingBankroll: config.bankroll,
        endingBankroll: bankroll,
        peakBankroll: series.peak,
        ruined,
        bankrollSamples: samples,
        shuffles: game.shoe.shuffleCount,
        elapsedMs: Date.now() - started,
    };
}
/** משווה בין הימורים שונים על אותה סדרת קלפים (אותו זרע). */
export function compareBaccaratBets(base, bets, onProgress) {
    return bets.map((bet) => runBaccaratSimulation({ ...base, bet }, (p) => onProgress?.({ ...p, bet })));
}
export const BACCARAT_SIM_NOTE_HE = 'שיטות הימור פרוגרסיביות משנות את פיזור התוצאות — לא את התוחלת. הרץ את אותה סימולציה עם שיטות שונות והשווה: יתרון הבית נשאר כמעט זהה, אבל ירידת השיא והסיכון משתנים דרמטית.';
//# sourceMappingURL=montecarlo.js.map