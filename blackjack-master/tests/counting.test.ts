import test from 'node:test';
import assert from 'node:assert/strict';
import type { Rank } from '../src/engine/cards.ts';
import {
  betForTrueCount,
  compositionForCount,
  estimateDecksRemaining,
  isDeckEstimateCorrect,
  isTrueCountAnswerCorrect,
  runningCountOfRanks,
  trueCount,
  unitsForTrueCount,
} from '../src/engine/counting.ts';

test('ספירה רצה של רצף לדוגמה', () => {
  const ranks: Rank[] = ['5', 'K', '3', '8', 'A'];
  // +1, -1, +1, 0, -1 = 0
  assert.equal(runningCountOfRanks(ranks), 0);
});

test('ספירה רצה חיובית ושלילית', () => {
  assert.equal(runningCountOfRanks(['2', '3', '4', '5', '6']), 5);
  assert.equal(runningCountOfRanks(['10', 'J', 'Q', 'K', 'A']), -5);
  assert.equal(runningCountOfRanks(['7', '8', '9']), 0);
});

test('ספירה אמיתית = ספירה רצה חלקי חפיסות שנותרו', () => {
  assert.equal(trueCount(6, 3, 'exact'), 2);
  assert.equal(trueCount(9, 3), 3);
  assert.equal(trueCount(8, 2), 4);
});

test('עיגול ספירה אמיתית כלפי מטה בערך מוחלט', () => {
  assert.equal(trueCount(7, 2), 3, '3.5 → 3');
  assert.equal(trueCount(-7, 2), -3, '-3.5 → -3');
  assert.equal(trueCount(5, 2, 'round'), 3, '2.5 → 3 בעיגול רגיל');
});

test('ספירה אמיתית עם חפיסות שבריות', () => {
  assert.equal(trueCount(6, 2.5, 'exact'), 2.4);
  assert.equal(trueCount(6, 2.5), 2);
});

test('סובלנות של חצי נקודה בתשובות ספירה אמיתית', () => {
  assert.equal(isTrueCountAnswerCorrect(2, 6, 2.5), true, '2.4 מול תשובה 2');
  assert.equal(isTrueCountAnswerCorrect(3, 6, 2.5), false, 'סטייה של 0.6 נפסלת');
  assert.equal(isTrueCountAnswerCorrect(4, 8, 2), true);
});

test('רמפת הימורים: יחידות = ספירה אמיתית פחות 1', () => {
  const spread = { unit: 10, maxUnits: 8 };
  assert.equal(unitsForTrueCount(-5, spread), 1);
  assert.equal(unitsForTrueCount(0, spread), 1);
  assert.equal(unitsForTrueCount(1, spread), 1);
  assert.equal(unitsForTrueCount(2, spread), 1);
  assert.equal(unitsForTrueCount(3, spread), 2);
  assert.equal(unitsForTrueCount(5, spread), 4);
  assert.equal(unitsForTrueCount(20, spread), 8, 'מוגבל למקסימום הפריסה');
  assert.equal(betForTrueCount(5, spread), 40);
});

test('הערכת חפיסות מעוגלת לחצי חפיסה', () => {
  assert.equal(estimateDecksRemaining(104), 2);
  assert.equal(estimateDecksRemaining(130), 2.5);
  assert.equal(estimateDecksRemaining(120), 2.5);
  assert.equal(isDeckEstimateCorrect(2, 2.4), true);
  assert.equal(isDeckEstimateCorrect(2, 2.6), false);
});

test('הרכב נעל לפי ספירה מסיר קלפים נמוכים בספירה חיובית', () => {
  const neutral = compositionForCount(3, 0);
  const positive = compositionForCount(3, 10);
  const lowNeutral = neutral.slice(2, 7).reduce((a, b) => a + b, 0);
  const lowPositive = positive.slice(2, 7).reduce((a, b) => a + b, 0);
  assert.ok(lowPositive < lowNeutral, 'ספירה חיובית = פחות קלפים נמוכים');
  assert.ok(Math.abs(lowNeutral - lowPositive - 10) < 1e-9, 'הפרש של בדיוק 10 קלפים נמוכים');
  const negative = compositionForCount(3, -10);
  assert.ok(negative[10] < neutral[10], 'ספירה שלילית = פחות קלפי עשר');
});
