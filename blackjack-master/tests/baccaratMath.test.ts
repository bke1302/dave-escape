import test from 'node:test';
import assert from 'node:assert/strict';
import { baccaratComposition, betMath, bestBet, exactProbabilities } from '../src/baccarat/engine/probability.ts';
import { DEFAULT_BACCARAT_RULES, type BaccaratRules } from '../src/baccarat/engine/rules.ts';
import { runBaccaratSimulation, compareBaccaratBets } from '../src/baccarat/engine/montecarlo.ts';

const RULES: BaccaratRules = { ...DEFAULT_BACCARAT_RULES, decks: 8 };

test('הרכב הנעל: 8 חפיסות = 416 קלפים, 128 מהם בשווי 0', () => {
  const comp = baccaratComposition(8);
  assert.equal(comp.reduce((a, b) => a + b, 0), 416);
  assert.equal(comp[0], 128);
  for (let v = 1; v <= 9; v++) assert.equal(comp[v], 32);
});

test('ההסתברויות מסתכמות ל-1 בדיוק', () => {
  const p = exactProbabilities(8);
  assert.ok(Math.abs(p.player + p.banker + p.tie - 1) < 1e-12);
});

/**
 * ערכי הייחוס המפורסמים למשחק 8 חפיסות:
 * בנקאי 45.8597% · שחקן 44.6247% · תיקו 9.5156%
 */
test('ההסתברויות תואמות את הערכים המפורסמים ל-8 חפיסות', () => {
  const p = exactProbabilities(8);
  assert.ok(Math.abs(p.banker - 0.458597) < 0.00002, `בנקאי: ${p.banker}`);
  assert.ok(Math.abs(p.player - 0.446247) < 0.00002, `שחקן: ${p.player}`);
  assert.ok(Math.abs(p.tie - 0.095156) < 0.00002, `תיקו: ${p.tie}`);
});

test('הבנקאי מנצח יותר מהשחקן — תוצאה של חוקי הקלף השלישי', () => {
  const p = exactProbabilities(8);
  assert.ok(p.banker > p.player);
  assert.ok(p.banker - p.player < 0.02);
});

test('הסתברויות ל-6 חפיסות קרובות אך לא זהות ל-8', () => {
  const six = exactProbabilities(6);
  const eight = exactProbabilities(8);
  assert.ok(Math.abs(six.banker - eight.banker) < 0.001);
  assert.notEqual(six.tie, eight.tie);
});

test('יתרון הבית תואם את הערכים המפורסמים (עמלה 5%, תיקו 8:1)', () => {
  const math = betMath(RULES);
  const player = math.find((m) => m.bet === 'player')!;
  const banker = math.find((m) => m.bet === 'banker')!;
  const tie = math.find((m) => m.bet === 'tie')!;
  assert.ok(Math.abs(player.houseEdge - 0.012351) < 0.0001, `שחקן: ${player.houseEdge}`);
  assert.ok(Math.abs(banker.houseEdge - 0.010579) < 0.0001, `בנקאי: ${banker.houseEdge}`);
  assert.ok(Math.abs(tie.houseEdge - 0.143596) < 0.0002, `תיקו: ${tie.houseEdge}`);
});

test('תיקו 9:1 מקטין את יתרון הבית לכ-4.84%', () => {
  const tie = betMath({ ...RULES, tiePayout: 9 }).find((m) => m.bet === 'tie')!;
  assert.ok(Math.abs(tie.houseEdge - 0.04844) < 0.0002, `${tie.houseEdge}`);
});

test('ללא עמלה (בנקאי עם 6 משלם חצי) מייקר את הימור הבנקאי', () => {
  const withCommission = betMath(RULES).find((m) => m.bet === 'banker')!;
  const without = betMath({ ...RULES, commissionMode: 'noCommission' }).find((m) => m.bet === 'banker')!;
  assert.ok(without.houseEdge > withCommission.houseEdge);
  assert.ok(Math.abs(without.houseEdge - 0.014581) < 0.0002, `${without.houseEdge}`);
});

test('עמלה נמוכה יותר משפרת את הימור הבנקאי', () => {
  const standard = betMath(RULES).find((m) => m.bet === 'banker')!;
  const cheap = betMath({ ...RULES, commissionRate: 0.02 }).find((m) => m.bet === 'banker')!;
  assert.ok(cheap.houseEdge < standard.houseEdge);
});

test('הימור הבנקאי הוא הטוב ביותר בחוקים הסטנדרטיים', () => {
  assert.equal(bestBet(RULES).bet, 'banker');
});

