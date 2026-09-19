/**
 * מנוע EV (תוחלת רווח) קומבינטורי.
 *
 * מחשב את התוחלת של כל פעולה (עמידה / לקיחה / הכפלה / פיצול / כניעה) מתוך
 * הרכב הנעל בפועל ומתוך חוקי השולחן — ולא מתוך טבלאות "קסם".
 *
 * הנחות מפורשות (מוצגות גם למשתמש במסכי האסטרטגיה):
 *  1. התפלגות הקלפים נלקחת מהרכב הנעל לאחר הסרת הקלפים הידועים (ידי השחקן
 *     והקלף החשוף של הדילר), ומוחזקת קבועה לאורך העץ (דגימה עם החזרה).
 *     זהו הקירוב הסטנדרטי לחישוב אסטרטגיה בסיסית תלוית־סכום (total dependent).
 *     בנעל של 4 חפיסות ומעלה הסטייה זניחה.
 *  2. בשולחן שבו הדילר מציץ (peek), החישוב מותנה בכך שלדילר אין בלאק ג'ק.
 *  3. תוחלת הפיצול מחושבת כפעמיים תוחלת יד בודדת לאחר הפיצול, ללא פיצול חוזר
 *     (קירוב שמרני מעט — מוצג למשתמש כהנחה).
 */
import { doubleAllowedForTotal, type Rules } from './rules.ts';

export type PlayAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

export interface ActionEv {
  action: PlayAction;
  ev: number;
}

export interface DecisionOptions {
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
}

/** התפלגות תוצאות הדילר: [17, 18, 19, 20, 21, נפסל]. */
export type DealerDist = number[];

const DEALER_BUST = 5;

/** הרכב נעל מלאה: אינדקס 1..10 (1 = אס, 10 = כל קלפי העשר). */
export function fullShoeComposition(decks: number): number[] {
  const comp = new Array<number>(11).fill(0);
  for (let v = 1; v <= 9; v++) comp[v] = 4 * decks;
  comp[10] = 16 * decks;
  return comp;
}

export function removeCards(comp: number[], values: readonly number[]): number[] {
  const next = comp.slice();
  for (const v of values) next[v] = Math.max(0, next[v] - 1);
  return next;
}

interface Total {
  total: number;
  soft: boolean;
}

function addCard(state: Total, value: number): Total {
  let total: number;
  let soft: boolean;
  if (value === 1) {
    if (state.soft) {
      // כבר קיים אס שנספר כ-11 — האס החדש חייב להיספר כ-1, והיד נשארת רכה.
      total = state.total + 1;
      soft = true;
    } else {
      total = state.total + 11;
      soft = true;
      if (total > 21) {
        total -= 10;
        soft = false;
      }
    }
  } else {
    total = state.total + value;
    soft = state.soft;
    if (total > 21 && soft) {
      total -= 10;
      soft = false;
    }
  }
  return { total, soft };
}

export class EvSolver {
  private p: number[] = new Array<number>(11).fill(0);
  private rules: Rules;
  private dealerCache = new Map<number, DealerDist>();
  private hitCache = new Map<string, number>();

  constructor(comp: number[], rules: Rules) {
    this.rules = rules;
    let total = 0;
    for (let v = 1; v <= 10; v++) total += comp[v];
    if (total <= 0) throw new Error('הרכב נעל ריק');
    for (let v = 1; v <= 10; v++) this.p[v] = comp[v] / total;
  }

  /** הסתברות לשליפת ערך קלף נתון. */
  prob(value: number): number {
    return this.p[value];
  }

  /** התפלגות סופי הדילר מול קלף חשוף נתון. */
  dealerDist(up: number): DealerDist {
    const cached = this.dealerCache.get(up);
    if (cached) return cached;

    const dist: DealerDist = [0, 0, 0, 0, 0, 0];
    // התניה על "לדילר אין בלאק ג'ק" בשולחן שבו הדילר מציץ.
    const excludeValue = this.rules.dealerPeeks ? (up === 1 ? 10 : up === 10 ? 1 : 0) : 0;
    let norm = 1;
    if (excludeValue > 0) norm = 1 - this.p[excludeValue];

    const start: Total = { total: up === 1 ? 11 : up, soft: up === 1 };
    for (let hole = 1; hole <= 10; hole++) {
      if (hole === excludeValue) continue;
      const weight = this.p[hole] / (norm > 0 ? norm : 1);
      if (weight <= 0) continue;
      const after = addCard(start, hole);
      const sub = this.dealerRec(after);
      for (let i = 0; i < 6; i++) dist[i] += weight * sub[i];
    }
    this.dealerCache.set(up, dist);
    return dist;
  }

