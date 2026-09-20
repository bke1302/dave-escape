import test from 'node:test';
import assert from 'node:assert/strict';
import { appStore, recordAnswer, recordRound, state, updateRules, updateSettings } from '../src/state/appState.ts';
import {
  adaptiveHint,
  baccarat,
  baccaratOverallAccuracy,
  DEFAULT_BACCARAT_STATE,
  recordBaccaratAnswer,
  recordBaccaratHand,
  resetBaccaratProgress,
  resetBaccaratSession,
  updateBaccarat,
  updateBaccaratRules,
} from '../src/baccarat/state.ts';
import { BACCARAT_LEVELS, baccaratCurrentLevel, baccaratLevelComplete, baccaratOverallProgress, checkBaccaratAchievements } from '../src/baccarat/content/progression.ts';
import { BACCARAT_LESSONS } from '../src/baccarat/content/lessons.ts';

const HEBREW = /[֐-׿]/;

test('מצב באקרה מתחיל בברירת מחדל גם כשלא נשמר דבר', () => {
  const b = baccarat();
  assert.equal(b.handsPlayed, 0);
  assert.equal(b.bankroll, DEFAULT_BACCARAT_STATE.bankroll);
  assert.equal(b.rules.decks, 8);
  assert.equal(b.rules.commissionRate, 0.05);
});

test('שינוי מצב הבאקרה אינו נוגע במצב הבלאק ג׳ק', () => {
  // מצב התחלתי של הבלאק ג'ק
  updateSettings({ startingBankroll: 2500 });
  updateRules({ decks: 2, dealerHitsSoft17: true });
  recordRound(-50, 1);
  recordAnswer('strategy', true, 1200);
  const before = JSON.parse(JSON.stringify({ settings: state().settings, stats: state().stats, progress: state().progress }));

  // פעילות ענפה בצד הבאקרה
  updateBaccaratRules({ decks: 6, tiePayout: 9 });
  recordBaccaratAnswer('thirdCard', true, 800);
  recordBaccaratHand('banker', 100, 95, 'banker');
  updateBaccarat({ xp: 500 });

  const after = { settings: state().settings, stats: state().stats, progress: state().progress };
  assert.deepEqual(after.settings, before.settings, 'ההגדרות של הבלאק ג׳ק לא השתנו');
  assert.deepEqual(after.stats, before.stats, 'הסטטיסטיקות של הבלאק ג׳ק לא השתנו');
  assert.deepEqual(after.progress, before.progress, 'ההתקדמות בבלאק ג׳ק לא השתנתה');
  assert.equal(state().settings.rules.decks, 2, 'חוקי הבלאק ג׳ק נשמרו');
  assert.equal(baccarat().rules.decks, 6, 'חוקי הבאקרה עודכנו בנפרד');
});

test('שינוי מצב הבלאק ג׳ק אינו נוגע במצב הבאקרה', () => {
  const before = JSON.parse(JSON.stringify(baccarat()));
  updateSettings({ sound: false });
  recordRound(120, 2);
  recordAnswer('runningCount', false, 900);
  assert.deepEqual(baccarat(), before, 'מצב הבאקרה נשאר זהה');
});

test('רישום יד באקרה מעדכן הון, רצפים וירידת שיא', () => {
  resetBaccaratProgress();
  recordBaccaratHand('banker', 100, 95, 'banker');
  recordBaccaratHand('player', 100, -100, 'banker');
  recordBaccaratHand('player', 100, -100, 'banker');
  const b = baccarat();
  assert.equal(b.handsPlayed, 3);
  assert.equal(b.betsBanker, 1);
  assert.equal(b.betsPlayer, 2);
  assert.equal(b.wins, 1);
  assert.equal(b.losses, 2);
  assert.equal(b.bankroll, 1000 + 95 - 200);
  assert.equal(b.longestLoseStreak, 2);
  assert.equal(b.peakBankroll, 1095);
  assert.equal(b.maxDrawdown, 200);
  assert.equal(b.outcomes.length, 3);
});

test('תיקו נרשם כהחזר ולא כניצחון או הפסד', () => {
  resetBaccaratProgress();
  recordBaccaratHand('banker', 100, 0, 'tie');
  const b = baccarat();
  assert.equal(b.pushes, 1);
  assert.equal(b.wins, 0);
  assert.equal(b.losses, 0);
  assert.equal(b.bankroll, 1000);
});

test('איפוס מפגש מחזיר הון ושומר סטטיסטיקות מצטברות', () => {
  resetBaccaratProgress();
  recordBaccaratHand('banker', 100, -100, 'player');
  resetBaccaratSession();
  const b = baccarat();
  assert.equal(b.bankroll, b.startingBankroll);
  assert.equal(b.sessionNet, 0);
  assert.equal(b.handsPlayed, 1, 'מספר הידיים המצטבר נשמר');
  assert.equal(b.netProfit, -100, 'התוצאה המצטברת נשמרת');
});

test('איפוס באקרה אינו מוחק את נתוני הבלאק ג׳ק', () => {
  recordRound(200, 1);
  const bjBefore = JSON.parse(JSON.stringify(state().stats));
  resetBaccaratProgress();
  assert.deepEqual(state().stats, bjBefore);
  assert.equal(baccarat().handsPlayed, 0);
});

