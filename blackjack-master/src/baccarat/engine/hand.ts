/** ערכי קלפים וחישוב יד בבאקרה — חוק ה-Modulo 10. */
import type { Card, Rank } from '../../engine/cards.ts';

/**
 * ערך קלף בבאקרה:
 * אס = 1 · 2-9 = הערך המספרי · 10/J/Q/K = 0
 */
export function baccaratRankValue(rank: Rank): number {
  if (rank === 'A') return 1;
  if (rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K') return 0;
  return Number(rank);
}

export function baccaratCardValue(card: Card): number {
  return baccaratRankValue(card.rank);
}

/**
 * סכום היד לפי Modulo 10 — רק ספרת האחדות נספרת.
 * דוגמה: 7 + 8 = 15 → 5
 */
export function handTotalFromValues(values: readonly number[]): number {
  let sum = 0;
  for (const v of values) sum += v;
  return sum % 10;
}

export function handTotal(cards: readonly Card[]): number {
  return handTotalFromValues(cards.map(baccaratCardValue));
}

/** יד טבעית (Natural): 8 או 9 בשני הקלפים הראשונים. */
export function isNatural(cards: readonly Card[]): boolean {
  if (cards.length !== 2) return false;
  const total = handTotal(cards);
  return total === 8 || total === 9;
}

export function isNaturalTotal(total: number, cardCount: number): boolean {
  return cardCount === 2 && (total === 8 || total === 9);
}

/** הסבר מילולי של חישוב היד, לשימוש בשיעורים ובתרגילים. */
export function explainTotalHe(values: readonly number[]): string {
  const sum = values.reduce((a, b) => a + b, 0);
  const total = sum % 10;
  if (sum < 10) return `${values.join(' + ')} = ${sum} · היד שווה ${total}`;
  return `${values.join(' + ')} = ${sum} · מורידים את העשרות → היד שווה ${total}`;
}
