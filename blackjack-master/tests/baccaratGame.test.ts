import test from 'node:test';
import assert from 'node:assert/strict';
import type { Card, Rank } from '../src/engine/cards.ts';
import { createRng } from '../src/engine/rng.ts';
import { BaccaratGame, resolveFromValues } from '../src/baccarat/engine/game.ts';
import { DEFAULT_BACCARAT_RULES, type BaccaratRules } from '../src/baccarat/engine/rules.ts';
import { handTotal } from '../src/baccarat/engine/hand.ts';
import { BigRoad, beadPlate, summarize } from '../src/baccarat/engine/road.ts';

function card(rank: Rank): Card {
  return { rank, suit: 'spades', id: `${rank}-${Math.random()}` };
}

/** מנוע עם נעל מבוימת — סדר הקלפים נקבע מראש לבדיקת תרחישים מדויקים. */
function stacked(sequence: Rank[], rules: Partial<BaccaratRules> = {}): BaccaratGame {
  const game = new BaccaratGame({ ...DEFAULT_BACCARAT_RULES, ...rules });
  let i = 0;
  const cards = sequence.map(card);
  game.shoe.draw = () => cards[i++] ?? card('5');
  return game;
}

test('סדר החלוקה: שחקן, בנקאי, שחקן, בנקאי', () => {
  // שחקן: 2+4 = 6 (עומד) · בנקאי: 3+3 = 6 (עומד)
  const game = stacked(['2', '3', '4', '3']);
  const round = game.playRound();
  assert.equal(round.playerCards.length, 2);
  assert.equal(round.bankerCards.length, 2);
  assert.equal(round.playerTotal, 6);
  assert.equal(round.bankerTotal, 6);
  assert.equal(round.outcome, 'tie');
});

test('Natural 9 מסיים את היד מיד', () => {
  // שחקן: 4+5 = 9 · בנקאי: 3+3 = 6
  const game = stacked(['4', '3', '5', '3', '7']);
  const round = game.playRound();
  assert.equal(round.natural, true);
  assert.equal(round.playerCards.length, 2, 'אין קלף שלישי ב-Natural');
  assert.equal(round.bankerCards.length, 2);
  assert.equal(round.outcome, 'player');
});

test('Natural 8 של הבנקאי מנצח 7 של השחקן', () => {
  // שחקן: 3+4 = 7 · בנקאי: 5+3 = 8
  const game = stacked(['3', '5', '4', '3']);
  const round = game.playRound();
  assert.equal(round.natural, true);
  assert.equal(round.bankerTotal, 8);
  assert.equal(round.outcome, 'banker');
});

test('שני Naturals שווים = תיקו', () => {
  // שחקן: 4+4 = 8 · בנקאי: 6+2 = 8
  const game = stacked(['4', '6', '4', '2']);
  const round = game.playRound();
  assert.equal(round.natural, true);
  assert.equal(round.outcome, 'tie');
});

test('השחקן לוקח קלף שלישי בסכום 5 ומטה', () => {
  // שחקן: 2+3 = 5 → לוקח · בנקאי: 3+3 = 6 · קלף שלישי לשחקן: 4 → 9
  const game = stacked(['2', '3', '3', '3', '4']);
  const round = game.playRound();
  assert.equal(round.playerDrew, true);
  assert.equal(round.playerCards.length, 3);
  assert.equal(round.playerThirdValue, 4);
  assert.equal(round.playerTotal, 9);
  assert.equal(round.bankerDrew, false, 'בנקאי 6 מול קלף שלישי 4 — עומד');
  assert.equal(round.outcome, 'player');
});

test('השחקן עומד על 6 והבנקאי משחק לפי הכלל הפשוט', () => {
  // שחקן: 2+4 = 6 (עומד) · בנקאי: 2+2 = 4 → לוקח 3 → 7
  const game = stacked(['2', '2', '4', '2', '3']);
  const round = game.playRound();
  assert.equal(round.playerDrew, false);
  assert.equal(round.bankerDrew, true);
  assert.equal(round.bankerTotal, 7);
  assert.equal(round.outcome, 'banker');
});

