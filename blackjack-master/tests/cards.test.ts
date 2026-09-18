import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDeck, buildShoeCards, hiLoValue, rankValue, RANKS, SUITS } from '../src/engine/cards.ts';
import { createRng, fisherYatesShuffle } from '../src/engine/rng.ts';

test('חפיסה מכילה 52 קלפים ייחודיים', () => {
  const deck = buildDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((c) => `${c.rank}${c.suit}`)).size, 52);
});

test('ערכי קלפים נכונים', () => {
  assert.equal(rankValue('A'), 11);
  for (const r of ['10', 'J', 'Q', 'K'] as const) assert.equal(rankValue(r), 10);
  for (let n = 2; n <= 9; n++) assert.equal(rankValue(String(n) as never), n);
});

test('ערכי Hi-Lo: 2-6 = +1, 7-9 = 0, 10-A = -1', () => {
  for (const r of ['2', '3', '4', '5', '6'] as const) assert.equal(hiLoValue(r), 1);
  for (const r of ['7', '8', '9'] as const) assert.equal(hiLoValue(r), 0);
  for (const r of ['10', 'J', 'Q', 'K', 'A'] as const) assert.equal(hiLoValue(r), -1);
});

test('סכום Hi-Lo של חפיסה שלמה הוא אפס', () => {
  const total = buildDeck().reduce((sum, c) => sum + hiLoValue(c.rank), 0);
  assert.equal(total, 0);
});

test('נעל של 6 חפיסות מכילה 312 קלפים עם מזהים ייחודיים', () => {
  const shoe = buildShoeCards(6);
  assert.equal(shoe.length, 312);
  assert.equal(new Set(shoe.map((c) => c.id)).size, 312);
});

test('ערבוב Fisher-Yates משמר את כל הקלפים', () => {
  const rng = createRng(99);
  const original = buildShoeCards(2);
  const shuffled = fisherYatesShuffle([...original], rng);
  assert.equal(shuffled.length, original.length);
  assert.deepEqual(
    shuffled.map((c) => c.id).sort(),
    original.map((c) => c.id).sort(),
  );
  assert.notDeepEqual(shuffled.map((c) => c.id), original.map((c) => c.id));
});

test('ערבוב מפזר קלפים באופן סביר (ללא הטיה גסה)', () => {
  const rng = createRng(7);
  const counts = new Array(52).fill(0);
  const trials = 4000;
  for (let i = 0; i < trials; i++) {
    const deck = fisherYatesShuffle(buildDeck(), rng);
    const index = deck.findIndex((c) => c.rank === 'A' && c.suit === 'spades');
    counts[index]++;
  }
  const expected = trials / 52;
  for (const count of counts) {
    assert.ok(Math.abs(count - expected) < expected * 0.75, `פיזור חריג: ${count} מול ${expected}`);
  }
});
