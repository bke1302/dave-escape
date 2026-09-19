/** מצב האפליקציה: הגדרות, התקדמות, סטטיסטיקות והישגים — נשמר מקומית. */
import { DEFAULT_RULES } from "../engine/rules.js";
import { createStore } from "./store.js";
export const DIFFICULTY_LABEL_HE = {
    beginner: 'מתחיל',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    expert: 'מומחה',
    master: 'אלוף',
};
export const DOMAIN_LABEL_HE = {
    strategy: 'אסטרטגיה בסיסית',
    runningCount: 'ספירה רצה',
    trueCount: 'ספירה אמיתית',
    deckEstimation: 'הערכת חפיסות',
    betting: 'החלטות הימור',
    deviations: 'סטיות לפי ספירה',
    casino: 'סימולציית קזינו',
    lessons: 'שיעורים',
};
function emptyTrainer() {
    return { attempts: 0, correct: 0, totalReactionMs: 0 };
}
export function todayKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
}
export const DEFAULT_SETTINGS = {
    rules: { ...DEFAULT_RULES },
    sound: true,
    haptics: true,
    animations: true,
    dealSpeed: 'normal',
    difficulty: 'medium',
    showStrategyHint: true,
    showCount: false,
    startingBankroll: 1000,
    minBet: 10,
    maxBet: 500,
    betSpreadMax: 8,
    acceptedDisclaimer: false,
};
export const DEFAULT_STATS = {
    roundsPlayed: 0,
    handsPlayed: 0,
    trainers: {
        strategy: emptyTrainer(),
        runningCount: emptyTrainer(),
        trueCount: emptyTrainer(),
        deckEstimation: emptyTrainer(),
        betting: emptyTrainer(),
        deviations: emptyTrainer(),
        casino: emptyTrainer(),
        lessons: emptyTrainer(),
    },
    countingSessions: 0,
    bestCountingAccuracy: 0,
    trainingTimeMs: 0,
    currentStreak: 0,
    bestStreak: 0,
    lifetimeNet: 0,
    sessionNet: 0,
    bankroll: 1000,
    peakBankroll: 1000,
    maxDrawdown: 0,
    bankrollHistory: [1000],
    simulations: [],
    perfectDecks: 0,
    lastPlayed: 0,
};
export const DEFAULT_PROGRESS = {
    xp: 0,
    lessons: {},
    achievements: {},
    daily: { date: todayKey(), segments: {}, streak: 0, lastCompletedDate: '', bestScore: 0, history: [] },
    casinoRounds: 0,
    advancedRounds: 0,
    maxLevelReached: 1,
};
export const appStore = createStore({
    settings: DEFAULT_SETTINGS,
    stats: DEFAULT_STATS,
    progress: DEFAULT_PROGRESS,
}, {
    key: 'bjm.state.v1',
    version: 1,
    migrate: (saved) => saved,
});
/** קריאה נוחה. */
export function state() {
    return appStore.get();
}
export function settings() {
    return appStore.get().settings;
}
export function rules() {
    return appStore.get().settings.rules;
}
export function updateSettings(patch) {
    appStore.set((s) => ({ settings: { ...s.settings, ...patch } }));
}
export function updateRules(patch) {
    appStore.set((s) => ({ settings: { ...s.settings, rules: { ...s.settings.rules, ...patch } } }));
}
export function updateStats(patch) {
    appStore.set((s) => ({ stats: { ...s.stats, ...(typeof patch === 'function' ? patch(s.stats) : patch) } }));
}
export function updateProgress(patch) {
    appStore.set((s) => ({
        progress: { ...s.progress, ...(typeof patch === 'function' ? patch(s.progress) : patch) },
    }));
}
/** רישום תשובה בתרגיל — מעדכן דיוק, רצף, זמן תגובה ו-XP. */
export function recordAnswer(domain, correct, reactionMs = 0) {
    updateStats((s) => {
        const trainer = s.trainers[domain];
        const nextStreak = correct ? s.currentStreak + 1 : 0;
        return {
            trainers: {
                ...s.trainers,
                [domain]: {
                    attempts: trainer.attempts + 1,
                    correct: trainer.correct + (correct ? 1 : 0),
                    totalReactionMs: trainer.totalReactionMs + Math.max(0, reactionMs),
                },
            },
            currentStreak: nextStreak,
            bestStreak: Math.max(s.bestStreak, nextStreak),
            trainingTimeMs: s.trainingTimeMs + Math.max(0, Math.min(reactionMs, 60000)),
        };
    });
    updateProgress((p) => ({ xp: p.xp + (correct ? 10 : 2) }));
}
/** עדכון הון לאחר סיבוב משחק. */
export function recordRound(net, hands) {
    updateStats((s) => {
        const bankroll = s.bankroll + net;
        const peak = Math.max(s.peakBankroll, bankroll);
        const history = [...s.bankrollHistory, bankroll].slice(-300);
        return {
            roundsPlayed: s.roundsPlayed + 1,
            handsPlayed: s.handsPlayed + hands,
            bankroll,
            peakBankroll: peak,
            maxDrawdown: Math.max(s.maxDrawdown, peak - bankroll),
            lifetimeNet: s.lifetimeNet + net,
            sessionNet: s.sessionNet + net,
            bankrollHistory: history,
            lastPlayed: Date.now(),
        };
    });
}
export function accuracy(stats) {
    return stats.attempts ? stats.correct / stats.attempts : 0;
}
export function averageReaction(stats) {
    return stats.attempts ? stats.totalReactionMs / stats.attempts : 0;
}
/** דיוק כולל בכל התרגילים. */
export function overallAccuracy(stats) {
    let attempts = 0;
    let correct = 0;
    for (const domain of Object.keys(stats.trainers)) {
        attempts += stats.trainers[domain].attempts;
        correct += stats.trainers[domain].correct;
    }
    return attempts ? correct / attempts : 0;
}
/** איפוס הון לתחילת מפגש חדש. */
export function resetBankroll() {
    const start = settings().startingBankroll;
    updateStats({
        bankroll: start,
        sessionNet: 0,
        peakBankroll: start,
        maxDrawdown: 0,
        bankrollHistory: [start],
    });
}
export function resetAllProgress() {
    appStore.set({
        settings: { ...DEFAULT_SETTINGS, acceptedDisclaimer: settings().acceptedDisclaimer },
        stats: { ...DEFAULT_STATS, trainers: { ...DEFAULT_STATS.trainers } },
        progress: { ...DEFAULT_PROGRESS, daily: { ...DEFAULT_PROGRESS.daily, date: todayKey() } },
    });
}
//# sourceMappingURL=appState.js.map