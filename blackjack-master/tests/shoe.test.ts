import test from 'node:test';
import assert from 'node:assert/strict';
import { Shoe } from '../src/engine/shoe.ts';
import { createRng } from '../src/engine/rng.ts';

test('נעל מחלקת את כל הקלפים ללא כפילויות ובלי להמציא קלפים', () => {
  const shoe = new Shoe(2, 1, createRng(1));
  const seen = new Set<string>();
  for (let i = 0; i < 104; i++) {
    const card = shoe.draw();
    assert.equal(seen.has(card.id), false, 'קלף כפול יצא מהנעל');
    seen.add(card.id);
  }
  assert.equal(seen.size, 104);
});

test('ספירה רצה של נעל שחולקה במלואה חוזרת לאפס', () => {
  const shoe = new Shoe(6, 1, createRng(5));
  for (let i = 0; i < 312; i++) shoe.draw();
  assert.equal(shoe.runningCount, 0);
  assert.equal(shoe.cardsRemaining, 0);
});

test('כרטיס החיתוך נדלק לפי החדירה שהוגדרה', () => {
  const shoe = new Shoe(6, 0.75, createRng(3));
  const cut = Math.floor(312 * 0.75);
  for (let i = 0; i < cut - 1; i++) shoe.draw();
  assert.equal(shoe.needsShuffle, false);
  shoe.draw();
  assert.equal(shoe.needsShuffle, true);
});

test('ערבוב מאפס ספירה, מיקום ודגל חיתוך', () => {
  const shoe = new Shoe(4, 0.5, createRng(11));
  for (let i = 0; i < 120; i++) shoe.draw();
  shoe.shuffle();
  assert.equal(shoe.runningCount, 0);
  assert.equal(shoe.cardsDealt, 0);
  assert.equal(shoe.needsShuffle, false);
  assert.equal(shoe.cardsRemaining, 208);
});

test('חפיסות שנותרו וספירה אמיתית מחושבות נכון', () => {
  const shoe = new Shoe(6, 0.9, createRng(13));
  for (let i = 0; i < 156; i++) shoe.draw();
  assert.equal(shoe.decksRemaining, 3);
  const expected = shoe.runningCount / 3;
  assert.ok(Math.abs(shoe.trueCount - expected) < 1e-9);
});

test('הרכב הנעל שנותר תואם את הקלפים שלא חולקו', () => {
  const shoe = new Shoe(1, 1, createRng(21));
  for (let i = 0; i < 10; i++) shoe.draw();
  const comp = shoe.remainingComposition();
  const total = comp.reduce((a, b) => a + b, 0);
  assert.equal(total, 42);
  assert.equal(comp[10] + comp[1] + comp.slice(2, 10).reduce((a, b) => a + b, 0), 42);
});

test('נעל מתערבבת אוטומטית אם נגמרו הקלפים', () => {
  const shoe = new Shoe(1, 1, createRng(31));
  for (let i = 0; i < 52; i++) shoe.draw();
  const card = shoe.draw();
  assert.ok(card, 'הנעל חייבת לספק קלף לאחר ערבוב אוטומטי');
  assert.equal(shoe.shuffleCount, 2);
});
