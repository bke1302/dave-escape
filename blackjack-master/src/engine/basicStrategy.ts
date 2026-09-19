/**
 * אסטרטגיה בסיסית (Basic Strategy).
 *
 * הטבלאות אינן "קשיחות" — הן מחושבות על ידי מנוע ה-EV מתוך חוקי השולחן שנבחרו
 * (מספר חפיסות, H17/S17, DAS, חוקי הכפלה, כניעה). כך הטבלה תמיד עקבית עם החוקים.
 * הטבלאות שנוצרות עבור 4-8 חפיסות זהות לטבלאות האסטרטגיה הבסיסית המקובלות.
 */
import { rankValue, type Card } from './cards.ts';
import { handValue } from './hand.ts';
import { doubleAllowedForTotal, type Rules } from './rules.ts';
import { EvSolver, fullShoeComposition, removeCards, type ActionEv, type PlayAction } from './evEngine.ts';

export type { PlayAction } from './evEngine.ts';

/** קוד תא בטבלה: H=קח, S=עמוד, D=הכפל אחרת קח, Ds=הכפל אחרת עמוד,
 *  P=פצל, R=כנע אחרת קח, Rs=כנע אחרת עמוד, Rp=כנע אחרת פצל. */
export type CellCode = 'H' | 'S' | 'D' | 'Ds' | 'P' | 'R' | 'Rs' | 'Rp';

export const CELL_LABEL_HE: Record<CellCode, string> = {
  H: 'קח',
  S: 'עמוד',
  D: 'הכפל',
  Ds: 'הכפל/עמוד',
  P: 'פצל',
  R: 'כנע',
  Rs: 'כנע/עמוד',
  Rp: 'כנע/פצל',
};

export const ACTION_LABEL_HE: Record<PlayAction, string> = {
  hit: 'פגע',
  stand: 'עמוד',
  double: 'הכפל',
  split: 'פצל',
  surrender: 'כניעה',
};

/** קלפי הדילר לפי סדר הטבלה: 2..10, A (A מיוצג כערך 1). */
export const DEALER_UPS: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 1];

export interface StrategyChart {
  /** סכומים קשים 5..21 → שורה של 10 תאים. */
  hard: Record<number, CellCode[]>;
  /** ידיים רכות A,2 .. A,9 (מפתח = הקלף השני) → שורה של 10 תאים. */
  soft: Record<number, CellCode[]>;
  /** זוגות: מפתח = ערך הקלף (1 = אסים, 10 = קלפי עשר). */
  pairs: Record<number, CellCode[]>;
  rulesKey: string;
}

export interface Decision {
  action: PlayAction;
  /** התוחלות של כל הפעולות החוקיות, ממוינות. */
  evs: ActionEv[];
  /** הסבר קצר בעברית. */
  explanation: string;
}

export interface HandOptions {
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
}

export function rulesKey(rules: Rules): string {
  return [
    rules.decks,
    rules.dealerHitsSoft17 ? 'h17' : 's17',
    rules.doubleAfterSplit ? 'das' : 'nodas',
    rules.doubleRule,
    rules.surrender,
    rules.maxSplitHands,
    rules.hitSplitAces ? 'hsa' : 'nhsa',
    rules.dealerPeeks ? 'peek' : 'nopeek',
  ].join('_');
}

function solverFor(rules: Rules, known: number[]): EvSolver {
  return new EvSolver(removeCards(fullShoeComposition(rules.decks), known), rules);
}

/** מחשב את הפעולה המומלצת ליד נתונה (לפי ערכי קלפים 1..10). */
export function decideByValues(
  values: readonly number[],
  dealerUp: number,
  rules: Rules,
  opts: HandOptions,
): Decision {
  const solver = solverFor(rules, [...values, dealerUp]);
  const evs = solver.evaluate(values, dealerUp, opts);
  const action = evs[0].action;
  return { action, evs, explanation: explain(values, dealerUp, evs, rules) };
}

