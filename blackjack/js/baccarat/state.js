/**
 * מצב האקדמיה של באקרה.
 * נשמר כמפתח נפרד במצב האפליקציה — מצב הבלאק ג'ק אינו מושפע כלל.
 */
import { appStore } from "../state/appState.js";
import { DEFAULT_BACCARAT_RULES } from "./engine/rules.js";
export const BACCARAT_DOMAIN_LABEL_HE = {
    handValue: 'חישוב יד',
    thirdCard: 'חוקי הקלף השלישי',
    fullHand: 'יד מלאה',
    road: 'קריאת לוחות',
    probability: 'הסתברויות',
    quiz: 'מבחני שיעורים',
};
function emptyTrainer() {
    return { attempts: 0, correct: 0, totalReactionMs: 0 };
}
export const DEFAULT_BACCARAT_STATE = {
    rules: { ...DEFAULT_BACCARAT_RULES },
    startingBankroll: 1000,
    bankroll: 1000,
    minBet: 10,
    maxBet: 500,
    lastBet: 'banker',
    handsPlayed: 0,
    betsPlayer: 0,
    betsBanker: 0,
    betsTie: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    totalWagered: 0,
    netProfit: 0,
    sessionNet: 0,
    peakBankroll: 1000,
    maxDrawdown: 0,
    longestWinStreak: 0,
    longestLoseStreak: 0,
    currentWinStreak: 0,
    currentLoseStreak: 0,
    bankrollHistory: [1000],
    outcomes: [],
    trainers: {
        handValue: emptyTrainer(),
        thirdCard: emptyTrainer(),
        fullHand: emptyTrainer(),
        road: emptyTrainer(),
        probability: emptyTrainer(),
        quiz: emptyTrainer(),
    },
    lessons: {},
    achievements: {},
    xp: 0,
    trainingTimeMs: 0,
    currentStreak: 0,
    bestStreak: 0,
    simulations: [],
    adaptiveLevel: 1,
};
/** קריאה בטוחה של מצב הבאקרה (כולל מצבים שנשמרו לפני שהמודול נוסף). */
export function baccarat() {
    const state = appStore.get();
    const saved = state.baccarat;
    if (!saved)
        return DEFAULT_BACCARAT_STATE;
    return {
        ...DEFAULT_BACCARAT_STATE,
        ...saved,
        rules: { ...DEFAULT_BACCARAT_RULES, ...(saved.rules ?? {}) },
        trainers: { ...DEFAULT_BACCARAT_STATE.trainers, ...(saved.trainers ?? {}) },
        lessons: { ...(saved.lessons ?? {}) },
        achievements: { ...(saved.achievements ?? {}) },
    };
}
export function baccaratRules() {
    return baccarat().rules;
}
export function updateBaccarat(patch) {
    const current = baccarat();
    const next = typeof patch === 'function' ? patch(current) : patch;
    appStore.set({ baccarat: { ...current, ...next } });
}
export function updateBaccaratRules(patch) {
    updateBaccarat((s) => ({ rules: { ...s.rules, ...patch } }));
}
/** רישום תשובה בתרגיל באקרה. */
export function recordBaccaratAnswer(domain, correct, reactionMs = 0) {
    updateBaccarat((s) => {
        const trainer = s.trainers[domain];
        const streak = correct ? s.currentStreak + 1 : 0;
        return {
            trainers: {
                ...s.trainers,
                [domain]: {
                    attempts: trainer.attempts + 1,
                    correct: trainer.correct + (correct ? 1 : 0),
                    totalReactionMs: trainer.totalReactionMs + Math.max(0, reactionMs),
                },
            },
            currentStreak: streak,
            bestStreak: Math.max(s.bestStreak, streak),
            xp: s.xp + (correct ? 10 : 2),
            trainingTimeMs: s.trainingTimeMs + Math.max(0, Math.min(reactionMs, 60000)),
        };
    });
}
/** רישום יד ששוחקה בשולחן. */
export function recordBaccaratHand(bet, amount, net, outcome) {
    updateBaccarat((s) => {
        const bankroll = s.bankroll + net;
        const peak = Math.max(s.peakBankroll, bankroll);
        const winStreak = net > 0 ? s.currentWinStreak + 1 : 0;
        const loseStreak = net < 0 ? s.currentLoseStreak + 1 : 0;
        return {
            handsPlayed: s.handsPlayed + 1,
            betsPlayer: s.betsPlayer + (bet === 'player' ? 1 : 0),
            betsBanker: s.betsBanker + (bet === 'banker' ? 1 : 0),
            betsTie: s.betsTie + (bet === 'tie' ? 1 : 0),
            wins: s.wins + (net > 0 ? 1 : 0),
            losses: s.losses + (net < 0 ? 1 : 0),
            pushes: s.pushes + (net === 0 ? 1 : 0),
            totalWagered: s.totalWagered + amount,
            netProfit: s.netProfit + net,
            sessionNet: s.sessionNet + net,
            bankroll,
            peakBankroll: peak,
            maxDrawdown: Math.max(s.maxDrawdown, peak - bankroll),
            currentWinStreak: winStreak,
            currentLoseStreak: loseStreak,
            longestWinStreak: Math.max(s.longestWinStreak, winStreak),
            longestLoseStreak: Math.max(s.longestLoseStreak, loseStreak),
            bankrollHistory: [...s.bankrollHistory, bankroll].slice(-300),
            outcomes: [...s.outcomes, outcome].slice(-500),
            lastBet: bet,
        };
    });
}
export function baccaratAccuracy(stats) {
    return stats.attempts ? stats.correct / stats.attempts : 0;
}
export function baccaratOverallAccuracy(s) {
    let attempts = 0;
    let correct = 0;
    for (const key of Object.keys(s.trainers)) {
        attempts += s.trainers[key].attempts;
        correct += s.trainers[key].correct;
    }
    return attempts ? correct / attempts : 0;
}
/**
 * למידה מסתגלת: מאתר את התחום החלש ביותר (לפחות 5 ניסיונות),
 * ומתאים את רמת הקושי לפי הדיוק הכולל.
 */
