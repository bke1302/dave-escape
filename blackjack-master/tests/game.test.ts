import test from 'node:test';
import assert from 'node:assert/strict';
import type { Card, Rank, Suit } from '../src/engine/cards.ts';
import { BlackjackGame } from '../src/engine/game.ts';
import { DEFAULT_RULES, type Rules } from '../src/engine/rules.ts';
import { createRng } from '../src/engine/rng.ts';
import { handValue } from '../src/engine/hand.ts';

function card(rank: Rank, suit: Suit = 'spades'): Card {
  return { rank, suit, id: `${rank}-${suit}-${Math.random()}` };
}

/** מנוע עם נעל מבוימת — מאפשר בדיקת תרחישים מדויקים. */
function stackedGame(sequence: Rank[], rules: Partial<Rules> = {}): BlackjackGame {
  const game = new BlackjackGame({ ...DEFAULT_RULES, ...rules }, [{ id: 'user', name: 'אתה', isUser: true, bankroll: 1000 }]);
  let index = 0;
  const cards = sequence.map((r) => card(r));
  // החלפת שליפת הקלפים בסדר קבוע
  game.shoe.draw = () => {
    const c = cards[index++] ?? card('5');
    return c;
  };
  return game;
}

test('חלוקה ראשונית: שני קלפים לשחקן ושניים לדילר', () => {
  const game = stackedGame(['10', '9', '7', '6', '5']);
  game.startRound({ user: 100 });
  assert.equal(game.userSeat.hands[0].cards.length, 2);
  assert.equal(game.dealerCards.length, 2);
});

test('בלאק ג׳ק משולם 3:2', () => {
  const game = stackedGame(['A', '9', 'K', '7', '8']);
  game.startRound({ user: 100 });
  assert.equal(game.phase, 'roundOver');
  assert.equal(game.userSeat.hands[0].outcome, 'blackjack');
  assert.equal(game.userNet, 150);
});

test('בלאק ג׳ק משולם 6:5 כשהחוק כך', () => {
  const game = stackedGame(['A', '9', 'K', '7', '8'], { blackjackPayout: 1.2 });
  game.startRound({ user: 100 });
  assert.equal(game.userNet, 120);
});

test('בלאק ג׳ק כפול = תיקו', () => {
  const game = stackedGame(['A', 'A', 'K', 'K']);
  game.startRound({ user: 100 });
  assert.equal(game.phase, 'insurance', 'קלף חשוף אס פותח שלב ביטוח');
  game.resolveInsurance();
  assert.equal(game.userSeat.hands[0].outcome, 'push');
  assert.equal(game.userNet, 0);
});

test('בלאק ג׳ק לדילר מנצח יד רגילה', () => {
  const game = stackedGame(['10', 'A', '9', 'K']);
  game.startRound({ user: 100 });
  game.resolveInsurance();
  assert.equal(game.phase, 'roundOver');
  assert.equal(game.userSeat.hands[0].outcome, 'dealerBlackjack');
  assert.equal(game.userNet, -100);
});

test('פסילה מפסידה מיד', () => {
  const game = stackedGame(['10', '9', '6', '7', 'K']);
  game.startRound({ user: 50 });
  game.act('hit');
  assert.equal(game.userSeat.hands[0].outcome, 'bust');
  assert.equal(game.userNet, -50);
});

test('תיקו כששני הצדדים שווים', () => {
  const game = stackedGame(['10', '9', '9', '10']);
  game.startRound({ user: 100 });
  game.act('stand');
  assert.equal(game.userSeat.hands[0].outcome, 'push');
  assert.equal(game.userNet, 0);
});

test('הכפלה מכפילה את ההימור ומסיימת את היד בקלף אחד', () => {
  const game = stackedGame(['6', '9', '5', '8', '10', '2']);
  game.startRound({ user: 100 });
  assert.ok(game.legalActions().includes('double'));
  game.act('double');
  const hand = game.userSeat.hands[0];
  assert.equal(hand.bet, 200);
  assert.equal(hand.cards.length, 3);
  assert.equal(hand.doubled, true);
});

