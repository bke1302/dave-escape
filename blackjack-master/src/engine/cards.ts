/** קלפים, ערכים וספירת Hi-Lo. */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
  /** מזהה ייחודי בתוך הנעל (shoe) — משמש כמפתח לאנימציות UI. */
  readonly id: string;
}

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: readonly Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_NAME_HE: Record<Suit, string> = {
  spades: 'עלה',
  hearts: 'לב אדום',
  diamonds: 'יהלום',
  clubs: 'תלתן',
};

/** האם הסדרה אדומה (לצביעה ב-UI). */
export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

/** ערך הקלף בבלאק ג'ק. אס נספר כ-11 ומוקטן ל-1 בעת הצורך (ראה handValue). */
export function rankValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return 10;
  return Number(rank);
}

export function cardValue(card: Card): number {
  return rankValue(card.rank);
}

/** ערך ספירת Hi-Lo: 2-6 = +1, 7-9 = 0, 10/J/Q/K/A = -1. */
export function hiLoValue(rank: Rank): number {
  if (rank === 'A' || rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return -1;
  const n = Number(rank);
  if (n >= 2 && n <= 6) return 1;
  return 0;
}

export function hiLoValueOfCard(card: Card): number {
  return hiLoValue(card.rank);
}

/** בונה חפיסה אחת (52 קלפים) לא מעורבבת. */
export function buildDeck(deckIndex: number = 0): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, id: `${deckIndex}-${suit}-${rank}` });
    }
  }
  return deck;
}

/** בונה נעל (shoe) עם מספר חפיסות. */
export function buildShoeCards(decks: number): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d++) cards.push(...buildDeck(d));
  return cards;
}

/** שם הקלף בעברית, למשל "מלך עלה". */
export const RANK_NAME_HE: Record<Rank, string> = {
  A: 'אס',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'נסיך',
  Q: 'מלכה',
  K: 'מלך',
};

export function cardNameHe(card: Card): string {
  return `${RANK_NAME_HE[card.rank]} ${SUIT_NAME_HE[card.suit]}`;
}
