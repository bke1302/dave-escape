/** מסלול האקדמיה של באקרה — 14 רמות והישגים. */
import { BACCARAT_LESSONS } from "./lessons.js";
import { baccaratAccuracy } from "../state.js";
const lessonsDone = (s, ids) => ids.filter((id) => s.lessons[id]?.completed).length;
export const BACCARAT_LEVELS = [
    {
        level: 1,
        title: 'מהו באקרה',
        subtitle: 'המשחק ושלושת ההימורים',
        icon: '🎴',
        requirements: [{ id: 'l1', label: 'השלמת שיעור הפתיחה', target: 1, current: (s) => lessonsDone(s, ['what-is-baccarat']) }],
        unlocks: 'שולחן המשחק',
    },
    {
        level: 2,
        title: 'ערכי קלפים',
        subtitle: 'אס=1 · 2-9 · עשר=0',
        icon: '🔢',
        requirements: [{ id: 'l2', label: 'השלמת שיעור ערכי הקלפים', target: 1, current: (s) => lessonsDone(s, ['card-values']) }],
        unlocks: 'מאמן חישוב יד',
    },
    {
        level: 3,
        title: 'חישוב יד',
        subtitle: 'חוק ה-Modulo 10',
        icon: '➗',
        requirements: [
            { id: 'l3a', label: 'השלמת שיעור חישוב היד', target: 1, current: (s) => lessonsDone(s, ['modulo-ten']) },
            { id: 'l3b', label: '20 תרגילי חישוב יד', target: 20, current: (s) => s.trainers.handValue.attempts },
            { id: 'l3c', label: 'דיוק 80% בחישוב יד', target: 0.8, current: (s) => baccaratAccuracy(s.trainers.handValue), format: 'percent' },
        ],
        unlocks: 'תרגול הימורים',
    },
    {
        level: 4,
        title: 'שחקן / בנקאי / תיקו',
        subtitle: 'על מה מהמרים',
        icon: '🎯',
        requirements: [{ id: 'l4', label: 'השלמת שיעור ההימורים', target: 1, current: (s) => lessonsDone(s, ['player-banker-tie']) }],
        unlocks: 'שולחן עם היסטוריה',
    },
    {
        level: 5,
        title: 'יד טבעית (Natural)',
        subtitle: '8 או 9 בשני קלפים',
        icon: '⭐',
        requirements: [{ id: 'l5', label: 'השלמת שיעור Natural', target: 1, current: (s) => lessonsDone(s, ['natural']) }],
        unlocks: 'מאמן הקלף השלישי',
    },
    {
        level: 6,
        title: 'חוקי הקלף השלישי',
        subtitle: 'כלל השחקן וכלל הבנקאי',
        icon: '🃏',
        requirements: [
            { id: 'l6a', label: 'השלמת שני שיעורי הקלף השלישי', target: 2, current: (s) => lessonsDone(s, ['third-card-player', 'third-card-banker']) },
            { id: 'l6b', label: '30 תרגילי קלף שלישי', target: 30, current: (s) => s.trainers.thirdCard.attempts },
            { id: 'l6c', label: 'דיוק 80% בחוקי הקלף השלישי', target: 0.8, current: (s) => baccaratAccuracy(s.trainers.thirdCard), format: 'percent' },
        ],
        unlocks: 'מאמן יד מלאה',
    },
    {
        level: 7,
        title: 'יד מלאה',
        subtitle: 'מחברים את כל החוקים',
        icon: '🧩',
        requirements: [
            { id: 'l7a', label: 'השלמת שיעור היד המלאה', target: 1, current: (s) => lessonsDone(s, ['full-hand']) },
            { id: 'l7b', label: '20 תרגילי יד מלאה', target: 20, current: (s) => s.trainers.fullHand.attempts },
            { id: 'l7c', label: 'דיוק 80% ביד מלאה', target: 0.8, current: (s) => baccaratAccuracy(s.trainers.fullHand), format: 'percent' },
        ],
        unlocks: 'מסך ההימורים והתשלומים',
    },
    {
        level: 8,
        title: 'הימורים ותשלומים',
        subtitle: 'עמלה, ללא עמלה ותיקו',
        icon: '💵',
        requirements: [{ id: 'l8', label: 'השלמת שיעור ההימורים והתשלומים', target: 1, current: (s) => lessonsDone(s, ['betting-options']) }],
        unlocks: 'מחשבון יתרון הבית',
    },
    {
        level: 9,
        title: 'יתרון הבית',
        subtitle: 'המחיר של כל הימור',
        icon: '🏛️',
        requirements: [{ id: 'l9', label: 'השלמת שיעור יתרון הבית', target: 1, current: (s) => lessonsDone(s, ['house-edge']) }],
        unlocks: 'מסך ההסתברויות',
    },
    {
        level: 10,
        title: 'הסתברויות',
        subtitle: 'למה הבנקאי מנצח יותר',
        icon: '📐',
        requirements: [
            { id: 'l10a', label: 'השלמת שיעור ההסתברויות', target: 1, current: (s) => lessonsDone(s, ['probability']) },
            { id: 'l10b', label: '10 שאלות הסתברות', target: 10, current: (s) => s.trainers.probability.attempts },
        ],
        unlocks: 'לוחות התוצאות',
    },
    {
        level: 11,
        title: 'לוחות התוצאות',
        subtitle: 'Bead Plate ו-Big Road',
        icon: '🗺️',
        requirements: [
            { id: 'l11a', label: 'השלמת שיעור הלוחות', target: 1, current: (s) => lessonsDone(s, ['roads']) },
            { id: 'l11b', label: '15 תרגילי קריאת לוח', target: 15, current: (s) => s.trainers.road.attempts },
            { id: 'l11c', label: 'דיוק 75% בקריאת לוחות', target: 0.75, current: (s) => baccaratAccuracy(s.trainers.road), format: 'percent' },
        ],
        unlocks: 'הסימולטור',
    },
    {
        level: 12,
        title: 'סימולציה מתקדמת',
        subtitle: 'מונטה קרלו על מנוע המשחק',
        icon: '🧪',
        requirements: [
            { id: 'l12a', label: 'הרצת סימולציה אחת לפחות', target: 1, current: (s) => s.simulations.length },
            { id: 'l12b', label: '50 ידיים בשולחן', target: 50, current: (s) => s.handsPlayed },
        ],
        unlocks: 'מתמטיקה מתקדמת',
    },
    {
        level: 13,
        title: 'מתמטיקה מתקדמת',
        subtitle: 'שונות, שיטות הימור וכשלים',
        icon: '📊',
        requirements: [
            { id: 'l13a', label: 'השלמת שיעור מעקב וכשלים', target: 1, current: (s) => lessonsDone(s, ['tracking-fallacies']) },
            { id: 'l13b', label: 'סימולציה של 100,000 ידיים', target: 1, current: (s) => (s.simulations.some((x) => x.hands >= 100000) ? 1 : 0) },
        ],
        unlocks: 'סימולציית קזינו',
    },
    {
        level: 14,
        title: 'סימולציית קזינו',
        subtitle: 'שליטה מלאה במשחק',
        icon: '👑',
        requirements: [
            { id: 'l14a', label: 'השלמת כל 14 השיעורים', target: BACCARAT_LESSONS.length, current: (s) => BACCARAT_LESSONS.filter((l) => s.lessons[l.id]?.completed).length },
            { id: 'l14b', label: '200 ידיים בשולחן', target: 200, current: (s) => s.handsPlayed },
            { id: 'l14c', label: 'דיוק 85% בחוקי הקלף השלישי', target: 0.85, current: (s) => baccaratAccuracy(s.trainers.thirdCard), format: 'percent' },
        ],
        unlocks: 'סיימת את האקדמיה',
    },
];
export function baccaratRequirementDone(req, s) {
    return req.current(s) >= req.target - 1e-9;
}
export function baccaratLevelComplete(level, s) {
    return level.requirements.every((r) => baccaratRequirementDone(r, s));
}
export function baccaratLevelProgress(level, s) {
    if (!level.requirements.length)
        return 1;
    return (level.requirements.reduce((sum, r) => sum + Math.min(1, r.current(s) / r.target), 0) / level.requirements.length);
}
export function baccaratCurrentLevel(s) {
    for (const level of BACCARAT_LEVELS) {
        if (!baccaratLevelComplete(level, s))
            return level;
    }
    return BACCARAT_LEVELS[BACCARAT_LEVELS.length - 1];
}
export function baccaratLevelUnlocked(level, s) {
    if (level.level === 1)
        return true;
    return baccaratLevelComplete(BACCARAT_LEVELS[level.level - 2], s);
}
/** התקדמות כוללת באקדמיה (0..1) — לשימוש בלוח הראשי. */
export function baccaratOverallProgress(s) {
    return BACCARAT_LEVELS.reduce((sum, l) => sum + baccaratLevelProgress(l, s), 0) / BACCARAT_LEVELS.length;
}
export const BACCARAT_ACHIEVEMENTS = [
    { id: 'b-first-hand', title: 'היד הראשונה', description: 'שיחקת יד באקרה ראשונה', icon: '🎴', check: (s) => s.handsPlayed >= 1, progress: (s) => Math.min(1, s.handsPlayed) },
    { id: 'b-hands-100', title: '100 ידיים', description: 'שיחקת 100 ידיים', icon: '💯', check: (s) => s.handsPlayed >= 100, progress: (s) => Math.min(1, s.handsPlayed / 100) },
    { id: 'b-hands-1000', title: '1,000 ידיים', description: 'שיחקת 1,000 ידיים', icon: '🔥', check: (s) => s.handsPlayed >= 1000, progress: (s) => Math.min(1, s.handsPlayed / 1000) },
    { id: 'b-third-card', title: 'שולט בקלף השלישי', description: '50 תרגילים בדיוק 90% ומעלה', icon: '🃏', check: (s) => s.trainers.thirdCard.attempts >= 50 && baccaratAccuracy(s.trainers.thirdCard) >= 0.9, progress: (s) => Math.min(1, s.trainers.thirdCard.attempts / 50) },
    { id: 'b-third-card-perfect', title: 'קלף שלישי מושלם', description: '25 תרגילים ברצף ללא טעות', icon: '🎯', check: (s) => s.bestStreak >= 25, progress: (s) => Math.min(1, s.bestStreak / 25) },
    { id: 'b-hand-value', title: 'מחשבון אנושי', description: '50 תרגילי חישוב יד בדיוק 90%', icon: '➗', check: (s) => s.trainers.handValue.attempts >= 50 && baccaratAccuracy(s.trainers.handValue) >= 0.9, progress: (s) => Math.min(1, s.trainers.handValue.attempts / 50) },
    { id: 'b-road', title: 'קורא לוחות', description: '30 תרגילי לוח בדיוק 85%', icon: '🗺️', check: (s) => s.trainers.road.attempts >= 30 && baccaratAccuracy(s.trainers.road) >= 0.85, progress: (s) => Math.min(1, s.trainers.road.attempts / 30) },
    { id: 'b-all-lessons', title: 'בוגר האקדמיה', description: 'השלמת כל 14 השיעורים', icon: '🎓', check: (s) => BACCARAT_LESSONS.every((l) => s.lessons[l.id]?.completed), progress: (s) => BACCARAT_LESSONS.filter((l) => s.lessons[l.id]?.completed).length / BACCARAT_LESSONS.length },
    { id: 'b-million', title: 'מיליון ידיים', description: 'סימולציה של מיליון ידיים', icon: '⚡', check: (s) => s.simulations.some((x) => x.hands >= 1000000), progress: (s) => Math.min(1, Math.max(0, ...s.simulations.map((x) => x.hands / 1000000), 0)) },
    { id: 'b-master', title: 'אלוף באקרה', description: 'השלמת כל 14 הרמות', icon: '👑', check: (s) => BACCARAT_LEVELS.every((l) => baccaratLevelComplete(l, s)), progress: (s) => BACCARAT_LEVELS.filter((l) => baccaratLevelComplete(l, s)).length / BACCARAT_LEVELS.length },
];
export function checkBaccaratAchievements(s) {
    return BACCARAT_ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.check(s));
}
//# sourceMappingURL=progression.js.map