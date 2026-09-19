/** מצב האפליקציה: הגדרות, התקדמות, סטטיסטיקות והישגים — נשמר מקומית. */
import { DEFAULT_RULES, type Rules } from '../engine/rules.ts';
import { createStore } from './store.ts';

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert' | 'master';
export type DealSpeed = 'slow' | 'normal' | 'fast';

export const DIFFICULTY_LABEL_HE: Record<Difficulty, string> = {
  beginner: 'מתחיל',
  easy: 'קל',
  medium: 'בינוני',
  hard: 'קשה',
  expert: 'מומחה',
  master: 'אלוף',
};

export interface Settings {
  rules: Rules;
  sound: boolean;
  haptics: boolean;
  animations: boolean;
  dealSpeed: DealSpeed;
  difficulty: Difficulty;
  /** רמז אסטרטגיה בזמן משחק. */
  showStrategyHint: boolean;
  /** הצגת ספירה רצה בזמן משחק (כבוי במצב מתקדם). */
  showCount: boolean;
  startingBankroll: number;
  minBet: number;
  maxBet: number;
  betSpreadMax: number;
  acceptedDisclaimer: boolean;
}

export interface TrainerStats {
  attempts: number;
  correct: number;
  totalReactionMs: number;
}

export type TrainerDomain =
  | 'strategy'
  | 'runningCount'
  | 'trueCount'
  | 'deckEstimation'
  | 'betting'
  | 'deviations'
  | 'casino'
  | 'lessons';

export const DOMAIN_LABEL_HE: Record<TrainerDomain, string> = {
  strategy: 'אסטרטגיה בסיסית',
  runningCount: 'ספירה רצה',
  trueCount: 'ספירה אמיתית',
  deckEstimation: 'הערכת חפיסות',
  betting: 'החלטות הימור',
  deviations: 'סטיות לפי ספירה',
  casino: 'סימולציית קזינו',
  lessons: 'שיעורים',
};

export interface SimSummary {
  at: number;
  strategy: string;
  hands: number;
  edge: number;
  profit: number;
  rules: string;
}

export interface AppStats {
  roundsPlayed: number;
  handsPlayed: number;
  trainers: Record<TrainerDomain, TrainerStats>;
  countingSessions: number;
  bestCountingAccuracy: number;
  trainingTimeMs: number;
  currentStreak: number;
  bestStreak: number;
  lifetimeNet: number;
  sessionNet: number;
  bankroll: number;
  peakBankroll: number;
  maxDrawdown: number;
  bankrollHistory: number[];
  simulations: SimSummary[];
  perfectDecks: number;
  lastPlayed: number;
}

export interface LessonProgress {
  completed: boolean;
  bestScore: number;
}

export interface DailySegmentState {
  done: boolean;
  correct: number;
  attempts: number;
}

export interface DailyState {
  date: string;
  segments: Record<string, DailySegmentState>;
  streak: number;
  lastCompletedDate: string;
  bestScore: number;
  history: { date: string; score: number; accuracy: number }[];
}

export interface Progress {
  xp: number;
  lessons: Record<string, LessonProgress>;
  achievements: Record<string, number>;
  daily: DailyState;
  casinoRounds: number;
  advancedRounds: number;
  maxLevelReached: number;
}

export interface AppState {
  settings: Settings;
  stats: AppStats;
  progress: Progress;
}

function emptyTrainer(): TrainerStats {
  return { attempts: 0, correct: 0, totalReactionMs: 0 };
}

export function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export const DEFAULT_SETTINGS: Settings = {
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

export const DEFAULT_STATS: AppStats = {
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

export const DEFAULT_PROGRESS: Progress = {
  xp: 0,
  lessons: {},
  achievements: {},
  daily: { date: todayKey(), segments: {}, streak: 0, lastCompletedDate: '', bestScore: 0, history: [] },
  casinoRounds: 0,
  advancedRounds: 0,
  maxLevelReached: 1,
};

export const appStore = createStore<AppState>(
  {
    settings: DEFAULT_SETTINGS,
    stats: DEFAULT_STATS,
    progress: DEFAULT_PROGRESS,
  },
  {
    key: 'bjm.state.v1',
    version: 1,
    migrate: (saved) => saved as Partial<AppState>,
  },
);

/** קריאה נוחה. */
export function state(): AppState {
  return appStore.get();
}

export function settings(): Settings {
  return appStore.get().settings;
}

export function rules(): Rules {
  return appStore.get().settings.rules;
}

export function updateSettings(patch: Partial<Settings>): void {
  appStore.set((s) => ({ settings: { ...s.settings, ...patch } }));
}

export function updateRules(patch: Partial<Rules>): void {
  appStore.set((s) => ({ settings: { ...s.settings, rules: { ...s.settings.rules, ...patch } } }));
}

export function updateStats(patch: Partial<AppStats> | ((s: AppStats) => Partial<AppStats>)): void {
  appStore.set((s) => ({ stats: { ...s.stats, ...(typeof patch === 'function' ? patch(s.stats) : patch) } }));
}

export function updateProgress(patch: Partial<Progress> | ((p: Progress) => Partial<Progress>)): void {
  appStore.set((s) => ({
    progress: { ...s.progress, ...(typeof patch === 'function' ? patch(s.progress) : patch) },
  }));
}

/** רישום תשובה בתרגיל — מעדכן דיוק, רצף, זמן תגובה ו-XP. */
export function recordAnswer(domain: TrainerDomain, correct: boolean, reactionMs: number = 0): void {
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
export function recordRound(net: number, hands: number): void {
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

export function accuracy(stats: TrainerStats): number {
  return stats.attempts ? stats.correct / stats.attempts : 0;
}

export function averageReaction(stats: TrainerStats): number {
  return stats.attempts ? stats.totalReactionMs / stats.attempts : 0;
}

/** דיוק כולל בכל התרגילים. */
export function overallAccuracy(stats: AppStats): number {
  let attempts = 0;
  let correct = 0;
  for (const domain of Object.keys(stats.trainers) as TrainerDomain[]) {
    attempts += stats.trainers[domain].attempts;
    correct += stats.trainers[domain].correct;
  }
  return attempts ? correct / attempts : 0;
}

/** איפוס הון לתחילת מפגש חדש. */
export function resetBankroll(): void {
  const start = settings().startingBankroll;
  updateStats({
    bankroll: start,
    sessionNet: 0,
    peakBankroll: start,
    maxDrawdown: 0,
    bankrollHistory: [start],
  });
}

export function resetAllProgress(): void {
  appStore.set({
    settings: { ...DEFAULT_SETTINGS, acceptedDisclaimer: settings().acceptedDisclaimer },
    stats: { ...DEFAULT_STATS, trainers: { ...DEFAULT_STATS.trainers } },
    progress: { ...DEFAULT_PROGRESS, daily: { ...DEFAULT_PROGRESS.daily, date: todayKey() } },
  });
}
