import test from 'node:test';
import assert from 'node:assert/strict';
import { bankrollForRisk, kellyFraction, normalCdf, projection, riskOfRuin, riskOfRuinFinite } from '../src/engine/risk.ts';

test('התפלגות נורמלית מצטברת מדויקת', () => {
  assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(normalCdf(1) - 0.8413447) < 1e-5);
  assert.ok(Math.abs(normalCdf(-1) - 0.1586553) < 1e-5);
  assert.ok(Math.abs(normalCdf(1.96) - 0.975) < 1e-4);
});

test('סיכון חורבן יורד ככל שההון גדל', () => {
  const base = { evPerHand: 0.01, sdPerHand: 1.15 };
  const small = riskOfRuin({ ...base, bankrollUnits: 50 });
  const medium = riskOfRuin({ ...base, bankrollUnits: 200 });
  const large = riskOfRuin({ ...base, bankrollUnits: 1000 });
  assert.ok(small > medium && medium > large);
  assert.ok(large < 0.01);
});

test('תוחלת שלילית = חורבן ודאי במשחק אינסופי', () => {
  assert.equal(riskOfRuin({ bankrollUnits: 1000, evPerHand: -0.005, sdPerHand: 1.15 }), 1);
  assert.equal(riskOfRuin({ bankrollUnits: 1000, evPerHand: 0, sdPerHand: 1.15 }), 1);
});

test('נוסחת סיכון החורבן תואמת את הערך האנליטי', () => {
  const ev = 0.01;
  const sd = 1.15;
  const units = 100;
  const expected = Math.exp((-2 * ev * units) / (sd * sd));
  assert.ok(Math.abs(riskOfRuin({ bankrollUnits: units, evPerHand: ev, sdPerHand: sd }) - expected) < 1e-12);
});

test('סיכון במספר ידיים סופי קטן מהסיכון לאורך זמן אינסופי', () => {
  const input = { bankrollUnits: 100, evPerHand: 0.01, sdPerHand: 1.15 };
  const finite = riskOfRuinFinite(input, 5000);
  const infinite = riskOfRuin(input);
  assert.ok(finite <= infinite + 1e-9);
  assert.ok(finite > 0);
  assert.ok(riskOfRuinFinite(input, 100) < finite, 'פחות ידיים = פחות סיכון');
});

test('חישוב ההון הדרוש הוא הופכי לנוסחת הסיכון', () => {
  const ev = 0.012;
  const sd = 1.2;
  const needed = bankrollForRisk(0.05, ev, sd);
  assert.ok(needed);
  const backCheck = riskOfRuin({ bankrollUnits: needed, evPerHand: ev, sdPerHand: sd });
  assert.ok(Math.abs(backCheck - 0.05) < 1e-9);
});

test('אין הון סופי כשאין יתרון', () => {
  assert.equal(bankrollForRisk(0.05, -0.001, 1.15), null);
  assert.equal(bankrollForRisk(0.05, 0, 1.15), null);
});

test('שבר קלי = יתרון חלקי שונות', () => {
  assert.ok(Math.abs(kellyFraction(0.01, 1.15) - 0.01 / (1.15 * 1.15)) < 1e-12);
  assert.equal(kellyFraction(0.01, 0), 0);
});

test('תחזית מפגש מחשבת תוחלת וטווח 95%', () => {
  const p = projection(0.01, 1.15, 10000, 10);
  assert.ok(Math.abs(p.expected - 1000) < 1e-9);
  assert.ok(Math.abs(p.sd - 1.15 * Math.sqrt(10000) * 10) < 1e-9);
  assert.ok(p.low < p.expected && p.expected < p.high);
});