  private dealerRecCache = new Map<number, DealerDist>();

  private dealerRec(state: Total): DealerDist {
    const key = state.total * 2 + (state.soft ? 1 : 0);
    const cached = this.dealerRecCache.get(key);
    if (cached) return cached;

    const dist: DealerDist = [0, 0, 0, 0, 0, 0];
    if (state.total > 21) {
      dist[DEALER_BUST] = 1;
    } else if (state.total >= 18 || (state.total === 17 && !(state.soft && this.rules.dealerHitsSoft17))) {
      dist[state.total - 17] = 1;
    } else {
      for (let v = 1; v <= 10; v++) {
        const weight = this.p[v];
        if (weight <= 0) continue;
        const sub = this.dealerRec(addCard(state, v));
        for (let i = 0; i < 6; i++) dist[i] += weight * sub[i];
      }
    }
    this.dealerRecCache.set(key, dist);
    return dist;
  }

  /** תוחלת עמידה עם סכום נתון מול קלף חשוף נתון (ביחידות של ההימור). */
  standEV(total: number, up: number): number {
    if (total > 21) return -1;
    const dist = this.dealerDist(up);
    let ev = dist[DEALER_BUST]; // הדילר נפסל — ניצחון
    for (let i = 0; i < 5; i++) {
      const dealerTotal = 17 + i;
      if (total > dealerTotal) ev += dist[i];
      else if (total < dealerTotal) ev -= dist[i];
    }
    return ev;
  }

  /** תוחלת לקיחת קלף (ולאחריה משחק אופטימלי). */
  hitEV(total: number, soft: boolean, up: number): number {
    if (total > 21) return -1;
    const key = `${total}|${soft ? 1 : 0}|${up}`;
    const cached = this.hitCache.get(key);
    if (cached !== undefined) return cached;

    let ev = 0;
    for (let v = 1; v <= 10; v++) {
      const weight = this.p[v];
      if (weight <= 0) continue;
      const next = addCard({ total, soft }, v);
      if (next.total > 21) ev += weight * -1;
      else ev += weight * Math.max(this.standEV(next.total, up), this.hitEV(next.total, next.soft, up));
    }
    this.hitCache.set(key, ev);
    return ev;
  }

  /** תוחלת הכפלה: קלף אחד בלבד, הימור כפול. */
  doubleEV(total: number, soft: boolean, up: number): number {
    let ev = 0;
    for (let v = 1; v <= 10; v++) {
      const weight = this.p[v];
      if (weight <= 0) continue;
      const next = addCard({ total, soft }, v);
      ev += weight * 2 * (next.total > 21 ? -1 : this.standEV(next.total, up));
    }
    return ev;
  }

  /** תוחלת יד בודדת לאחר פיצול (קלף אחד נוסף ואז משחק אופטימלי). */
  private postSplitHandEV(pairValue: number, up: number): number {
    const aces = pairValue === 1;
    let ev = 0;
    for (let v = 1; v <= 10; v++) {
      const weight = this.p[v];
      if (weight <= 0) continue;
      const start: Total = { total: aces ? 11 : pairValue, soft: aces };
      const next = addCard(start, v);
      if (aces && !this.rules.hitSplitAces) {
        ev += weight * this.standEV(next.total, up);
        continue;
      }
      let best = this.standEV(next.total, up);
      const hit = this.hitEV(next.total, next.soft, up);
      if (hit > best) best = hit;
      if (this.rules.doubleAfterSplit && doubleAllowedForTotal(this.rules, next.total, next.soft)) {
        const dbl = this.doubleEV(next.total, next.soft, up);
        if (dbl > best) best = dbl;
      }
      ev += weight * best;
    }
    return ev;
  }

