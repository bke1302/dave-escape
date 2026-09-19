/** קלפים, ערכים וספירת Hi-Lo. */
export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUIT_SYMBOL = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
};
export const SUIT_NAME_HE = {
    spades: 'עלה',
    hearts: 'לב אדום',
    diamonds: 'יהלום',
    clubs: 'תלתן',
};
/** האם הסדרה אדומה (לצביעה ב-UI). */
export function isRed(suit) {
    return suit === 'hearts' || suit === 'diamonds';
}
/** ערך הקלף בבלאק ג'ק. אס נספר כ-11 ומוקטן ל-1 בעת הצורך (ראה handValue). */
export function rankValue(rank) {
    if (rank === 'A')
        return 11;
    if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10')
        return 10;
    return Number(rank);
}
export function cardValue(card) {
    return rankValue(card.rank);
}
/** ערך ספירת Hi-Lo: 2-6 = +1, 7-9 = 0, 10/J/Q/K/A = -1. */
export function hiLoValue(rank) {
    if (rank === 'A' || rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10')
        return -1;
    const n = Number(rank);
    if (n >= 2 && n <= 6)
        return 1;
    return 0;
}
export function hiLoValueOfCard(card) {
    return hiLoValue(card.rank);
}
/** בונה חפיסה אחת (52 קלפים) לא מעורבבת. */
export function buildDeck(deckIndex = 0) {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ rank, suit, id: `${deckIndex}-${suit}-${rank}` });
        }
    }
    return deck;
}
/** בונה נעל (shoe) עם מספר חפיסות. */
export function buildShoeCards(decks) {
    const cards = [];
    for (let d = 0; d < decks; d++)
        cards.push(...buildDeck(d));
    return cards;
}
/** שם הקלף בעברית, למשל "מלך עלה". */
export const RANK_NAME_HE = {
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
export function cardNameHe(card) {
    return `${RANK_NAME_HE[card.rank]} ${SUIT_NAME_HE[card.suit]}`;
}
//# sourceMappingURL=cards.js.map