test('יתרון הבית על הימורים שהוכרעו גבוה מזה שכולל תיקו', () => {
  for (const m of betMath(RULES)) {
    if (m.bet === 'tie') continue;
    assert.ok(m.houseEdgeResolved > m.houseEdge);
  }
});

test('סטיית התקן של הימור תיקו גבוהה בהרבה', () => {
  const math = betMath(RULES);
  const tie = math.find((m) => m.bet === 'tie')!;
  const banker = math.find((m) => m.bet === 'banker')!;
  assert.ok(tie.standardDeviation > banker.standardDeviation * 2);
});

test('הסימולציה מתלכדת עם החישוב המדויק', () => {
  const exact = betMath(RULES);
  for (const bet of ['player', 'banker'] as const) {
    const r = runBaccaratSimulation({
      hands: 300000,
      rules: RULES,
      bet,
      method: 'flat',
      baseBet: 10,
      maxBet: 1000,
      bankroll: 1e7,
      seed: 12345,
    });
    const expected = exact.find((m) => m.bet === bet)!.houseEdge;
    const se = r.sdPerHand / Math.sqrt(r.hands);
    assert.ok(
      Math.abs(r.houseEdge - expected) < 4 * se,
      `${bet}: סימולציה ${(r.houseEdge * 100).toFixed(3)}% מול חישוב ${(expected * 100).toFixed(3)}%`,
    );
  }
});

test('שיעורי התוצאות בסימולציה תואמים את ההסתברויות', () => {
  const p = exactProbabilities(8);
  const r = runBaccaratSimulation({
    hands: 200000,
    rules: RULES,
    bet: 'banker',
    method: 'flat',
    baseBet: 10,
    maxBet: 100,
    bankroll: 1e7,
    seed: 777,
  });
  assert.ok(Math.abs(r.bankerResults / r.hands - p.banker) < 0.005);
  assert.ok(Math.abs(r.playerResults / r.hands - p.player) < 0.005);
  assert.ok(Math.abs(r.tieResults / r.hands - p.tie) < 0.005);
});

test('אותו זרע נותן תוצאה זהה', () => {
  const config = { hands: 5000, rules: RULES, bet: 'banker' as const, method: 'flat' as const, baseBet: 10, maxBet: 100, bankroll: 10000, seed: 5 };
  assert.equal(runBaccaratSimulation(config).profit, runBaccaratSimulation(config).profit);
});

test('שיטות הימור פרוגרסיביות אינן משנות מהותית את יתרון הבית', () => {
  const base = { hands: 100000, rules: RULES, bet: 'banker' as const, baseBet: 10, maxBet: 2000, bankroll: 1e7, seed: 31 };
  const flat = runBaccaratSimulation({ ...base, method: 'flat' });
  const martingale = runBaccaratSimulation({ ...base, method: 'martingale' });
  assert.ok(Math.abs(flat.houseEdge - martingale.houseEdge) < 0.01, 'התוחלת נשארת דומה');
  assert.ok(martingale.maxDrawdown > flat.maxDrawdown, 'אבל הסיכון גדל');
  assert.ok(martingale.averageBet > flat.averageBet);
});

test('עצירה בחורבן עובדת', () => {
  const r = runBaccaratSimulation({
    hands: 100000,
    rules: RULES,
    bet: 'tie',
    method: 'flat',
    baseBet: 50,
    maxBet: 100,
    bankroll: 200,
    seed: 3,
    stopOnRuin: true,
  });
  assert.equal(r.ruined, true);
  assert.ok(r.endingBankroll <= 0);
  assert.ok(r.hands < 100000);
});

test('השוואת הימורים מחזירה תוצאה לכל אחד', () => {
  const results = compareBaccaratBets(
    { hands: 3000, rules: RULES, method: 'flat', baseBet: 10, maxBet: 100, bankroll: 10000, seed: 8 },
    ['player', 'banker', 'tie'],
  );
  assert.equal(results.length, 3);
  assert.equal(results[1].bet, 'banker');
  for (const r of results) {
    assert.equal(r.wins + r.losses + r.pushes, r.hands);
    assert.ok(r.totalWagered > 0);
  }
});

test('תיקו מוחזר כ-push בהימור שחקן/בנקאי', () => {
  const r = runBaccaratSimulation({
    hands: 50000,
    rules: RULES,
    bet: 'player',
    method: 'flat',
    baseBet: 10,
    maxBet: 100,
    bankroll: 1e6,
    seed: 21,
  });
  assert.equal(r.pushes, r.tieResults, 'כל תיקו הוא החזר');
});