  /** תוחלת פיצול (שתי ידיים). */
  splitEV(pairValue: number, up: number): number {
    return 2 * this.postSplitHandEV(pairValue, up);
  }

  /** תוחלת כל הפעולות האפשריות, ממוינת מהטובה לפחות טובה. */
  evaluate(values: readonly number[], up: number, opts: DecisionOptions): ActionEv[] {
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

    const list: ActionEv[] = [
      { action: 'stand', ev: this.standEV(total, up) },
      { action: 'hit', ev: this.hitEV(total, soft, up) },
    ];
    if (opts.canDouble && doubleAllowedForTotal(this.rules, total, soft)) {
      list.push({ action: 'double', ev: this.doubleEV(total, soft, up) });
    }
    if (opts.canSplit && values.length === 2 && values[0] === values[1]) {
      list.push({ action: 'split', ev: this.splitEV(values[0], up) });
    }
    if (opts.canSurrender && this.rules.surrender !== 'none') {
      list.push({ action: 'surrender', ev: -0.5 });
    }
    list.sort((a, b) => b.ev - a.ev);
    return list;
  }

  /** הפעולה בעלת התוחלת הגבוהה ביותר. */
  bestAction(values: readonly number[], up: number, opts: DecisionOptions): PlayAction {
    return this.evaluate(values, up, opts)[0].action;
  }
}

/**
 * תוחלת מדויקת של סיבוב שלם ביחידת הימור אחת, בהנחת משחק לפי אסטרטגיה בסיסית
 * (ללא ביטוח). מכאן נגזר יתרון הקזינו (House Edge) עבור סט חוקים נתון.
 *
 * החישוב עובר על כל צירופי שני קלפי השחקן והקלף החשוף של הדילר, משקלל לפי
 * ההסתברות המדויקת להוצאתם מהנעל, ומטפל בנפרד בבלאק ג'ק של השחקן ושל הדילר.
 */
export function roundExpectedValue(comp: number[], rules: Rules): number {
  let totalCards = 0;
  for (let v = 1; v <= 10; v++) totalCards += comp[v];

  let ev = 0;
  let weightSum = 0;

  for (let c1 = 1; c1 <= 10; c1++) {
    if (comp[c1] <= 0) continue;
    for (let c2 = c1; c2 <= 10; c2++) {
      const sameCard = c1 === c2;
      if (comp[c2] - (sameCard ? 1 : 0) <= 0) continue;
      for (let up = 1; up <= 10; up++) {
        const usedSame = (up === c1 ? 1 : 0) + (up === c2 ? 1 : 0);
        if (comp[up] - usedSame <= 0) continue;

        // הסתברות לקבלת הצירוף (ללא החזרה), כולל שתי סדרות אפשריות לקלפי השחקן.
        const pC1 = comp[c1] / totalCards;
        const pC2 = (comp[c2] - (sameCard ? 1 : 0)) / (totalCards - 1);
        const pUp = (comp[up] - usedSame) / (totalCards - 2);
        const weight = pC1 * pC2 * pUp * (sameCard ? 1 : 2);
        if (weight <= 0) continue;

        const afterKnown = removeCards(comp, [c1, c2, up]);
        const solver = new EvSolver(afterKnown, rules);

        // הסתברות שלדילר יש בלאק ג'ק בהינתן הקלף החשוף.
        let pDealerBj = 0;
        if (up === 1) pDealerBj = afterKnown[10] / (totalCards - 3);
        else if (up === 10) pDealerBj = afterKnown[1] / (totalCards - 3);

        const playerTotal = c1 === 1 || c2 === 1 ? c1 + c2 + 10 : c1 + c2;
        const playerBj = playerTotal === 21;

        let cellEv: number;
        if (playerBj) {
          cellEv = pDealerBj * 0 + (1 - pDealerBj) * rules.blackjackPayout;
        } else {
          const best = solver.evaluate([c1, c2], up, {
            canDouble: true,
            canSplit: c1 === c2,
            canSurrender: rules.surrender !== 'none',
          })[0].ev;
          cellEv = pDealerBj * -1 + (1 - pDealerBj) * best;
        }
        ev += weight * cellEv;
        weightSum += weight;
      }
    }
  }
  return ev / weightSum;
}