test('כניעה מחזירה מחצית מההימור', () => {
  const game = stackedGame(['10', '9', '6', '7']);
  game.startRound({ user: 100 });
  assert.ok(game.legalActions().includes('surrender'));
  game.act('surrender');
  assert.equal(game.userSeat.hands[0].outcome, 'surrender');
  assert.equal(game.userNet, -50);
});

test('כניעה אינה זמינה כשהחוק מבטל אותה', () => {
  const game = stackedGame(['10', '9', '6', '7'], { surrender: 'none' });
  game.startRound({ user: 100 });
  assert.equal(game.legalActions().includes('surrender'), false);
});

test('פיצול יוצר שתי ידיים עם הימור זהה', () => {
  const game = stackedGame(['8', '9', '8', '7', '3', '2']);
  game.startRound({ user: 100 });
  assert.ok(game.legalActions().includes('split'));
  game.act('split');
  assert.equal(game.userSeat.hands.length, 2);
  assert.equal(game.userSeat.hands[0].bet, 100);
  assert.equal(game.userSeat.hands[1].bet, 100);
  assert.equal(game.userSeat.hands[0].cards.length, 2);
  assert.equal(game.userSeat.hands[1].cards.length, 2);
});

test('אסים מפוצלים מקבלים קלף אחד בלבד', () => {
  const game = stackedGame(['A', '9', 'A', '7', 'K', 'Q']);
  game.startRound({ user: 100 });
  game.act('split');
  const hands = game.userSeat.hands;
  assert.equal(hands.length, 2);
  assert.equal(hands[0].cards.length, 2);
  assert.equal(hands[1].cards.length, 2);
  assert.equal(hands[0].done, true);
  assert.equal(hands[1].done, true);
});

test('21 לאחר פיצול אינו בלאק ג׳ק ומשולם 1:1', () => {
  const game = stackedGame(['A', '9', 'A', '8', 'K', 'Q', '5']);
  game.startRound({ user: 100 });
  game.act('split');
  assert.equal(game.phase, 'roundOver');
  for (const hand of game.userSeat.hands) {
    assert.equal(handValue(hand.cards).total, 21);
    assert.notEqual(hand.outcome, 'blackjack');
  }
  assert.equal(game.userNet, 200);
});

test('הכפלה לאחר פיצול נחסמת כאשר DAS כבוי', () => {
  const game = stackedGame(['8', '9', '8', '7', '3', '2'], { doubleAfterSplit: false });
  game.startRound({ user: 100 });
  game.act('split');
  assert.equal(game.legalActions().includes('double'), false);
});

test('מספר הידיים בפיצול מוגבל לפי החוקים', () => {
  const game = stackedGame(['8', '9', '8', '7', '8', '8', '8', '8', '2', '3', '4', '5'], { maxSplitHands: 2 });
  game.startRound({ user: 100 });
  game.act('split');
  assert.equal(game.legalActions().includes('split'), false, 'אסור לפצל מעבר למגבלה');
});

test('ביטוח מנצח 2:1 כשלדילר בלאק ג׳ק', () => {
  const game = stackedGame(['10', 'A', '9', 'K']);
  game.startRound({ user: 100 });
  assert.equal(game.phase, 'insurance');
  game.takeInsurance('user', 50);
  game.resolveInsurance();
  assert.equal(game.phase, 'roundOver');
  // הפסד 100 על היד, רווח 100 על הביטוח
  assert.equal(game.userNet, 0);
});

test('ביטוח מפסיד כשאין לדילר בלאק ג׳ק', () => {
  const game = stackedGame(['10', 'A', '9', '7', '5']);
  game.startRound({ user: 100 });
  game.takeInsurance('user', 50);
  game.resolveInsurance();
  assert.equal(game.phase, 'playerTurn');
  game.act('stand');
  // דילר: A+7 = 18 רכה, עומד. שחקן 19 מנצח 100, ביטוח מפסיד 50
  assert.equal(game.userNet, 50);
});

