/**
 * סימולטור מונטה קרלו.
 *
 * כל התוצאות מגיעות ממנוע המשחק האמיתי של האפליקציה — אותה נעל, אותם חוקים,
 * אותה לוגיקת דילר. אין כאן מספרים "מוכנים מראש".
 */
import { rankValue } from './cards.ts';
import { buildChart, chartAction, type PlayAction } from './basicStrategy.ts';
import { betForTrueCount, trueCount, type BetSpread } from './counting.ts';
import { actionForDeviation, findDeviation, INSURANCE_INDEX } from './deviations.ts';
import { BlackjackGame } from './game.ts';
import { createRng } from './rng.ts';
import type { Rules } from './rules.ts';
import { RunningStats, SeriesTracker } from './stats.ts';
import { riskOfRuin } from './risk.ts';

export type SimStrategy = 'random' | 'basic' | 'counting' | 'countingDeviations';

export const STRATEGY_LABEL_HE: Record<SimStrategy, string> = {
  random: 'משחק אקראי',
  basic: 'אסטרטגיה בסיסית',
  counting: 'אסטרטגיה בסיסית + ספירה',
  countingDeviations: 'ספירה + סטיות (Deviations)',
};

export interface SimConfig {
  hands: number;
  rules: Rules;
  strategy: SimStrategy;
  /** יחידת הימור בסיסית. */
  baseBet: number;
  /** הון התחלתי (לצורך מדידת ירידות וחורבן). */
  bankroll: number;
  /** פריסת הימורים לשימוש אסטרטגיות ספירה. */
  spread: BetSpread;
  seed?: number;
  /** לעצור כאשר ההון מתאפס. */
  stopOnRuin?: boolean;
}

export interface SimResult {
  config: Omit<SimConfig, 'rules'> & { rulesSummary: string };
  totalRounds: number;
  totalHands: number;
  wins: number;
  losses: number;
  pushes: number;
  surrenders: number;
  blackjacks: number;
  winRate: number;
  lossRate: number;
  pushRate: number;
  blackjackRate: number;
  averageBet: number;
  totalWagered: number;
  totalProfit: number;
  /** תוחלת ליד ביחידות הימור בסיסיות. */
  evPerHandUnits: number;
  /** תוחלת ביחס לכסף שהוהמר — זהו יתרון הבית/השחקן. */
  edgeOnWagered: number;
  houseEdge: number;
  variancePerHand: number;
  sdPerHand: number;
  maxDrawdown: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  finalBankroll: number;
  peakBankroll: number;
  ruined: boolean;
  /** סיכון חורבן מחושב מהתוצאות שנמדדו בסימולציה. */
  riskOfRuin: number;
  /** דגימות הון לאורך הסימולציה (לגרף). */
  bankrollSamples: number[];
  shuffles: number;
  elapsedMs: number;
}

export interface ProgressInfo {
  completed: number;
  total: number;
  bankroll: number;
}

function randomAction(legal: PlayAction[], rnd: () => number): PlayAction {
  return legal[Math.floor(rnd() * legal.length)];
}