/** מחשב את הפעולה המומלצת ליד של קלפים אמיתיים. */
export function decide(cards: readonly Card[], dealerUp: Card, rules: Rules, opts: HandOptions): Decision {
  const values = cards.map((c) => (c.rank === 'A' ? 1 : rankValue(c.rank)));
  const up = dealerUp.rank === 'A' ? 1 : rankValue(dealerUp.rank);
  return decideByValues(values, up, rules, opts);
}

function upLabel(up: number): string {
  return up === 1 ? 'אס' : String(up);
}

function explain(values: readonly number[], up: number, evs: ActionEv[], rules: Rules): string {
  const hv = handValue(
    values.map((v) => ({ rank: (v === 1 ? 'A' : String(v)) as never, suit: 'spades' as const, id: 'x' })),
  );
  const best = evs[0];
  const second = evs[1];
  const gap = second ? best.ev - second.ev : 0;
  const totalText = hv.soft ? `יד רכה ${hv.total}` : `${hv.total}`;
  const pair = values.length === 2 && values[0] === values[1];
  const head = pair ? `זוג ${values[0] === 1 ? 'אסים' : values[0]}` : totalText;
  const bestText = ACTION_LABEL_HE[best.action];

  const reasons: string[] = [];
  if (best.action === 'stand' && up >= 2 && up <= 6) {
    reasons.push('הדילר עם קלף חלש (2-6) ונפסל לעיתים קרובות — לא כדאי לקחת סיכון');
  } else if (best.action === 'hit' && (up >= 7 || up === 1)) {
    reasons.push('הדילר עם קלף חזק (7 ומעלה) וצפוי לסיים ב-17 ומעלה — יד חלשה תפסיד בעמידה');
  } else if (best.action === 'double') {
    reasons.push('יתרון מובהק בקלף אחד נוסף — שווה להכפיל את ההימור');
  } else if (best.action === 'split') {
    reasons.push('פיצול יוצר שתי ידיים בעלות תוחלת טובה יותר מהיד המשולבת');
  } else if (best.action === 'surrender') {
    reasons.push('היד מפסידה יותר ממחצית מההימור בממוצע — כניעה חוסכת כסף');
  }
  if (rules.dealerHitsSoft17 && (up === 1 || up === 6)) {
    reasons.push('הדילר לוקח ב-17 רכה (H17), מה שמשנה מעט את ההחלטה');
  }
  const evText = `תוחלת: ${bestText} ${fmtEv(best.ev)}${second ? ` · ${ACTION_LABEL_HE[second.action]} ${fmtEv(second.ev)}` : ''}`;
  const closeness = gap < 0.02 ? ' (הפרש קטן — החלטה גבולית)' : '';
  return `${head} מול ${upLabel(up)}: ${bestText}. ${reasons.join('. ')}${closeness}. ${evText}`;
}

export function fmtEv(ev: number): string {
  const sign = ev > 0 ? '+' : '';
  return `${sign}${(ev * 100).toFixed(1)}%`;
}

function codeFor(values: number[], up: number, rules: Rules, opts: HandOptions): CellCode {
  const solver = solverFor(rules, [...values, up]);
  const evs = solver.evaluate(values, up, opts);
  const best = evs[0];
  if (best.action === 'hit') return 'H';
  if (best.action === 'stand') return 'S';
  if (best.action === 'split') return 'P';
  if (best.action === 'double') {
    const fallback = evs.find((e) => e.action === 'hit' || e.action === 'stand');
    return fallback && fallback.action === 'stand' ? 'Ds' : 'D';
  }
  // כניעה — יש לציין מה עושים כשהכניעה אינה זמינה
  const fallback = evs.filter((e) => e.action !== 'surrender')[0];
  if (fallback.action === 'stand') return 'Rs';
  if (fallback.action === 'split') return 'Rp';
  return 'R';
}

