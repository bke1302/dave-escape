import test from 'node:test';
import assert from 'node:assert/strict';
import { DEVIATIONS, actionForDeviation, deviationApplies, deviationsApplicable, findDeviation, INSURANCE_INDEX } from '../src/engine/deviations.ts';
import { DEFAULT_RULES } from '../src/engine/rules.ts';

test('רשימת הסטיות כוללת את Illustrious 18 ואת Fab 4', () => {
  assert.equal(DEVIATIONS.filter((d) => d.group === 'illustrious18').length, 17);
  assert.equal(DEVIATIONS.filter((d) => d.group === 'fab4').length, 4);
  assert.equal(DEVIATIONS.filter((d) => d.group === 'insurance').length, 1);
});

test('אינדקס הביטוח הוא +3', () => {
  assert.equal(INSURANCE_INDEX, 3);
});

test('16 מול 10: עמידה מספירה 0 ומעלה', () => {
  const dev = DEVIATIONS.find((d) => d.id === '16v10');
  assert.ok(dev);
  assert.equal(actionForDeviation(dev, -1), 'hit');
  assert.equal(actionForDeviation(dev, 0), 'stand');
  assert.equal(actionForDeviation(dev, 3), 'stand');
});

test('13 מול 2: לקיחה בספירה שלילית בלבד', () => {
  const dev = DEVIATIONS.find((d) => d.id === '13v2');
  assert.ok(dev);
  assert.equal(dev.direction, 'atOrBelow');
  assert.equal(actionForDeviation(dev, 0), 'stand');
  assert.equal(actionForDeviation(dev, -1), 'hit');
  assert.equal(actionForDeviation(dev, -4), 'hit');
});

test('תנאי כיוון הסטייה', () => {
  const up = DEVIATIONS.find((d) => d.id === '12v3');
  const down = DEVIATIONS.find((d) => d.id === '12v5');
  assert.ok(up && down);
  assert.equal(deviationApplies(up, 2), true);
  assert.equal(deviationApplies(up, 1), false);
  assert.equal(deviationApplies(down, -2), true);
  assert.equal(deviationApplies(down, -1), false);
});

test('איתור סטייה לפי יד וקלף דילר', () => {
  assert.equal(findDeviation([10, 6], 10)?.id, '16v10');
  assert.equal(findDeviation([9, 7], 10)?.id, '16v10', 'זיהוי לפי סכום היד');
  assert.equal(findDeviation([10, 10], 5)?.id, '1010v5');
  assert.equal(findDeviation([5, 4], 2)?.id, '9v2');
  assert.equal(findDeviation([10, 7], 5), undefined, 'אין סטייה ל-17 מול 5');
});

test('האינדקסים מסומנים כלא מתאימים לחפיסה אחת או שתיים', () => {
  assert.equal(deviationsApplicable({ ...DEFAULT_RULES, decks: 6 }), true);
  assert.equal(deviationsApplicable({ ...DEFAULT_RULES, decks: 8 }), true);
  assert.equal(deviationsApplicable({ ...DEFAULT_RULES, decks: 2 }), false);
  assert.equal(deviationsApplicable({ ...DEFAULT_RULES, decks: 1 }), false);
});

test('לכל סטייה יש הסבר בעברית ואינדקס מספרי', () => {
  for (const dev of DEVIATIONS) {
    assert.match(dev.note, /[֐-׿]/, `הסבר חסר: ${dev.id}`);
    assert.equal(Number.isFinite(dev.index), true);
  }
});
