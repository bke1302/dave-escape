import test from 'node:test';
import assert from 'node:assert/strict';
import { mean, percent, round, RunningStats, SeriesTracker, signed, standardDeviation, variance } from '../src/engine/stats.ts';

test('ממוצע ושונות מדגמית', () => {
  const values = [2, 4, 4, 4, 5, 5, 7, 9];
  assert.equal(mean(values), 5);
  assert.ok(Math.abs(variance(values) - 4.571428571) < 1e-6);
  assert.ok(Math.abs(standardDeviation(values) - 2.13808993) < 1e-6);
});

test('צובר זרימה מחשב ממוצע וסטיית תקן כמו החישוב הישיר', () => {
  const values = [1, -1, 2, -2, 3, 0, 1.5, -0.5];
  const stats = new RunningStats();
  for (const v of values) stats.push(v);
  assert.equal(stats.count, values.length);
  assert.ok(Math.abs(stats.average - mean(values)) < 1e-12);
  assert.ok(Math.abs(stats.variance - variance(values)) < 1e-12);
  assert.equal(stats.min, -2);
  assert.equal(stats.max, 3);
});

test('מעקב ירידת שיא ורצפים', () => {
  const tracker = new SeriesTracker(100);
  for (const net of [10, 10, -5, -5, -5, 20, -1, -1, -1, -1]) tracker.update(net);
  assert.equal(tracker.peak, 125);
  assert.equal(tracker.longestWinStreak, 2);
  assert.equal(tracker.longestLoseStreak, 4);
  assert.equal(tracker.maxDrawdown, 15);
  assert.equal(tracker.current, 121);
});

test('ירידת שיא נמדדת מהשיא ולא מההתחלה', () => {
  const tracker = new SeriesTracker(0);
  tracker.update(100);
  tracker.update(-60);
  tracker.update(20);
  tracker.update(-50);
  assert.equal(tracker.peak, 100);
  assert.equal(tracker.maxDrawdown, 90);
});

test('פורמטים לתצוגה', () => {
  assert.equal(round(1.23456, 2), 1.23);
  assert.equal(percent(0.1234), '12.34%');
  // המרה לעברית מוסיפה סימון כיווניות (LRM) כדי שמספרים שליליים יוצגו נכון ב-RTL
  const strip = (value: string): string => value.replace(/[\u200e\u200f]/g, '');
  assert.equal(strip(signed(5)), '+5');
  assert.equal(strip(signed(-5)), '-5');
  assert.equal(strip(signed(1234)), '+1,234');
});