test('הדילר עומד ב-17 רכה כאשר S17', () => {
  const game = stackedGame(['10', '6', '9', 'A', '5'], { dealerHitsSoft17: false });
  game.startRound({ user: 100 });
  game.act('stand');
  assert.equal(handValue(game.dealerCards).total, 17);
  assert.equal(game.dealerCards.length, 2);
});

test('הדילר לוקח ב-17 רכה כאשר H17', () => {
  const game = stackedGame(['10', '6', '9', 'A', '5'], { dealerHitsSoft17: true });
  game.startRound({ user: 100 });
  game.act('stand');
  assert.ok(game.dealerCards.length > 2, 'הדילר חייב לקחת קלף ב-17 רכה');
});

test('הדילר עומד על 17 קשה', () => {
  const game = stackedGame(['10', '7', '9', '10', '5'], { dealerHitsSoft17: true });
  game.startRound({ user: 100 });
  game.act('stand');
  assert.equal(handValue(game.dealerCards).total, 17);
  assert.equal(game.dealerCards.length, 2);
});

test('פסילת הדילר מנצחת את כל הידיים החיות', () => {
  const game = stackedGame(['10', '6', '8', '7', 'K']);
  game.startRound({ user: 100 });
  game.act('stand');
  assert.equal(handValue(game.dealerCards).busted, true);
  assert.equal(game.userSeat.hands[0].outcome, 'win');
  assert.equal(game.userNet, 100);
});

test('סיבוב מלא עם שחקנים ממוחשבים מסתיים תקין', () => {
  const game = new BlackjackGame(
    DEFAULT_RULES,
    [
      { id: 'bot1', name: 'בוט', bankroll: 1000 },
      { id: 'user', name: 'אתה', isUser: true, bankroll: 1000 },
      { id: 'bot2', name: 'בוט2', bankroll: 1000 },
    ],
    createRng(77),
  );
  for (let round = 0; round < 60; round++) {
    game.startRound({ bot1: 10, user: 10, bot2: 10 });
    if (game.phase === 'insurance') game.resolveInsurance();
    let guard = 0;
    while (game.phase === 'playerTurn' && guard++ < 40) {
      const legal = game.legalActions();
      if (!legal.length) break;
      game.act(legal.includes('stand') ? 'stand' : legal[0]);
    }
    assert.equal(game.phase, 'roundOver', `סיבוב ${round} לא הסתיים`);
    for (const seat of game.seats) {
      for (const hand of seat.hands) {
        assert.ok(hand.outcome, 'כל יד חייבת לקבל תוצאה');
      }
    }
  }
});

test('אין קלפים כפולים לאורך נעל שלמה במשחק אמיתי', () => {
  const game = new BlackjackGame({ ...DEFAULT_RULES, penetration: 0.95 }, [{ id: 'user', name: 'אתה', isUser: true }], createRng(5));
  const seen = new Set<string>();
  let shuffles = game.shoe.shuffleCount;
  for (let round = 0; round < 40; round++) {
    if (game.shoe.shuffleCount > shuffles) {
      seen.clear();
      shuffles = game.shoe.shuffleCount;
    }
    game.startRound({ user: 10 });
    if (game.shoe.shuffleCount > shuffles) {
      seen.clear();
      shuffles = game.shoe.shuffleCount;
    }
    if (game.phase === 'insurance') game.resolveInsurance();
    let guard = 0;
    while (game.phase === 'playerTurn' && guard++ < 30) {
      const legal = game.legalActions();
      if (!legal.length) break;
      game.act('hit');
    }
    const all = [...game.dealerCards, ...game.userSeat.hands.flatMap((x) => x.cards)];
    for (const c of all) {
      assert.equal(seen.has(c.id), false, `קלף כפול: ${c.id}`);
      seen.add(c.id);
    }
  }
});