export function adaptiveHint(s = baccarat()) {
    let weakest = null;
    let worst = 1;
    for (const key of Object.keys(s.trainers)) {
        const stats = s.trainers[key];
        if (stats.attempts < 5)
            continue;
        const acc = baccaratAccuracy(stats);
        if (acc < worst) {
            worst = acc;
            weakest = key;
        }
    }
    const overall = baccaratOverallAccuracy(s);
    const difficulty = overall >= 0.9 ? 3 : overall >= 0.75 ? 2 : 1;
    if (weakest && worst < 0.75) {
        return {
            domain: weakest,
            message: `נראה ש${BACCARAT_DOMAIN_LABEL_HE[weakest]} עדיין דורש תרגול — הדיוק שלך שם ${Math.round(worst * 100)}%. הוספנו לך יותר תרגילים בנושא.`,
            difficulty,
        };
    }
    if (overall >= 0.9 && s.trainers.thirdCard.attempts >= 10) {
        return { domain: null, message: 'הדיוק שלך גבוה — רמת הקושי עלתה ותקבל ידיים מורכבות יותר.', difficulty };
    }
    return { domain: null, message: 'המשך לתרגל — המערכת מתאימה את הקושי לפי הביצועים שלך.', difficulty };
}
export function resetBaccaratSession() {
    const s = baccarat();
    updateBaccarat({
        bankroll: s.startingBankroll,
        sessionNet: 0,
        peakBankroll: s.startingBankroll,
        maxDrawdown: 0,
        bankrollHistory: [s.startingBankroll],
        outcomes: [],
    });
}
export function resetBaccaratProgress() {
    appStore.set({ baccarat: { ...DEFAULT_BACCARAT_STATE, trainers: { ...DEFAULT_BACCARAT_STATE.trainers } } });
}
//# sourceMappingURL=state.js.map