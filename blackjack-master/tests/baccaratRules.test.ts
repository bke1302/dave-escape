import test from 'node:test';
import assert from 'node:assert/strict';
import type { Card, Rank, Suit } from '../src/engine/cards.ts';
import { baccaratRankValue, explainTotalHe, handTotal, handTotalFromValues, isNatural } from '../src/baccarat/engine/hand.ts';
import { bankerDraws, bankerRuleTable, playerDraws } from '../src/baccarat/engine/thirdCard.ts';
import { netPayout, DEFAULT_BACCARAT_RULES, type BaccaratRules } from '../src/baccarat/engine/rules.ts';

function card(rank: Rank, suit: Suit = 'spades'): Card {
  return { rank, suit, id: `${rank}-${suit}-${Math.random()}` };
}

test('ערכי קלפים: אס=1, 2-9 ערך מספרי, 10/J/Q/K=0', () => {
  assert.equal(baccaratRankValue('A'), 1);
  for (let n = 2; n <= 9; n++) assert.equal(baccaratRankValue(String(n) as Rank), n);
  for (const r of ['10', 'J', 'Q', 'K'] as Rank[]) assert.equal(baccaratRankValue(r), 0);
});

test('חוק Modulo 10 — רק ספרת האחדות נספרת', () => {
  assert.equal(handTotalFromValues([7, 8]), 5, '7+8=15 → 5');
  assert.equal(handTotalFromValues([9, 6]), 5, '9+6=15 → 5');
  assert.equal(handTotalFromValues([8, 7, 9]), 4, '8+7+9=24 → 4');
  assert.equal(handTotalFromValues([4, 2]), 6);
  assert.equal(handTotalFromValues([5, 5]), 0, '10 → 0');
  assert.equal(handTotalFromValues([0, 0]), 0);
  assert.equal(handTotalFromValues([9, 9, 9]), 7, '27 → 7');
});

test('חישוב יד מקלפים אמיתיים', () => {
  assert.equal(handTotal([card('K'), card('9')]), 9, 'מלך=0 ועוד 9');
  assert.equal(handTotal([card('A'), card('8')]), 9);
  assert.equal(handTotal([card('7'), card('8')]), 5);
  assert.equal(handTotal([card('10'), card('J'), card('Q')]), 0);
});

test('Natural = 8 או 9 בשני קלפים בלבד', () => {
  assert.equal(isNatural([card('9'), card('K')]), true);
  assert.equal(isNatural([card('A'), card('7')]), true, 'A+7=8');
  assert.equal(isNatural([card('7'), card('K')]), false, '7 אינו Natural');
  assert.equal(isNatural([card('5'), card('2'), card('2')]), false, 'שלושה קלפים אינם Natural');
});

test('הסבר חישוב היד בעברית', () => {
  assert.match(explainTotalHe([4, 2]), /= 6/);
  assert.match(explainTotalHe([7, 8]), /מורידים את העשרות/);
});

test('כלל השחקן: לוקח ב-0 עד 5, עומד ב-6 ו-7', () => {
  for (let total = 0; total <= 5; total++) assert.equal(playerDraws(total), true, `סכום ${total}`);
  assert.equal(playerDraws(6), false);
  assert.equal(playerDraws(7), false);
});

test('כלל הבנקאי כשהשחקן עמד — זהה לכלל השחקן', () => {
  for (let total = 0; total <= 5; total++) assert.equal(bankerDraws(total, null), true, `סכום ${total}`);
  assert.equal(bankerDraws(6, null), false);
  assert.equal(bankerDraws(7, null), false);
});

test('כלל הבנקאי 0-2: לוקח תמיד', () => {
  for (let total = 0; total <= 2; total++) {
    for (let third = 0; third <= 9; third++) {
      assert.equal(bankerDraws(total, third), true, `בנקאי ${total} מול קלף ${third}`);
    }
  }
});

test('כלל הבנקאי 3: לוקח אלא אם הקלף השלישי הוא 8', () => {
  for (let third = 0; third <= 9; third++) {
    assert.equal(bankerDraws(3, third), third !== 8, `קלף ${third}`);
  }
});

test('כלל הבנקאי 4: לוקח מול 2-7 בלבד', () => {
  for (let third = 0; third <= 9; third++) {
    assert.equal(bankerDraws(4, third), third >= 2 && third <= 7, `קלף ${third}`);
  }
});

test('כלל הבנקאי 5: לוקח מול 4-7 בלבד', () => {
  for (let third = 0; third <= 9; third++) {
    assert.equal(bankerDraws(5, third), third >= 4 && third <= 7, `קלף ${third}`);
  }
});

test('כלל הבנקאי 6: לוקח מול 6 או 7 בלבד', () => {
  for (let third = 0; third <= 9; third++) {
    assert.equal(bankerDraws(6, third), third === 6 || third === 7, `קלף ${third}`);
  }
});

test('כלל הבנקאי 7: עומד תמיד', () => {
  for (let third = 0; third <= 9; third++) assert.equal(bankerDraws(7, third), false);
});

test('טבלת חוקי הבנקאי מסכמת נכון', () => {
  const rows = bankerRuleTable();
  assert.equal(rows.length, 8);
  assert.deepEqual(rows[0].drawsOn, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(rows[3].drawsOn, [0, 1, 2, 3, 4, 5, 6, 7, 9]);
  assert.deepEqual(rows[4].drawsOn, [2, 3, 4, 5, 6, 7]);
  assert.deepEqual(rows[5].drawsOn, [4, 5, 6, 7]);
  assert.deepEqual(rows[6].drawsOn, [6, 7]);
  assert.deepEqual(rows[7].drawsOn, []);
});

test('תשלום שחקן הוא 1:1', () => {
  assert.equal(netPayout(DEFAULT_BACCARAT_RULES, 'player', 100, 5), 100);
});

test('עמלת בנקאי 5%: הימור 100 מזכה ב-95 נטו', () => {
  assert.equal(netPayout(DEFAULT_BACCARAT_RULES, 'banker', 100, 7), 95);
});

test('עמלה אחרת מחושבת לפי ההגדרה', () => {
  const rules: BaccaratRules = { ...DEFAULT_BACCARAT_RULES, commissionRate: 0.04 };
  assert.equal(netPayout(rules, 'banker', 100, 7), 96);
});

test('ללא עמלה: ניצחון בנקאי רגיל משלם מלא, ועם 6 משלם חצי', () => {
  const rules: BaccaratRules = { ...DEFAULT_BACCARAT_RULES, commissionMode: 'noCommission' };
  assert.equal(netPayout(rules, 'banker', 100, 7), 100);
  assert.equal(netPayout(rules, 'banker', 100, 6), 50);
});

test('תשלום תיקו לפי ההגדרה (8:1 או 9:1)', () => {
  assert.equal(netPayout(DEFAULT_BACCARAT_RULES, 'tie', 100, 4), 800);
  assert.equal(netPayout({ ...DEFAULT_BACCARAT_RULES, tiePayout: 9 }, 'tie', 100, 4), 900);
});