test('דיוק כולל מחושב על כל התחומים', () => {
  resetBaccaratProgress();
  recordBaccaratAnswer('thirdCard', true);
  recordBaccaratAnswer('thirdCard', false);
  recordBaccaratAnswer('handValue', true);
  recordBaccaratAnswer('handValue', true);
  assert.equal(baccaratOverallAccuracy(baccarat()), 0.75);
});

test('למידה מסתגלת מזהה את התחום החלש', () => {
  resetBaccaratProgress();
  for (let i = 0; i < 8; i++) recordBaccaratAnswer('handValue', true);
  for (let i = 0; i < 8; i++) recordBaccaratAnswer('thirdCard', i < 2);
  const hint = adaptiveHint(baccarat());
  assert.equal(hint.domain, 'thirdCard');
  assert.match(hint.message, HEBREW);
  assert.ok(hint.difficulty >= 1 && hint.difficulty <= 3);
});

test('למידה מסתגלת מעלה קושי בדיוק גבוה', () => {
  resetBaccaratProgress();
  for (let i = 0; i < 15; i++) recordBaccaratAnswer('thirdCard', true);
  const hint = adaptiveHint(baccarat());
  assert.equal(hint.domain, null);
  assert.equal(hint.difficulty, 3);
});

test('רצף תשובות נכונות נשמר ומתאפס בטעות', () => {
  resetBaccaratProgress();
  recordBaccaratAnswer('quiz', true);
  recordBaccaratAnswer('quiz', true);
  recordBaccaratAnswer('quiz', true);
  assert.equal(baccarat().currentStreak, 3);
  assert.equal(baccarat().bestStreak, 3);
  recordBaccaratAnswer('quiz', false);
  assert.equal(baccarat().currentStreak, 0);
  assert.equal(baccarat().bestStreak, 3);
});

test('14 רמות עם דרישות בעברית', () => {
  assert.equal(BACCARAT_LEVELS.length, 14);
  BACCARAT_LEVELS.forEach((level, i) => {
    assert.equal(level.level, i + 1);
    assert.match(level.title, HEBREW);
    assert.ok(level.requirements.length >= 1);
    for (const req of level.requirements) {
      assert.match(req.label, HEBREW);
      assert.ok(req.target > 0);
    }
  });
});

test('משתמש חדש ברמה 1 והתקדמות אפס', () => {
  resetBaccaratProgress();
  const b = baccarat();
  assert.equal(baccaratCurrentLevel(b).level, 1);
  assert.equal(baccaratOverallProgress(b), 0);
  assert.equal(baccaratLevelComplete(BACCARAT_LEVELS[0], b), false);
});

test('השלמת שיעור מקדמת רמה', () => {
  resetBaccaratProgress();
  updateBaccarat((s) => ({ lessons: { ...s.lessons, 'what-is-baccarat': { completed: true, bestScore: 100 } } }));
  const b = baccarat();
  assert.equal(baccaratLevelComplete(BACCARAT_LEVELS[0], b), true);
  assert.equal(baccaratCurrentLevel(b).level, 2);
});

test('הישגים נפתחים לפי נתונים', () => {
  resetBaccaratProgress();
  assert.equal(checkBaccaratAchievements(baccarat()).length, 0);
  for (let i = 0; i < 100; i++) recordBaccaratHand('banker', 10, 9.5, 'banker');
  const unlocked = checkBaccaratAchievements(baccarat()).map((a) => a.id);
  assert.ok(unlocked.includes('b-first-hand'));
  assert.ok(unlocked.includes('b-hands-100'));
  assert.ok(!unlocked.includes('b-hands-1000'));
});

test('הקורס כולל 14 שיעורים תקינים בעברית', () => {
  assert.equal(BACCARAT_LESSONS.length, 14);
  BACCARAT_LESSONS.forEach((lesson, i) => {
    assert.equal(lesson.index, i + 1);
    assert.match(lesson.title, HEBREW);
    assert.ok(lesson.sections.length >= 1, `${lesson.id}: אין סעיפים`);
    assert.ok(lesson.example.lines.length >= 2, `${lesson.id}: דוגמה חסרה`);
    assert.ok(lesson.quiz.length >= 1, `${lesson.id}: אין מבחן`);
    for (const q of [lesson.exercise, ...lesson.quiz]) {
      assert.ok(q.options.length >= 2);
      assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `${lesson.id}: אינדקס תשובה לא חוקי`);
      assert.equal(new Set(q.options).size, q.options.length, `${lesson.id}: אפשרויות כפולות`);
      assert.match(q.explanation, HEBREW);
    }
  });
  assert.equal(new Set(BACCARAT_LESSONS.map((l) => l.id)).size, 14);
});

test('כל שיעור משויך לרמה קיימת', () => {
  for (const lesson of BACCARAT_LESSONS) {
    assert.ok(lesson.level >= 1 && lesson.level <= BACCARAT_LEVELS.length, `${lesson.id}: רמה ${lesson.level}`);
  }
});

test('מצב שמור ישן ללא באקרה ממשיך לעבוד', () => {
  // מדמה מצב שנשמר לפני הוספת המודול
  appStore.set({ baccarat: undefined } as never);
  const b = baccarat();
  assert.equal(b.handsPlayed, 0);
  assert.equal(b.rules.decks, 8);
  assert.equal(state().settings.rules.decks >= 1, true, 'מצב הבלאק ג׳ק עדיין תקין');
});