test('אף אחד לא לוקח קלף שלישי כששניהם ב-6/7', () => {
  // שחקן: 3+3 = 6 · בנקאי: 4+3 = 7
  const game = stacked(['3', '4', '3', '3']);
  const round = game.playRound();
  assert.equal(round.playerDrew, false);
  assert.equal(round.bankerDrew, false);
  assert.equal(round.playerCards.length, 2);
  assert.equal(round.bankerCards.length, 2);
  assert.equal(round.outcome, 'banker');
});

test('בנקאי 3 מול קלף שלישי 8 — לא לוקח', () => {
  // שחקן: 2+2 = 4 → לוקח 8 → 2 · בנקאי: 2+A = 3 → לפי הכלל עומד
  const game = stacked(['2', '2', '2', 'A', '8']);
  const round = game.playRound();
  assert.equal(round.playerThirdValue, 8);
  assert.equal(round.playerTotal, 2);
  assert.equal(round.bankerTotal, 3);
  assert.equal(round.bankerDrew, false);
  assert.equal(round.outcome, 'banker');
});

test('בנקאי 6 מול קלף שלישי 7 — לוקח', () => {
  // שחקן: A+2 = 3 → לוקח 7 → 0 · בנקאי: 3+3 = 6 → לוקח 2 → 8
  const game = stacked(['A', '3', '2', '3', '7', '2']);
  const round = game.playRound();
  assert.equal(round.playerThirdValue, 7);
  assert.equal(round.bankerDrew, true);
  assert.equal(round.bankerTotal, 8);
  assert.equal(round.outcome, 'banker');
});

test('בנקאי 7 עומד גם כשהשחקן לקח קלף', () => {
  // שחקן: 2+2 = 4 → לוקח 5 → 9 · בנקאי: 3+4 = 7 → עומד
  const game = stacked(['2', '3', '2', '4', '5']);
  const round = game.playRound();
  assert.equal(round.bankerDrew, false);
  assert.equal(round.bankerTotal, 7);
  assert.equal(round.outcome, 'player');
});

test('קלפי עשר שווים 0 ומשפיעים על הסכום', () => {
  // שחקן: K+K = 0 → לוקח 9 → 9 · בנקאי: Q+5 = 5 → לוקח? מול קלף 9: לא
  const game = stacked(['K', 'Q', 'K', '5', '9']);
  const round = game.playRound();
  assert.equal(round.playerTotal, 9);
  assert.equal(round.bankerTotal, 5);
  assert.equal(round.bankerDrew, false, 'בנקאי 5 מול קלף שלישי 9 — עומד');
  assert.equal(round.outcome, 'player');
});

test('הסדר חשבונות: הימור שחקן', () => {
  const game = stacked(['4', '3', '5', '3']);
  const round = game.playRound();
  assert.equal(game.settleBet('player', 100, round), 100);
  assert.equal(game.settleBet('banker', 100, round), -100);
  assert.equal(game.settleBet('tie', 100, round), -100);
});

test('הסדר חשבונות: ניצחון בנקאי עם עמלה', () => {
  const game = stacked(['3', '5', '4', '3']);
  const round = game.playRound();
  assert.equal(round.outcome, 'banker');
  assert.equal(game.settleBet('banker', 100, round), 95);
  assert.equal(game.settleBet('player', 100, round), -100);
});

test('הסדר חשבונות: תיקו מחזיר הימורי שחקן ובנקאי ומשלם 8:1 על תיקו', () => {
  const game = stacked(['4', '6', '4', '2']);
  const round = game.playRound();
  assert.equal(round.outcome, 'tie');
  assert.equal(game.settleBet('player', 100, round), 0, 'הימור חוזר');
  assert.equal(game.settleBet('banker', 100, round), 0, 'הימור חוזר');
  assert.equal(game.settleBet('tie', 100, round), 800);
});

test('ללא עמלה: ניצחון בנקאי עם 6 משלם חצי', () => {
  // שחקן: 2+3 = 5 → לוקח K(0) → 5 · בנקאי: 3+3 = 6 → מול קלף 0 עומד → בנקאי מנצח עם 6
  const game = stacked(['2', '3', '3', '3', 'K'], { commissionMode: 'noCommission' });
  const round = game.playRound();
  assert.equal(round.bankerTotal, 6);
  assert.equal(round.outcome, 'banker');
  assert.equal(game.settleBet('banker', 100, round), 50);
});

