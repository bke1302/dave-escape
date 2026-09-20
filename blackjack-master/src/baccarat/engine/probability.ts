/**
 * חישוב הסתברויות מדויק לבאקרה.
 *
 * המנוע עובר על **כל** צירופי הקלפים האפשריים בסיבוב (ארבעת הקלפים הראשונים
 * וכל קלף שלישי אפשרי), משקלל כל צירוף לפי ההסתברות המדויקת להוצאתו מהנעל
 * (ללא החזרה), ומיישם את חוקי הקלף השלישי של Punto Banco.
 *
 * אין כאן מספרים שנכתבו מראש — כל התוצאות מחושבות מחוקי המשחק ומהרכב הנעל.
 */
import { bankerDraws, playerDraws } from './thirdCard.ts';
import type { BaccaratRules } from './rules.ts';

export interface BaccaratProbabilities {
  decks: number;
  /** הסתברות לניצחון השחקן. */
  player: number;
  /** הסתברות לניצחון הבנקאי. */
  banker: number;
  /** הסתברות לתיקו. */
  tie: number;
  /** הסתברות שהסיבוב יסתיים ב-Natural. */
  natural: number;
  /** הסתברות שהבנקאי ינצח עם סכום 6 (רלוונטי לחוקי "ללא עמלה"). */
  bankerWinsWithSix: number;
  /** מספר הקלפים הממוצע בסיבוב. */
  averageCards: number;
}

/** הרכב נעל לפי ערכי באקרה: אינדקס 0 = קלפי עשר, 1..9 = ערך הקלף. */
export function baccaratComposition(decks: number): number[] {
  const comp = new Array<number>(10).fill(0);
  comp[0] = 16 * decks; // 10, J, Q, K
  for (let v = 1; v <= 9; v++) comp[v] = 4 * decks;
  return comp;
}

const cache = new Map<number, BaccaratProbabilities>();

/** מחשב (ומטמיע במטמון) את ההסתברויות המדויקות עבור מספר חפיסות נתון. */
export function exactProbabilities(decks: number): BaccaratProbabilities {
  const cached = cache.get(decks);
  if (cached) return cached;

  const comp = baccaratComposition(decks);
  let remaining = comp.reduce((a, b) => a + b, 0);

  let pPlayer = 0;
  let pBanker = 0;
  let pTie = 0;
  let pNatural = 0;
  let pBankerSix = 0;
  let cardsWeighted = 0;

  const record = (weight: number, playerTotal: number, bankerTotal: number, cards: number, natural: boolean): void => {
    if (playerTotal > bankerTotal) pPlayer += weight;
    else if (bankerTotal > playerTotal) {
      pBanker += weight;
      if (bankerTotal === 6) pBankerSix += weight;
    } else pTie += weight;
    if (natural) pNatural += weight;
    cardsWeighted += weight * cards;
  };

  for (let p1 = 0; p1 <= 9; p1++) {
    if (comp[p1] === 0) continue;
    const w1 = comp[p1] / remaining;
    comp[p1]--;
    remaining--;

    for (let b1 = 0; b1 <= 9; b1++) {
      if (comp[b1] === 0) continue;
      const w2 = w1 * (comp[b1] / remaining);
      comp[b1]--;
      remaining--;

      for (let p2 = 0; p2 <= 9; p2++) {
        if (comp[p2] === 0) continue;
        const w3 = w2 * (comp[p2] / remaining);
        comp[p2]--;
        remaining--;

        for (let b2 = 0; b2 <= 9; b2++) {
          if (comp[b2] === 0) continue;
          const w4 = w3 * (comp[b2] / remaining);
          comp[b2]--;
          remaining--;

          const playerTwo = (p1 + p2) % 10;
          const bankerTwo = (b1 + b2) % 10;
          const natural = playerTwo >= 8 || bankerTwo >= 8;

          if (natural) {
            record(w4, playerTwo, bankerTwo, 4, true);
          } else if (playerDraws(playerTwo)) {
            for (let p3 = 0; p3 <= 9; p3++) {
              if (comp[p3] === 0) continue;
              const w5 = w4 * (comp[p3] / remaining);
              comp[p3]--;
              remaining--;

              const playerThree = (playerTwo + p3) % 10;
              if (bankerDraws(bankerTwo, p3)) {
                for (let b3 = 0; b3 <= 9; b3++) {
                  if (comp[b3] === 0) continue;
                  const w6 = w5 * (comp[b3] / remaining);
                  record(w6, playerThree, (bankerTwo + b3) % 10, 6, false);
                }
              } else {
                record(w5, playerThree, bankerTwo, 5, false);
              }

              comp[p3]++;
              remaining++;
            }
          } else if (bankerDraws(bankerTwo, null)) {
            for (let b3 = 0; b3 <= 9; b3++) {
              if (comp[b3] === 0) continue;
              const w5 = w4 * (comp[b3] / remaining);
              record(w5, playerTwo, (bankerTwo + b3) % 10, 5, false);
            }
          } else {
            record(w4, playerTwo, bankerTwo, 4, false);
          }

          comp[b2]++;
          remaining++;
        }
        comp[p2]++;
        remaining++;
      }
      comp[b1]++;
      remaining++;
    }
    comp[p1]++;
    remaining++;
  }

  const result: BaccaratProbabilities = {
    decks,
    player: pPlayer,
    banker: pBanker,
    tie: pTie,
    natural: pNatural,
    bankerWinsWithSix: pBankerSix,
    averageCards: cardsWeighted,
  };
  cache.set(decks, result);
  return result;
}

