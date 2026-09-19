/** מערכת הרמות וההישגים. */
import { accuracy } from "../state/appState.js";
import { LESSONS } from "./lessons.js";
function lessonsDone(s, ids) {
    return ids.filter((id) => s.progress.lessons[id]?.completed).length;
}
function domainAttempts(s, domain) {
    return s.stats.trainers[domain].attempts;
}
function domainAccuracy(s, domain) {
    return accuracy(s.stats.trainers[domain]);
}
const LEVEL1_LESSONS = ['what-is-blackjack', 'card-values', 'how-to-win'];
const LEVEL2_LESSONS = ['blackjack-hand', 'hit', 'stand', 'double', 'split', 'insurance', 'surrender'];
const LEVEL3_LESSONS = ['house-edge', 'basic-strategy', 'variance'];
export const LEVELS = [
    {
        level: 1,
        title: 'מתחיל',
        subtitle: 'הכרת המשחק',
        icon: '🎓',
        requirements: [
            { id: 'l1-lessons', label: 'השלמת 3 שיעורי פתיחה', target: 3, current: (s) => lessonsDone(s, LEVEL1_LESSONS) },
        ],
        unlocks: ['משחק בלאק ג\'ק', 'שיעורי חוקים'],
    },
    {
        level: 2,
        title: 'חוקי Blackjack',
        subtitle: 'פעולות ומצבים מיוחדים',
        icon: '📘',
        requirements: [
            { id: 'l2-lessons', label: 'השלמת 7 שיעורי החוקים', target: 7, current: (s) => lessonsDone(s, LEVEL2_LESSONS) },
            { id: 'l2-hands', label: 'שחק 20 ידיים', target: 20, current: (s) => s.stats.handsPlayed },
        ],
        unlocks: ['מאמן אסטרטגיה בסיסית'],
    },
    {
        level: 3,
        title: 'אסטרטגיה בסיסית',
        subtitle: 'ההחלטה הנכונה בכל יד',
        icon: '🧠',
        requirements: [
            { id: 'l3-lessons', label: 'השלמת שיעורי אסטרטגיה', target: 3, current: (s) => lessonsDone(s, LEVEL3_LESSONS) },
            { id: 'l3-drills', label: '50 תרגילי אסטרטגיה', target: 50, current: (s) => domainAttempts(s, 'strategy') },
            { id: 'l3-acc', label: 'דיוק 80% באסטרטגיה', target: 0.8, current: (s) => domainAccuracy(s, 'strategy'), format: 'percent' },
        ],
        unlocks: ['אימון ספירת קלפים'],
    },
    {
        level: 4,
        title: 'ספירה רצה',
        subtitle: 'Hi-Lo מהיר ומדויק',
        icon: '🃏',
        requirements: [
            { id: 'l4-lesson', label: 'השלמת שיעור ספירת קלפים', target: 1, current: (s) => lessonsDone(s, ['card-counting']) },
            { id: 'l4-drills', label: '30 תרגילי ספירה רצה', target: 30, current: (s) => domainAttempts(s, 'runningCount') },
            { id: 'l4-acc', label: 'דיוק 85% בספירה רצה', target: 0.85, current: (s) => domainAccuracy(s, 'runningCount'), format: 'percent' },
        ],
        unlocks: ['אימון ספירה אמיתית'],
    },
    {
        level: 5,
        title: 'ספירה אמיתית',
        subtitle: 'True Count והערכת חפיסות',
        icon: '📐',
        requirements: [
            { id: 'l5-tc', label: '30 תרגילי ספירה אמיתית', target: 30, current: (s) => domainAttempts(s, 'trueCount') },
            { id: 'l5-tc-acc', label: 'דיוק 80% בספירה אמיתית', target: 0.8, current: (s) => domainAccuracy(s, 'trueCount'), format: 'percent' },
            { id: 'l5-deck', label: '20 תרגילי הערכת חפיסות', target: 20, current: (s) => domainAttempts(s, 'deckEstimation') },
        ],
        unlocks: ['מאמן הימורים'],
    },
    {
        level: 6,
        title: 'הימורים',
        subtitle: 'פריסת הימורים וניהול הון',
        icon: '💰',
        requirements: [
            { id: 'l6-lesson', label: 'השלמת שיעור ניהול הון', target: 1, current: (s) => lessonsDone(s, ['bankroll']) },
            { id: 'l6-bets', label: '25 החלטות הימור', target: 25, current: (s) => domainAttempts(s, 'betting') },
            { id: 'l6-acc', label: 'דיוק 80% בהחלטות הימור', target: 0.8, current: (s) => domainAccuracy(s, 'betting'), format: 'percent' },
        ],
        unlocks: ['סימולציית קזינו'],
    },
    {
        level: 7,
        title: 'סימולציית קזינו',
        subtitle: 'שולחן מלא, קצב אמיתי',
        icon: '🎰',
        requirements: [
            { id: 'l7-rounds', label: '50 סיבובים בסימולציית קזינו', target: 50, current: (s) => s.progress.casinoRounds },
        ],
        unlocks: ['מצב קזינו מתקדם'],
    },
    {
        level: 8,
        title: 'ספירה מתקדמת',
        subtitle: 'ספירה ללא עזרה על המסך',
        icon: '🕶️',
        requirements: [
            { id: 'l8-rounds', label: '20 סיבובים במצב מתקדם', target: 20, current: (s) => s.progress.advancedRounds },
            { id: 'l8-acc', label: 'דיוק 75% בשאלות הקזינו', target: 0.75, current: (s) => domainAccuracy(s, 'casino'), format: 'percent' },
        ],
        unlocks: ['אימון סטיות (Deviations)'],
    },
    {
        level: 9,
        title: 'אימון סטיות',
        subtitle: 'Illustrious 18 ו-Fab 4',
        icon: '📊',
        requirements: [
            { id: 'l9-drills', label: '40 תרגילי סטיות', target: 40, current: (s) => domainAttempts(s, 'deviations') },
            { id: 'l9-acc', label: 'דיוק 85% בסטיות', target: 0.85, current: (s) => domainAccuracy(s, 'deviations'), format: 'percent' },
        ],
        unlocks: ['תג אלוף'],
    },
    {
        level: 10,
        title: 'אלוף (Master)',
        subtitle: 'שליטה מלאה בכל המערכות',
        icon: '👑',
        requirements: [
            { id: 'l10-lessons', label: 'השלמת כל 15 השיעורים', target: LESSONS.length, current: (s) => LESSONS.filter((l) => s.progress.lessons[l.id]?.completed).length },
            { id: 'l10-strategy', label: 'דיוק 90% באסטרטגיה', target: 0.9, current: (s) => domainAccuracy(s, 'strategy'), format: 'percent' },
            { id: 'l10-count', label: 'דיוק 90% בספירה רצה', target: 0.9, current: (s) => domainAccuracy(s, 'runningCount'), format: 'percent' },
            { id: 'l10-sim', label: 'הרצת סימולציה אחת לפחות', target: 1, current: (s) => s.stats.simulations.length },
        ],
        unlocks: ['סיימת את המסלול'],
    },
];
/** האם דרישה הושלמה. */
export function requirementDone(req, s) {
    return req.current(s) >= req.target - 1e-9;
}
/** האם רמה הושלמה. */
export function levelComplete(level, s) {
    return level.requirements.every((r) => requirementDone(r, s));
}
/** התקדמות (0..1) של רמה. */
export function levelProgress(level, s) {
    if (!level.requirements.length)
        return 1;
    const total = level.requirements.reduce((sum, r) => {
        return sum + Math.min(1, r.current(s) / r.target);
    }, 0);
    return total / level.requirements.length;
}
/** הרמה הנוכחית של המשתמש — הרמה הראשונה שלא הושלמה. */
export function currentLevel(s) {
    for (const level of LEVELS) {
        if (!levelComplete(level, s))
            return level;
    }
    return LEVELS[LEVELS.length - 1];
}
/** האם רמה נעולה (הרמה הקודמת לא הושלמה). */
export function levelUnlocked(level, s) {
    if (level.level === 1)
        return true;
    const prev = LEVELS[level.level - 2];
    return levelComplete(prev, s);
}
export const ACHIEVEMENTS = [
    {
        id: 'first-hand',
        title: 'היד הראשונה',
        description: 'שיחקת יד ראשונה',
        icon: '🥇',
        check: (s) => s.stats.handsPlayed >= 1,
        progress: (s) => Math.min(1, s.stats.handsPlayed),
    },
    {
        id: 'hands-100',
        title: '100 ידיים',
        description: 'שיחקת 100 ידיים',
        icon: '💯',
        check: (s) => s.stats.handsPlayed >= 100,
        progress: (s) => Math.min(1, s.stats.handsPlayed / 100),
    },
    {
        id: 'hands-1000',
        title: '1,000 ידיים',
        description: 'שיחקת 1,000 ידיים',
        icon: '🔥',
        check: (s) => s.stats.handsPlayed >= 1000,
        progress: (s) => Math.min(1, s.stats.handsPlayed / 1000),
    },
    {
        id: 'hands-10000',
        title: '10,000 ידיים',
        description: 'שיחקת 10,000 ידיים',
        icon: '🏆',
        check: (s) => s.stats.handsPlayed >= 10000,
        progress: (s) => Math.min(1, s.stats.handsPlayed / 10000),
    },
    {
        id: 'strategy-perfect',
        title: 'אסטרטגיה מושלמת',
        description: '100% דיוק ב-50 תרגילי אסטרטגיה רצופים או יותר',
        icon: '🎯',
        check: (s) => s.stats.trainers.strategy.attempts >= 50 && accuracy(s.stats.trainers.strategy) >= 1,
        progress: (s) => Math.min(1, s.stats.trainers.strategy.attempts / 50),
    },
    {
        id: 'counting-perfect',
        title: 'ספירה מושלמת',
        description: 'דיוק 100% במפגש אימון ספירה',
        icon: '🧮',
        check: (s) => s.stats.bestCountingAccuracy >= 1,
        progress: (s) => s.stats.bestCountingAccuracy,
    },
    {
        id: 'perfect-deck',
        title: 'חפיסה מושלמת',
        description: 'ספירת חפיסה שלמה ללא טעות',
        icon: '🃏',
        check: (s) => s.stats.perfectDecks >= 1,
        progress: (s) => Math.min(1, s.stats.perfectDecks),
    },
    {
        id: 'true-count-master',
        title: 'שליטה בספירה אמיתית',
        description: '50 תרגילי True Count בדיוק 90% ומעלה',
        icon: '📐',
        check: (s) => s.stats.trainers.trueCount.attempts >= 50 && accuracy(s.stats.trainers.trueCount) >= 0.9,
        progress: (s) => Math.min(1, s.stats.trainers.trueCount.attempts / 50),
    },
    {
        id: 'casino-complete',
        title: 'סימולציית קזינו',
        description: 'השלמת 100 סיבובים בסימולציית קזינו',
        icon: '🎰',
        check: (s) => s.progress.casinoRounds >= 100,
        progress: (s) => Math.min(1, s.progress.casinoRounds / 100),
    },
    {
        id: 'advanced-mode',
        title: 'ספירה בתנאי אמת',
        description: '50 סיבובים במצב קזינו מתקדם',
        icon: '🕶️',
        check: (s) => s.progress.advancedRounds >= 50,
        progress: (s) => Math.min(1, s.progress.advancedRounds / 50),
    },
    {
        id: 'million-hands',
        title: 'מיליון ידיים',
        description: 'הרצת סימולציה של מיליון ידיים',
        icon: '⚡',
        check: (s) => s.stats.simulations.some((sim) => sim.hands >= 1000000),
        progress: (s) => Math.min(1, Math.max(0, ...s.stats.simulations.map((sim) => sim.hands / 1000000), 0)),
    },
    {
        id: 'streak-25',
        title: 'רצף של 25',
        description: '25 תשובות נכונות ברצף',
        icon: '🌟',
        check: (s) => s.stats.bestStreak >= 25,
        progress: (s) => Math.min(1, s.stats.bestStreak / 25),
    },
    {
        id: 'daily-7',
        title: 'שבוע רצוף',
        description: 'אימון יומי 7 ימים ברציפות',
        icon: '📅',
        check: (s) => s.progress.daily.streak >= 7,
        progress: (s) => Math.min(1, s.progress.daily.streak / 7),
    },
    {
        id: 'all-lessons',
        title: 'סיימת את הקורס',
        description: 'השלמת כל 15 השיעורים',
        icon: '🎓',
        check: (s) => LESSONS.every((l) => s.progress.lessons[l.id]?.completed),
        progress: (s) => LESSONS.filter((l) => s.progress.lessons[l.id]?.completed).length / LESSONS.length,
    },
    {
        id: 'master-level',
        title: 'רמת אלוף',
        description: 'השלמת את כל 10 הרמות',
        icon: '👑',
        check: (s) => LEVELS.every((l) => levelComplete(l, s)),
        progress: (s) => LEVELS.filter((l) => levelComplete(l, s)).length / LEVELS.length,
    },
];
/** בודק הישגים חדשים ומחזיר את אלו שנפתחו כעת. */
export function checkAchievements(s) {
    return ACHIEVEMENTS.filter((a) => !s.progress.achievements[a.id] && a.check(s));
}
//# sourceMappingURL=progression.js.map