test('resolveFromValues מחשב תוצאה מערכים', () => {
  assert.deepEqual(resolveFromValues([4, 2], [7, 1]), { playerTotal: 6, bankerTotal: 8, outcome: 'banker' });
  assert.deepEqual(resolveFromValues([9, 9], [4, 4]), { playerTotal: 8, bankerTotal: 8, outcome: 'tie' });
});

test('סיבובים רבים מנעל אמיתית — כל יד חוקית', () => {
  const game = new BaccaratGame(DEFAULT_BACCARAT_RULES, createRng(4242));
  for (let i = 0; i < 3000; i++) {
    const round = game.playRound();
    assert.ok(round.playerCards.length === 2 || round.playerCards.length === 3);
    assert.ok(round.bankerCards.length === 2 || round.bankerCards.length === 3);
    assert.equal(handTotal(round.playerCards), round.playerTotal);
    assert.equal(handTotal(round.bankerCards), round.bankerTotal);
    assert.ok(round.playerTotal >= 0 && round.playerTotal <= 9);
    assert.ok(round.bankerTotal >= 0 && round.bankerTotal <= 9);
    if (round.natural) {
      assert.equal(round.playerCards.length, 2);
      assert.equal(round.bankerCards.length, 2);
    }
  }
});

test('Big Road: עמודה לכל רצף', () => {
  const road = new BigRoad();
  for (const o of ['player', 'player', 'banker', 'player', 'player', 'player'] as const) road.add(o);
  assert.equal(road.columns.length, 3);
  assert.equal(road.columns[0].length, 2);
  assert.equal(road.columns[1].length, 1);
  assert.equal(road.columns[2].length, 3);
  assert.equal(road.longestStreak, 3);
  assert.equal(road.currentStreak, 3);
});

test('Big Road: תיקו מסומן על התא האחרון ואינו פותח עמודה', () => {
  const road = new BigRoad();
  road.add('player');
  road.add('tie');
  road.add('tie');
  assert.equal(road.columns.length, 1);
  assert.equal(road.lastCell()?.ties, 2);
  road.add('banker');
  assert.equal(road.columns.length, 2);
  assert.equal(road.lastCell()?.ties, 0);
});

test('Big Road: תיקו לפני התוצאה הראשונה נשמר ומוצמד לתא הראשון', () => {
  const road = new BigRoad();
  road.add('tie');
  road.add('tie');
  assert.equal(road.columns.length, 0);
  road.add('banker');
  assert.equal(road.columns[0][0].ties, 2);
});

test('Big Road: רצף ארוך מ-6 מתעקל ימינה (זנב דרקון)', () => {
  const road = new BigRoad();
  for (let i = 0; i < 9; i++) road.add('banker');
  assert.equal(road.columns.length, 1);
  assert.equal(road.columns[0].length, 9);
  const grid = road.grid(12, 6);
  const occupied = grid.flat().filter(Boolean).length;
  assert.equal(occupied, 9, 'כל התשע מוצגות ברשת');
  assert.ok(grid[5][0], 'השורה השישית בעמודה הראשונה מלאה');
  assert.ok(grid[5][1], 'ההמשך עובר ימינה באותה שורה');
});

test('לוח חרוזים מסדר תוצאות לפי סדר בעמודות של 6', () => {
  const history = ['player', 'banker', 'tie', 'player', 'banker', 'banker', 'player'] as const;
  const grid = beadPlate([...history], 12, 6);
  assert.equal(grid[0][0], 'player');
  assert.equal(grid[1][0], 'banker');
  assert.equal(grid[2][0], 'tie');
  assert.equal(grid[5][0], 'banker');
  assert.equal(grid[0][1], 'player', 'התוצאה השביעית עוברת לעמודה הבאה');
});

test('סיכום היסטוריה סופר נכון', () => {
  const s = summarize(['player', 'banker', 'banker', 'tie', 'banker']);
  assert.equal(s.total, 5);
  assert.equal(s.player, 1);
  assert.equal(s.banker, 3);
  assert.equal(s.tie, 1);
  assert.equal(s.longestStreak, 3);
  assert.equal(s.currentResult, 'banker');
});
