import test from 'node:test';
import assert from 'node:assert/strict';
import { EvSolver, fullShoeComposition, removeCards, roundExpectedValue } from '../src/engine/evEngine.ts';
import { DEFAULT_RULES, type Rules } from '../src/engine/rules.ts';

const S17: Rules = { ...DEFAULT_RULES, decks: 6 };
const H17: Rules = { ...S17, dealerHitsSoft17: true };

function solver(rules: Rules, known: number[] = []): EvSolver {
  return new EvSolver(removeCards(fullShoeComposition(rules.decks), known), rules);
}

test('התפלגות תוצאות הדילר מסתכמת ל-1', () => {
  const s = solver(S17);
  for (let up = 1; up <= 10; up++) {
    const dist = s.dealerDist(up);
    const sum = dist.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `קלף חשוף ${up}: סכום ${sum}`);
  }
});

/**
 * ערכי ייחוס מפורסמים להתפלגות הדילר בנעל של 6 חפיסות (S17), בהתניה שאין לדילר
 * בלאק ג'ק. סטייה של עד 0.7 נקודות אחוז מתקבלת בשל קירוב הדגימה עם החזרה.
 */
test('התפלגות הדילר קרובה לערכי הייחוס המפורסמים', () => {
  const s = solver(S17);
  const dist2 = s.dealerDist(2);
  assert.ok(Math.abs(dist2[5] - 0.3536) < 0.007, `פסילה מול 2: ${dist2[5]}`);
  const dist6 = s.dealerDist(6);
  assert.ok(Math.abs(dist6[5] - 0.4228) < 0.007, `פסילה מול 6: ${dist6[5]}`);
  const dist10 = s.dealerDist(10);
  assert.ok(Math.abs(dist10[5] - 0.2297) < 0.007, `פסילה מול 10: ${dist10[5]}`);
  const distA = s.dealerDist(1);
  assert.ok(Math.abs(distA[5] - 0.1681) < 0.007, `פסילה מול אס: ${distA[5]}`);
});

test('טיפול נכון באס כפול אצל הדילר (רגרסיה)', () => {
  const s = solver(S17);
  // אם A+A היה מטופל כיד קשה, שיעור הפסילה מול אס היה קופץ מעל 19%
  assert.ok(s.dealerDist(1)[5] < 0.18);
});

test('תוחלת עמידה על 20 מול 10 חיובית וסבירה', () => {
  const s = solver(S17, [10, 10, 10]);
  const ev = s.standEV(20, 10);
  assert.ok(ev > 0.4 && ev < 0.7, `תוחלת ${ev}`);
  assert.ok(s.standEV(17, 10) < 0);
});

test('לקיחת קלף על 20 גרועה מעמידה', () => {
  const s = solver(S17);
  assert.ok(s.hitEV(20, false, 6) < s.standEV(20, 6));
});

test('הכפלה על 11 טובה מלקיחה מול קלף דילר חלש', () => {
  const s = solver(S17, [6, 5, 6]);
  assert.ok(s.doubleEV(11, false, 6) > s.hitEV(11, false, 6));
});

test('פיצול אסים טוב מלקיחה על 12 רכה', () => {
  const s = solver(S17, [1, 1, 6]);
  assert.ok(s.splitEV(1, 6) > s.hitEV(12, true, 6));
});

test('יתרון הבית תואם את הערכים המפורסמים לכל סט חוקים', () => {
  const cases: { rules: Rules; expected: number; tolerance: number; label: string }[] = [
    { rules: S17, expected: 0.004, tolerance: 0.0012, label: '6D S17 DAS LS 3:2' },
    { rules: H17, expected: 0.0061, tolerance: 0.0015, label: '6D H17 DAS LS 3:2' },
    { rules: { ...S17, surrender: 'none' }, expected: 0.0046, tolerance: 0.0012, label: '6D S17 DAS ללא כניעה' },
    { rules: { ...S17, decks: 8 }, expected: 0.0043, tolerance: 0.0012, label: '8D S17 DAS LS' },
  ];
  for (const c of cases) {
    const edge = -roundExpectedValue(fullShoeComposition(c.rules.decks), c.rules);
    assert.ok(Math.abs(edge - c.expected) < c.tolerance, `${c.label}: ${(edge * 100).toFixed(3)}%`);
  }
});

test('תשלום 6:5 מוסיף כ-1.4% ליתרון הבית', () => {
  const normal = -roundExpectedValue(fullShoeComposition(6), S17);
  const bad = -roundExpectedValue(fullShoeComposition(6), { ...S17, blackjackPayout: 1.2 });
  const diff = bad - normal;
  assert.ok(Math.abs(diff - 0.0139) < 0.002, `ההפרש הוא ${(diff * 100).toFixed(2)}%`);
});

test('ביטול DAS וכניעה מחמיר את יתרון הבית', () => {
  const base = -roundExpectedValue(fullShoeComposition(6), S17);
  const noDas = -roundExpectedValue(fullShoeComposition(6), { ...S17, doubleAfterSplit: false });
  const noSurrender = -roundExpectedValue(fullShoeComposition(6), { ...S17, surrender: 'none' });
  assert.ok(noDas > base);
  assert.ok(noSurrender > base);
});

test('פחות חפיסות = יתרון בית נמוך יותר', () => {
  const single = -roundExpectedValue(fullShoeComposition(1), { ...S17, decks: 1 });
  const six = -roundExpectedValue(fullShoeComposition(6), S17);
  assert.ok(single < six);
});

test('ספירה חיובית משפרת את תוחלת השחקן', () => {
  const neutral = roundExpectedValue(fullShoeComposition(3), S17);
  const comp = fullShoeComposition(3);
  // הסרת 15 קלפים נמוכים מדמה ספירה רצה של +15
  for (let i = 0; i < 3; i++) for (let v = 2; v <= 6; v++) comp[v] -= 1;
  const positive = roundExpectedValue(comp, S17);
  assert.ok(positive > neutral, `${positive} מול ${neutral}`);
});