/** מריץ סימולציה מלאה. onProgress נקרא מדי כמה אלפי ידיים. */
export function runSimulation(config: SimConfig, onProgress?: (p: ProgressInfo) => void): SimResult {
  const started = Date.now();
  const rng = createRng(config.seed ?? Date.now() >>> 0);
  const rules = config.rules;
  const chart = buildChart(rules);
  const game = new BlackjackGame(rules, [{ id: 'user', name: 'שחקן', isUser: true, bankroll: 1e12 }], rng);

  const perRound = new RunningStats();
  const series = new SeriesTracker(config.bankroll);
  const useCount = config.strategy === 'counting' || config.strategy === 'countingDeviations';
  const useDeviations = config.strategy === 'countingDeviations';

  let bankroll = config.bankroll;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let surrenders = 0;
  let blackjacks = 0;
  let totalHands = 0;
  let totalWagered = 0;
  let ruined = false;
  const samples: number[] = [];
  const sampleEvery = Math.max(1, Math.floor(config.hands / 200));
  const progressEvery = Math.max(500, Math.floor(config.hands / 100));

  let round = 0;
  for (; round < config.hands; round++) {
    const tcBefore = trueCount(game.shoe.runningCount, game.shoe.decksRemaining);
    const bet = useCount ? betForTrueCount(tcBefore, config.spread) : config.baseBet;

    game.startRound({ user: bet });

    if (game.phase === 'insurance') {
      if (useCount && tcBefore >= INSURANCE_INDEX) {
        game.takeInsurance('user', bet / 2);
      }
      game.resolveInsurance();
    }

    let guard = 0;
    while (game.phase === 'playerTurn' && guard++ < 60) {
      const cur = game.current;
      if (!cur) break;
      const legal = game.legalActionsFor(cur.seat, cur.hand);
      if (!legal.length) break;
      const values = cur.hand.cards.map((c) => (c.rank === 'A' ? 1 : rankValue(c.rank)));
      const up = game.dealerUpCard;
      const upValue = up ? (up.rank === 'A' ? 1 : rankValue(up.rank)) : 10;

      let action: PlayAction;
      if (config.strategy === 'random') {
        action = randomAction(legal, rng);
      } else {
        action = chartAction(chart, values, upValue, {
          canDouble: legal.includes('double'),
          canSplit: legal.includes('split'),
          canSurrender: legal.includes('surrender'),
        });
        if (useDeviations) {
          const tcNow = trueCount(game.shoe.runningCount, game.shoe.decksRemaining);
          const dev = findDeviation(values, upValue);
          if (dev) {
            const devAction = actionForDeviation(dev, tcNow);
            if (legal.includes(devAction)) action = devAction;
          }
        }
        if (!legal.includes(action)) action = legal.includes('hit') ? 'hit' : 'stand';
      }
      game.act(action);
    }

    const seat = game.userSeat;
    let roundNet = seat.insuranceNet;
    let roundWagered = seat.insuranceBet;
    for (const hand of seat.hands) {
      roundNet += hand.net;
      roundWagered += hand.bet;
      totalHands++;
      switch (hand.outcome) {
        case 'blackjack':
          blackjacks++;
          wins++;
          break;
        case 'win':
          wins++;
          break;
        case 'push':
          pushes++;
          break;
        case 'surrender':
          surrenders++;
          break;
        default:
          losses++;
      }
    }

    totalWagered += roundWagered;
    bankroll += roundNet;
    perRound.push(roundNet / config.baseBet);
    series.update(roundNet);

    if (round % sampleEvery === 0) samples.push(bankroll);
    if (onProgress && round % progressEvery === 0) {
      onProgress({ completed: round, total: config.hands, bankroll });
    }
    if (config.stopOnRuin && bankroll <= 0) {
      ruined = true;
      round++;
      break;
    }
  }

  const rounds = round;
  const totalProfit = bankroll - config.bankroll;
  const evPerHandUnits = rounds ? totalProfit / config.baseBet / rounds : 0;
  const edgeOnWagered = totalWagered ? totalProfit / totalWagered : 0;
  const sdPerHand = perRound.sd;
  samples.push(bankroll);

  const result: SimResult = {
    config: {
      hands: config.hands,
      strategy: config.strategy,
      baseBet: config.baseBet,
      bankroll: config.bankroll,
      spread: config.spread,
      seed: config.seed,
      stopOnRuin: config.stopOnRuin,
      rulesSummary: `${rules.decks} חפיסות · ${rules.dealerHitsSoft17 ? 'H17' : 'S17'} · ${rules.blackjackPayout === 1.5 ? '3:2' : '6:5'}`,
    },
    totalRounds: rounds,
    totalHands,
    wins,
    losses,
    pushes,
    surrenders,
    blackjacks,
    winRate: totalHands ? wins / totalHands : 0,
    lossRate: totalHands ? losses / totalHands : 0,
    pushRate: totalHands ? pushes / totalHands : 0,
    blackjackRate: totalHands ? blackjacks / totalHands : 0,
    averageBet: rounds ? totalWagered / rounds : 0,
    totalWagered,
    totalProfit,
    evPerHandUnits,
    edgeOnWagered,
    houseEdge: -edgeOnWagered,
    variancePerHand: perRound.variance,
    sdPerHand,
    maxDrawdown: series.maxDrawdown,
    longestWinStreak: series.longestWinStreak,
    longestLoseStreak: series.longestLoseStreak,
    finalBankroll: bankroll,
    peakBankroll: series.peak,
    ruined,
    riskOfRuin: riskOfRuin({
      bankrollUnits: config.bankroll / config.baseBet,
      evPerHand: evPerHandUnits,
      sdPerHand,
    }),
    bankrollSamples: samples,
    shuffles: game.shoe.shuffleCount,
    elapsedMs: Date.now() - started,
  };
  return result;
}

/** משווה בין אסטרטגיות על אותה סדרת קלפים (אותו זרע) — השוואה הוגנת. */
export function compareStrategies(
  base: Omit<SimConfig, 'strategy'>,
  strategies: SimStrategy[],
  onProgress?: (p: ProgressInfo & { strategy: SimStrategy }) => void,
): SimResult[] {
  return strategies.map((strategy) =>
    runSimulation({ ...base, strategy }, (p) => onProgress?.({ ...p, strategy })),
  );
}

export const SIM_DISCLAIMER_HE =
  'סימולציה מתארת התנהגות ממוצעת לאורך מספר רב של ידיים. היא אינה מנבאת תוצאה של מפגש בודד, ואינה מבטיחה רווח. ככל שמספר הידיים גדול יותר, כך התוצאה מתקרבת לתוחלת המתמטית.';
