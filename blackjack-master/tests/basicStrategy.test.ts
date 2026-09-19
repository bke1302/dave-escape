import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChart, chartAction, DEALER_UPS, decideByValues, resolveCell, type CellCode } from '../src/engine/basicStrategy.ts';
import { DEFAULT_RULES, type Rules } from '../src/engine/rules.ts';

const S17: Rules = { ...DEFAULT_RULES, decks: 6, dealerHitsSoft17: false, doubleAfterSplit: true, surrender: 'late' };
const H17: Rules = { ...S17, dealerHitsSoft17: true };

function cell(chart: ReturnType<typeof buildChart>, kind: 'hard' | 'soft' | 'pairs', row: number, up: number): CellCode {
  const index = DEALER_UPS.indexOf(up);
  return chart[kind][row][index];
}

/**
 * טבלאות הייחוס הן טבלאות האסטרטגיה הבסיסית המקובלות למשחק 4-8 חפיסות.
 * הטבלאות באפליקציה מחושבות במנוע ה-EV — הבדיקה מוודאת שהחישוב מתלכד עם הידוע.
 */
const EXPECTED_S17_HARD: Record<number, string[]> = {
  //      2    3    4    5    6    7    8    9   10    A
  5: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  8: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  9: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  10: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
  11: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'],
  12: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  13: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  14: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  15: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'R', 'H'],
  16: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'R', 'R', 'R'],
  17: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
};

const EXPECTED_S17_SOFT: Record<number, string[]> = {
  2: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  3: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  4: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  5: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  6: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  7: ['S', 'Ds', 'Ds', 'Ds', 'Ds', 'S', 'S', 'H', 'H', 'H'],
  8: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  9: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
};