const chartCache = new Map<string, StrategyChart>();

/** בונה (ומטמיע במטמון) את טבלת האסטרטגיה המלאה עבור סט חוקים. */
export function buildChart(rules: Rules): StrategyChart {
  const key = rulesKey(rules);
  const cached = chartCache.get(key);
  if (cached) return cached;

  const hard: Record<number, CellCode[]> = {};
  for (let total = 5; total <= 21; total++) {
    const values = total <= 11 ? [2, total - 2] : [10, total - 10];
    hard[total] = DEALER_UPS.map((up) =>
      codeFor(values, up, rules, {
        canDouble: doubleAllowedForTotal(rules, total, false),
        canSplit: false,
        canSurrender: rules.surrender !== 'none' && total >= 5,
      }),
    );
  }

  const soft: Record<number, CellCode[]> = {};
  for (let second = 2; second <= 9; second++) {
    soft[second] = DEALER_UPS.map((up) =>
      codeFor([1, second], up, rules, {
        canDouble: doubleAllowedForTotal(rules, 11 + second, true),
        canSplit: false,
        canSurrender: rules.surrender !== 'none',
      }),
    );
  }

  const pairs: Record<number, CellCode[]> = {};
  for (let v = 1; v <= 10; v++) {
    pairs[v] = DEALER_UPS.map((up) =>
      codeFor([v, v], up, rules, {
        canDouble: true,
        canSplit: true,
        canSurrender: rules.surrender !== 'none',
      }),
    );
  }

  const chart: StrategyChart = { hard, soft, pairs, rulesKey: key };
  chartCache.set(key, chart);
  return chart;
}

/** ממיר קוד תא לפעולה בפועל, בהתאם למה שמותר ביד הנוכחית. */
export function resolveCell(code: CellCode, opts: HandOptions): PlayAction {
  switch (code) {
    case 'H':
      return 'hit';
    case 'S':
      return 'stand';
    case 'P':
      return opts.canSplit ? 'split' : 'hit';
    case 'D':
      return opts.canDouble ? 'double' : 'hit';
    case 'Ds':
      return opts.canDouble ? 'double' : 'stand';
    case 'R':
      return opts.canSurrender ? 'surrender' : 'hit';
    case 'Rs':
      return opts.canSurrender ? 'surrender' : 'stand';
    case 'Rp':
      return opts.canSurrender ? 'surrender' : opts.canSplit ? 'split' : 'hit';
  }
}

/** חיפוש מהיר בטבלה — מהיר בהרבה מחישוב EV, לשימוש בסימולציות. */
export function chartAction(
  chart: StrategyChart,
  values: readonly number[],
  dealerUp: number,
  opts: HandOptions,
): PlayAction {
  const upIndex = DEALER_UPS.indexOf(dealerUp);
  const isPair = values.length === 2 && values[0] === values[1];
  if (isPair && opts.canSplit) {
    return resolveCell(chart.pairs[values[0]][upIndex], opts);
  }
  let total = 0;
  let aces = 0;
  for (const v of values) {
    if (v === 1) {
      aces++;
      total += 11;
    } else total += v;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  const soft = aces > 0 && total <= 21;
  if (soft && values.length === 2) {
    const other = values[0] === 1 ? values[1] : values[0];
    if (other >= 2 && other <= 9) return resolveCell(chart.soft[other][upIndex], opts);
  }
  if (soft) {
    // יד רכה מרובת קלפים: אם הסכום 18 ומטה — לקיחה בטוחה, אחרת עמידה.
    if (total >= 19) return 'stand';
    if (total === 18) return dealerUp >= 9 || dealerUp === 1 ? 'hit' : 'stand';
    return 'hit';
  }
  if (total >= 21) return 'stand';
  const row = chart.hard[Math.max(5, total)];
  return resolveCell(row[upIndex], opts);
}