export interface BetMath {
  bet: 'player' | 'banker' | 'tie';
  label: string;
  probability: number;
  payout: string;
  /** תוחלת ליחידת הימור, כולל תיקו כהחזר. */
  expectedValue: number;
  /** יתרון הבית ביחס לכל ההימורים (תיקו נספר כהימור). */
  houseEdge: number;
  /** יתרון הבית ביחס להימורים שהוכרעו בלבד (ללא תיקו). */
  houseEdgeResolved: number;
  /** סטיית תקן ליד. */
  standardDeviation: number;
}

/** מחשב את המתמטיקה של כל סוגי ההימורים לפי החוקים שנבחרו. */
export function betMath(rules: BaccaratRules): BetMath[] {
  const p = exactProbabilities(rules.decks);
  const results: BetMath[] = [];

  // הימור שחקן
  {
    const ev = p.player * 1 + p.banker * -1;
    results.push({
      bet: 'player',
      label: 'שחקן (Player)',
      probability: p.player,
      payout: '1:1',
      expectedValue: ev,
      houseEdge: -ev,
      houseEdgeResolved: -ev / (1 - p.tie),
      standardDeviation: Math.sqrt(p.player * 1 + p.banker * 1 - ev * ev),
    });
  }

  // הימור בנקאי
  {
    const commission = rules.commissionMode === 'commission';
    const winFull = commission ? 1 - rules.commissionRate : 1;
    const sixPayout = commission ? winFull : rules.bankerSixPayout;
    const pSix = p.bankerWinsWithSix;
    const pOther = p.banker - pSix;
    const ev = pOther * winFull + pSix * sixPayout - p.player;
    const secondMoment = pOther * winFull * winFull + pSix * sixPayout * sixPayout + p.player;
    results.push({
      bet: 'banker',
      label: 'בנקאי (Banker)',
      probability: p.banker,
      payout: commission
        ? `1:1 פחות ${(rules.commissionRate * 100).toFixed(0)}% עמלה`
        : rules.bankerSixPayout === 0.5
          ? '1:1 · ניצחון עם 6 משלם 1:2'
          : '1:1 ללא עמלה',
      expectedValue: ev,
      houseEdge: -ev,
      houseEdgeResolved: -ev / (1 - p.tie),
      standardDeviation: Math.sqrt(secondMoment - ev * ev),
    });
  }

  // הימור תיקו
  {
    const ev = p.tie * rules.tiePayout - (1 - p.tie);
    const secondMoment = p.tie * rules.tiePayout * rules.tiePayout + (1 - p.tie);
    results.push({
      bet: 'tie',
      label: 'תיקו (Tie)',
      probability: p.tie,
      payout: `${rules.tiePayout}:1`,
      expectedValue: ev,
      houseEdge: -ev,
      houseEdgeResolved: -ev,
      standardDeviation: Math.sqrt(secondMoment - ev * ev),
    });
  }

  return results;
}

/** ההימור בעל יתרון הבית הנמוך ביותר לפי החוקים שנבחרו. */
export function bestBet(rules: BaccaratRules): BetMath {
  return betMath(rules).slice().sort((a, b) => a.houseEdge - b.houseEdge)[0];
}