const EXPECTED_S17_PAIRS: Record<number, string[]> = {
  1: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  2: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  3: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  4: ['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
  5: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
  6: ['P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
  7: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  8: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  9: ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'],
  10: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
};

test('טבלת ידיים קשות (6 חפיסות, S17) תואמת את האסטרטגיה הבסיסית המקובלת', () => {
  const chart = buildChart(S17);
  for (const [total, expected] of Object.entries(EXPECTED_S17_HARD)) {
    assert.deepEqual(chart.hard[Number(total)], expected, `שורת ${total}`);
  }
});

test('טבלת ידיים רכות (6 חפיסות, S17) תואמת את האסטרטגיה הבסיסית המקובלת', () => {
  const chart = buildChart(S17);
  for (const [second, expected] of Object.entries(EXPECTED_S17_SOFT)) {
    assert.deepEqual(chart.soft[Number(second)], expected, `שורת A,${second}`);
  }
});

test('טבלת זוגות (6 חפיסות, S17, DAS) תואמת את האסטרטגיה הבסיסית המקובלת', () => {
  const chart = buildChart(S17);
  for (const [value, expected] of Object.entries(EXPECTED_S17_PAIRS)) {
    assert.deepEqual(chart.pairs[Number(value)], expected, `זוג ${value}`);
  }
});

test('הבדלי H17 הידועים מופיעים בטבלה', () => {
  const chart = buildChart(H17);
  assert.equal(cell(chart, 'hard', 11, 1), 'D', '11 מול אס — הכפלה ב-H17');
  assert.equal(cell(chart, 'soft', 7, 2), 'Ds', 'A,7 מול 2 — הכפלה/עמידה ב-H17');
  assert.equal(cell(chart, 'soft', 8, 6), 'Ds', 'A,8 מול 6 — הכפלה/עמידה ב-H17');
  assert.equal(cell(chart, 'hard', 15, 1), 'R', '15 מול אס — כניעה ב-H17');
  assert.equal(cell(chart, 'hard', 17, 1), 'Rs', '17 מול אס — כניעה ב-H17');
  assert.equal(cell(chart, 'pairs', 8, 1), 'Rp', '8,8 מול אס — כניעה ב-H17 עם כניעה מאוחרת');
});

test('ללא DAS זוגות קטנים אינם מפוצלים מול 2 ו-3', () => {
  const noDas = buildChart({ ...S17, doubleAfterSplit: false });
  assert.equal(cell(noDas, 'pairs', 2, 2), 'H', '2,2 מול 2 ללא DAS');
  assert.equal(cell(noDas, 'pairs', 3, 2), 'H', '3,3 מול 2 ללא DAS');
  assert.equal(cell(noDas, 'pairs', 4, 5), 'H', '4,4 מול 5 ללא DAS');
  assert.equal(cell(noDas, 'pairs', 6, 2), 'H', '6,6 מול 2 ללא DAS');
});

test('ללא כניעה — התאים הופכים לפעולה החלופית', () => {
  const chart = buildChart({ ...S17, surrender: 'none' });
  assert.equal(cell(chart, 'hard', 16, 10), 'H');
  assert.equal(cell(chart, 'hard', 15, 10), 'H');
});

test('חוקי הכפלה מוגבלים משנים את הטבלה', () => {
  const chart = buildChart({ ...S17, doubleRule: '10-11' });
  assert.equal(cell(chart, 'hard', 9, 5), 'H', 'אסור להכפיל 9');
  assert.equal(cell(chart, 'hard', 10, 5), 'D');
  assert.equal(cell(chart, 'soft', 6, 5), 'H', 'אסור להכפיל ידיים רכות');
});

test('חפיסה אחת מייצרת הבדלים ידועים מול נעל מרובת חפיסות', () => {
  const single = buildChart({ ...S17, decks: 1 });
  assert.equal(cell(single, 'hard', 9, 2), 'D', '9 מול 2 — הכפלה בחפיסה אחת');
  assert.equal(cell(single, 'hard', 12, 4), 'H', '12 מול 4 — לקיחה בחפיסה אחת');
  assert.equal(cell(single, 'pairs', 7, 8), 'P', '7,7 מול 8 — פיצול בחפיסה אחת');
});

test('resolveCell מחזיר פעולה חלופית כשהפעולה אינה זמינה', () => {
  assert.equal(resolveCell('D', { canDouble: false, canSplit: false, canSurrender: false }), 'hit');
  assert.equal(resolveCell('Ds', { canDouble: false, canSplit: false, canSurrender: false }), 'stand');
  assert.equal(resolveCell('R', { canDouble: false, canSplit: false, canSurrender: false }), 'hit');
  assert.equal(resolveCell('Rp', { canDouble: false, canSplit: true, canSurrender: false }), 'split');
  assert.equal(resolveCell('P', { canDouble: false, canSplit: false, canSurrender: false }), 'hit');
});

test('chartAction מטפל בידיים מרובות קלפים', () => {
  const chart = buildChart(S17);
  const opts = { canDouble: false, canSplit: false, canSurrender: false };
  assert.equal(chartAction(chart, [5, 5, 6], 10, opts), 'hit', '16 משלושה קלפים מול 10');
  assert.equal(chartAction(chart, [5, 4, 4], 5, opts), 'stand', '13 מול 5');
  assert.equal(chartAction(chart, [1, 2, 4], 6, opts), 'hit', 'רכה 17 מול 6 ללא אפשרות הכפלה');
  assert.equal(chartAction(chart, [10, 10, 1], 9, opts), 'stand', '21 עומד תמיד');
});

test('decideByValues מחזיר תוחלות ממוינות והסבר בעברית', () => {
  const decision = decideByValues([10, 6], 10, S17, { canDouble: false, canSplit: false, canSurrender: true });
  assert.equal(decision.action, 'surrender');
  assert.ok(decision.evs[0].ev >= decision.evs[1].ev);
  assert.match(decision.explanation, /[֐-׿]/, 'ההסבר חייב להיות בעברית');
});
