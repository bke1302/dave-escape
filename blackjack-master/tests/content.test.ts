import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, lessonById } from '../src/content/lessons.ts';
import { ACHIEVEMENTS, LEVELS, checkAchievements, currentLevel, levelComplete, levelProgress, levelUnlocked } from '../src/content/progression.ts';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS, DEFAULT_STATS, type AppState } from '../src/state/appState.ts';

const HEBREW = /[֐-׿]/;

function emptyState(): AppState {
  return {
    settings: { ...DEFAULT_SETTINGS },
    stats: { ...DEFAULT_STATS, trainers: { ...DEFAULT_STATS.trainers } },
    progress: { ...DEFAULT_PROGRESS, lessons: {}, achievements: {} },
  };
}

test('הקורס כולל 15 פרקים ממוספרים', () => {
  assert.equal(LESSONS.length, 15);
  LESSONS.forEach((lesson, i) => assert.equal(lesson.index, i + 1));
  assert.equal(new Set(LESSONS.map((l) => l.id)).size, 15);
});

test('כל שיעור כולל הסבר, דוגמה, תרגיל ושאלת מבחן — הכל בעברית', () => {
  for (const lesson of LESSONS) {
    assert.match(lesson.title, HEBREW);
    assert.ok(lesson.sections.length >= 1, `${lesson.id}: אין סעיפי הסבר`);
    for (const section of lesson.sections) {
      assert.match(section.heading, HEBREW);
      assert.ok(section.body.length >= 1);
      for (const p of section.body) assert.match(p, HEBREW);
    }
    assert.ok(lesson.example.lines.length >= 2, `${lesson.id}: דוגמה חסרה`);
    assert.ok(lesson.quiz.length >= 1, `${lesson.id}: אין שאלות מבחן`);
    assert.match(lesson.exercise.question, HEBREW);
    assert.match(lesson.exercise.explanation, HEBREW);
  }
});

test('לכל שאלה יש תשובה נכונה בתחום חוקי', () => {
  for (const lesson of LESSONS) {
    const questions = [lesson.exercise, ...lesson.quiz];
    for (const q of questions) {
      assert.ok(q.options.length >= 2, `${lesson.id}: פחות משתי אפשרויות`);
      assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `${lesson.id}: אינדקס תשובה לא חוקי`);
      assert.equal(new Set(q.options).size, q.options.length, `${lesson.id}: אפשרויות כפולות`);
    }
  }
});

test('איתור שיעור לפי מזהה', () => {
  assert.equal(lessonById('card-counting')?.index, 15);
  assert.equal(lessonById('no-such-lesson'), undefined);
});

test('10 רמות עם דרישות מדידות', () => {
  assert.equal(LEVELS.length, 10);
  LEVELS.forEach((level, i) => {
    assert.equal(level.level, i + 1);
    assert.ok(level.requirements.length >= 1);
    assert.match(level.title, HEBREW);
    for (const req of level.requirements) {
      assert.ok(req.target > 0);
      assert.match(req.label, HEBREW);
    }
  });
});

test('משתמש חדש נמצא ברמה 1 ורק היא פתוחה', () => {
  const s = emptyState();
  assert.equal(currentLevel(s).level, 1);
  assert.equal(levelUnlocked(LEVELS[0], s), true);
  assert.equal(levelUnlocked(LEVELS[1], s), false);
  assert.equal(levelProgress(LEVELS[0], s), 0);
});

test('השלמת דרישות מקדמת רמה ופותחת את הבאה', () => {
  const s = emptyState();
  for (const id of ['what-is-blackjack', 'card-values', 'how-to-win']) {
    s.progress.lessons[id] = { completed: true, bestScore: 100 };
  }
  assert.equal(levelComplete(LEVELS[0], s), true);
  assert.equal(levelUnlocked(LEVELS[1], s), true);
  assert.equal(currentLevel(s).level, 2);
});

test('הישגים ננעלים ונפתחים לפי הנתונים', () => {
  const s = emptyState();
  assert.equal(checkAchievements(s).length, 0);
  s.stats.handsPlayed = 100;
  const unlocked = checkAchievements(s).map((a) => a.id);
  assert.ok(unlocked.includes('first-hand'));
  assert.ok(unlocked.includes('hands-100'));
  assert.ok(!unlocked.includes('hands-1000'));
});

test('הישג שכבר נפתח אינו מדווח שוב', () => {
  const s = emptyState();
  s.stats.handsPlayed = 100;
  s.progress.achievements['first-hand'] = Date.now();
  const unlocked = checkAchievements(s).map((a) => a.id);
  assert.ok(!unlocked.includes('first-hand'));
  assert.ok(unlocked.includes('hands-100'));
});

test('לכל הישג תיאור בעברית ומזהה ייחודי', () => {
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
  for (const a of ACHIEVEMENTS) {
    assert.match(a.title, HEBREW);
    assert.match(a.description, HEBREW);
  }
});
