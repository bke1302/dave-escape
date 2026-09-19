import test from 'node:test';
import assert from 'node:assert/strict';
import { compareStrategies, runSimulation, STRATEGY_LABEL_HE, type SimConfig } from '../src/engine/montecarlo.ts';
import { DEFAULT_RULES } from '../src/engine/rules.ts';

function config(patch: Partial<SimConfig> = {}): SimConfig {
  return {
    hands: 20000,
    rules: DEFAULT_RULES,
    strategy: 'basic',
    baseBet: 10,
    bankroll: 10000,
    spread: { unit: 10, maxUnits: 8 },
    seed: 424242,
    ...patch,
  };
}

test('הסימולציה מחזירה נתונים עקביים', () => {
  const r = runSimulation(config());
  assert.equal(r.totalRounds, 20000);
  assert.ok(r.totalHands >= r.totalRounds, 'פיצולים מגדילים את מספר הידיים');
  assert.equal(r.wins + r.losses + r.pushes + r.surrenders, r.totalHands);
  assert.ok(Math.abs(r.winRate + r.lossRate + r.pushRate + r.surrenders / r.totalHands - 1) < 1e-9);
  assert.ok(r.totalWagered > 0);
  assert.ok(r.shuffles > 0);
});

test('אותו זרע מפיק בדיוק את אותה תוצאה', () => {
  const a = runSimulation(config({ hands: 5000 }));
  const b = runSimulation(config({ hands: 5000 }));
  assert.equal(a.totalProfit, b.totalProfit);
  assert.equal(a.wins, b.wins);
  assert.equal(a.sdPerHand, b.sdPerHand);
});

test('זרעים שונים מפיקים תוצאות שונות', () => {
  const a = runSimulation(config({ hands: 5000, seed: 1 }));
  const b = runSimulation(config({ hands: 5000, seed: 2 }));
  assert.notEqual(a.totalProfit, b.totalProfit);
});

test('אסטרטגיה בסיסית מגיעה ליתרון בית סביר', () => {
  const r = runSimulation(config({ hands: 200000 }));
  const edge = -r.evPerHandUnits;
  assert.ok(edge > 0 && edge < 0.015, `יתרון בית שנמדד: ${(edge * 100).toFixed(2)}%`);
});

test('משחק אקראי גרוע משמעותית מאסטרטגיה בסיסית', () => {
  const basic = runSimulation(config({ hands: 30000, strategy: 'basic' }));
  const random = runSimulation(config({ hands: 30000, strategy: 'random' }));
  assert.ok(random.evPerHandUnits < basic.evPerHandUnits - 0.05, 'הפער חייב להיות מובהק');
});

test('סטיית התקן ליד קרובה לערך התיאורטי', () => {
  const r = runSimulation(config({ hands: 100000 }));
  assert.ok(r.sdPerHand > 1.0 && r.sdPerHand < 1.35, `סטיית תקן: ${r.sdPerHand}`);
});

test('שיעור בלאק ג׳ק קרוב ל-4.7%', () => {
  const r = runSimulation(config({ hands: 100000 }));
  assert.ok(Math.abs(r.blackjackRate - 0.0475) < 0.006, `שיעור: ${(r.blackjackRate * 100).toFixed(2)}%`);
});

test('אסטרטגיית ספירה מגדילה את ההימור הממוצע ואת השונות', () => {
  const basic = runSimulation(config({ hands: 60000, strategy: 'basic' }));
  const counting = runSimulation(config({ hands: 60000, strategy: 'counting' }));
  assert.ok(counting.averageBet > basic.averageBet, 'ספירה מעלה הימור בספירות גבוהות');
  assert.ok(counting.sdPerHand > basic.sdPerHand, 'פריסת הימורים מגדילה שונות');
});

test('ספירה משפרת את התוחלת ליד לעומת אסטרטגיה בסיסית בלבד', () => {
  const basic = runSimulation(config({ hands: 400000, strategy: 'basic' }));
  const counting = runSimulation(config({ hands: 400000, strategy: 'countingDeviations' }));
  assert.ok(counting.evPerHandUnits > basic.evPerHandUnits, `${counting.evPerHandUnits} מול ${basic.evPerHandUnits}`);
});

test('מדדי ירידת שיא ורצפים הגיוניים', () => {
  const r = runSimulation(config({ hands: 30000 }));
  assert.ok(r.maxDrawdown >= 0);
  assert.ok(r.longestLoseStreak > 3 && r.longestLoseStreak < 40);
  assert.ok(r.longestWinStreak > 3 && r.longestWinStreak < 40);
  assert.ok(r.peakBankroll >= r.finalBankroll - 1e-9 || r.peakBankroll >= r.config.bankroll);
});

test('עצירה בחורבן עובדת', () => {
  const r = runSimulation(config({ hands: 200000, bankroll: 60, baseBet: 10, stopOnRuin: true, strategy: 'random' }));
  assert.equal(r.ruined, true);
  assert.ok(r.totalRounds < 200000);
  assert.ok(r.finalBankroll <= 0);
});

test('סיכון החורבן מחושב מהתוצאות שנמדדו', () => {
  const r = runSimulation(config({ hands: 20000 }));
  assert.ok(r.riskOfRuin >= 0 && r.riskOfRuin <= 1);
  assert.equal(r.riskOfRuin, 1, 'בתוחלת שלילית הסיכון הוא 1');
});

test('השוואת אסטרטגיות מחזירה תוצאה לכל אסטרטגיה', () => {
  const results = compareStrategies({ ...config({ hands: 4000 }) }, ['random', 'basic', 'counting']);
  assert.equal(results.length, 3);
  assert.equal(results[0].config.strategy, 'random');
  assert.equal(results[1].config.strategy, 'basic');
  assert.equal(results[2].config.strategy, 'counting');
  for (const r of results) assert.ok(STRATEGY_LABEL_HE[r.config.strategy].length > 0);
});

test('דיווח ההתקדמות נקרא במהלך הריצה', () => {
  let calls = 0;
  runSimulation(config({ hands: 5000 }), () => {
    calls++;
  });
  assert.ok(calls > 0);
});

test('דגימות ההון נשמרות לגרף', () => {
  const r = runSimulation(config({ hands: 10000 }));
  assert.ok(r.bankrollSamples.length > 10 && r.bankrollSamples.length <= 220);
  assert.equal(r.bankrollSamples[r.bankrollSamples.length - 1], r.finalBankroll);
});
