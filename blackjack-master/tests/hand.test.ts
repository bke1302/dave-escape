import test from 'node:test';
import assert from 'node:assert/strict';
import type { Card, Rank, Suit } from '../src/engine/cards.ts';
import { describeHandHe, handValue, isAcePair, isBlackjack, isBusted, isPair } from '../src/engine/hand.ts';

function card(rank: Rank, suit: Suit = 'spades'): Card {
  return { rank, suit, id: `${rank}-${suit}-${Math.random()}` };
}

test('ערך יד בסיסי', () => {
  assert.equal(handValue([card('10'), card('7')]).total, 17);
  assert.equal(handValue([card('K'), card('Q')]).total, 20);
});

test('אס נספר כ-11 כשאפשר', () => {
  const hv = handValue([card('A'), card('6')]);
  assert.equal(hv.total, 17);
  assert.equal(hv.soft, true);
});

test('אס מוקטן ל-1 כדי למנוע פסילה', () => {
  const hv = handValue([card('A'), card('6'), card('8')]);
  assert.equal(hv.total, 15);
  assert.equal(hv.soft, false);
});

test('אס + אס = 12 רכה', () => {
  const hv = handValue([card('A'), card('A', 'hearts')]);
  assert.equal(hv.total, 12);
  assert.equal(hv.soft, true);
});

test('שלושה אסים = 13 רכה', () => {
  const hv = handValue([card('A'), card('A', 'hearts'), card('A', 'clubs')]);
  assert.equal(hv.total, 13);
  assert.equal(hv.soft, true);
});

test('A,A,9 = 21', () => {
  assert.equal(handValue([card('A'), card('A', 'hearts'), card('9')]).total, 21);
});

test('בלאק ג׳ק מזוהה רק בשני קלפים ולא לאחר פיצול', () => {
  assert.equal(isBlackjack([card('A'), card('K')]), true);
  assert.equal(isBlackjack([card('A'), card('K')], true), false);
  assert.equal(isBlackjack([card('7'), card('7'), card('7')]), false);
});

test('פסילה מעל 21', () => {
  assert.equal(isBusted([card('K'), card('Q'), card('5')]), true);
  assert.equal(isBusted([card('K'), card('Q')]), false);
});

test('זיהוי זוגות לפי ערך', () => {
  assert.equal(isPair([card('8'), card('8', 'hearts')]), true);
  assert.equal(isPair([card('K'), card('10')]), true, 'מלך ועשר נחשבים זוג לצורך פיצול');
  assert.equal(isPair([card('9'), card('8')]), false);
  assert.equal(isAcePair([card('A'), card('A', 'hearts')]), true);
});

test('תיאור יד בעברית', () => {
  assert.equal(describeHandHe([card('A'), card('7')]), 'רכה 18');
  assert.equal(describeHandHe([card('10'), card('6')]), 'קשה 16');
  assert.match(describeHandHe([card('A'), card('K')]), /בלאק/);
  assert.match(describeHandHe([card('K'), card('Q'), card('5')]), /נפסל/);
});
