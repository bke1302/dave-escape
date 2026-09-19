/**
 * סטיות מאסטרטגיה בסיסית לפי ספירה (Deviations / Index Numbers) בשיטת Hi-Lo.
 *
 * הרשימה כוללת את "Illustrious 18" ואת "Fab 4" — מספרי האינדקס המתועדים של
 * דון שלזינגר (Don Schlesinger, "Blackjack Attack"), המחושבים עבור משחק נעל
 * מרובה חפיסות (4-8). אלה מספרים מתועדים ולא הערכות של האפליקציה.
 *
 * הערות שימוש:
 *  • האינדקסים מתאימים לנעל של 4-8 חפיסות. במשחק חפיסה אחת או שתיים
 *    האינדקסים שונים, ולכן המודול מסמן זאת במפורש ואינו מציג אותם כאמת.
 *  • הכלל: בצע את הסטייה כאשר ה-True Count גדול או שווה לאינדקס (סטיית "עלייה"),
 *    או קטן או שווה לאינדקס (סטיית "ירידה").
 */
import type { PlayAction } from './evEngine.ts';
import type { Rules } from './rules.ts';

export interface Deviation {
  id: string;
  /** תיאור היד בעברית. */
  handLabel: string;
  /** ערכי הקלפים של השחקן (1 = אס). */
  playerValues: number[];
  /** קלף הדילר (1 = אס). */
  dealerUp: number;
  /** ה-True Count שממנו הסטייה נכנסת לתוקף. */
  index: number;
  /** האם הסטייה חלה בספירה גבוהה (>=) או נמוכה (<=). */
  direction: 'atOrAbove' | 'atOrBelow';
  /** הפעולה כשהסטייה בתוקף. */
  deviationAction: PlayAction;
  /** הפעולה לפי אסטרטגיה בסיסית (כשהסטייה לא בתוקף). */
  basicAction: PlayAction;
  group: 'illustrious18' | 'fab4' | 'insurance';
  /** הסבר קצר בעברית. */
  note: string;
}

export const INSURANCE_INDEX = 3;

/** Illustrious 18 (כולל ביטוח כסטייה מספר 1) + Fab 4 לכניעה מאוחרת. */
export const DEVIATIONS: readonly Deviation[] = [
  {
    id: 'insurance',
    handLabel: 'ביטוח מול אס',
    playerValues: [],
    dealerUp: 1,
    index: INSURANCE_INDEX,
    direction: 'atOrAbove',
    deviationAction: 'stand',
    basicAction: 'stand',
    group: 'insurance',
    note: 'ביטוח כדאי כאשר True Count ‎+3 ומעלה — אז ההסתברות לקלף עשר סמוי גבוהה מ-1/3.',
  },
  { id: '16v10', handLabel: '16 מול 10', playerValues: [10, 6], dealerUp: 10, index: 0, direction: 'atOrAbove', deviationAction: 'stand', basicAction: 'hit', group: 'illustrious18', note: 'הסטייה המפורסמת ביותר: ב-True Count ‎0 ומעלה עומדים על 16 מול 10.' },
  { id: '15v10', handLabel: '15 מול 10', playerValues: [10, 5], dealerUp: 10, index: 4, direction: 'atOrAbove', deviationAction: 'stand', basicAction: 'hit', group: 'illustrious18', note: 'בספירה גבוהה הסיכון להיפסל גובר — עומדים מ-‎+4.' },
  { id: '1010v5', handLabel: 'זוג עשרות מול 5', playerValues: [10, 10], dealerUp: 5, index: 5, direction: 'atOrAbove', deviationAction: 'split', basicAction: 'stand', group: 'illustrious18', note: 'סטייה תוקפנית ובולטת לעין — רבים מוותרים עליה מטעמי הסוואה.' },
  { id: '1010v6', handLabel: 'זוג עשרות מול 6', playerValues: [10, 10], dealerUp: 6, index: 4, direction: 'atOrAbove', deviationAction: 'split', basicAction: 'stand', group: 'illustrious18', note: 'כמו מול 5 — סטייה בעלת תרומה גבוהה אך חשופה מאוד.' },
  { id: '10v10', handLabel: '10 מול 10', playerValues: [6, 4], dealerUp: 10, index: 4, direction: 'atOrAbove', deviationAction: 'double', basicAction: 'hit', group: 'illustrious18', note: 'בספירה גבוהה עולה הסיכוי לקבל קלף עשר ולהגיע ל-20.' },
  { id: '12v3', handLabel: '12 מול 3', playerValues: [10, 2], dealerUp: 3, index: 2, direction: 'atOrAbove', deviationAction: 'stand', basicAction: 'hit', group: 'illustrious18', note: 'מ-‎+2 עדיף לעמוד ולתת לדילר להיפסל.' },
  { id: '12v2', handLabel: '12 מול 2', playerValues: [10, 2], dealerUp: 2, index: 3, direction: 'atOrAbove', deviationAction: 'stand', basicAction: 'hit', group: 'illustrious18', note: 'מ-‎+3 עדיף לעמוד.' },
  { id: '11vA', handLabel: '11 מול אס', playerValues: [6, 5], dealerUp: 1, index: 1, direction: 'atOrAbove', deviationAction: 'double', basicAction: 'hit', group: 'illustrious18', note: 'בשולחן S17 מכפילים מ-‎+1. בשולחן H17 מכפילים תמיד.' },
  { id: '9v2', handLabel: '9 מול 2', playerValues: [5, 4], dealerUp: 2, index: 1, direction: 'atOrAbove', deviationAction: 'double', basicAction: 'hit', group: 'illustrious18', note: 'מ-‎+1 ההכפלה משתלמת.' },
  { id: '10vA', handLabel: '10 מול אס', playerValues: [6, 4], dealerUp: 1, index: 4, direction: 'atOrAbove', deviationAction: 'double', basicAction: 'hit', group: 'illustrious18', note: 'מ-‎+4 מכפילים גם מול אס.' },
  { id: '9v7', handLabel: '9 מול 7', playerValues: [5, 4], dealerUp: 7, index: 3, direction: 'atOrAbove', deviationAction: 'double', basicAction: 'hit', group: 'illustrious18', note: 'מ-‎+3 מכפילים מול 7.' },
  { id: '16v9', handLabel: '16 מול 9', playerValues: [10, 6], dealerUp: 9, index: 5, direction: 'atOrAbove', deviationAction: 'stand', basicAction: 'hit', group: 'illustrious18', note: 'מ-‎+5 עומדים (ללא כניעה).' },
  { id: '13v2', handLabel: '13 מול 2', playerValues: [10, 3], dealerUp: 2, index: -1, direction: 'atOrBelow', deviationAction: 'hit', basicAction: 'stand', group: 'illustrious18', note: 'בספירה שלילית (‎-1 ומטה) לוקחים קלף.' },
  { id: '12v4', handLabel: '12 מול 4', playerValues: [10, 2], dealerUp: 4, index: 0, direction: 'atOrBelow', deviationAction: 'hit', basicAction: 'stand', group: 'illustrious18', note: 'בספירה שלילית לוקחים קלף.' },
  { id: '12v5', handLabel: '12 מול 5', playerValues: [10, 2], dealerUp: 5, index: -2, direction: 'atOrBelow', deviationAction: 'hit', basicAction: 'stand', group: 'illustrious18', note: 'מ-‎-2 ומטה לוקחים קלף.' },
  { id: '12v6', handLabel: '12 מול 6', playerValues: [10, 2], dealerUp: 6, index: -1, direction: 'atOrBelow', deviationAction: 'hit', basicAction: 'stand', group: 'illustrious18', note: 'מ-‎-1 ומטה לוקחים קלף.' },
  { id: '13v3', handLabel: '13 מול 3', playerValues: [10, 3], dealerUp: 3, index: -2, direction: 'atOrBelow', deviationAction: 'hit', basicAction: 'stand', group: 'illustrious18', note: 'מ-‎-2 ומטה לוקחים קלף.' },
  { id: '14v10', handLabel: '14 מול 10 (כניעה)', playerValues: [10, 4], dealerUp: 10, index: 3, direction: 'atOrAbove', deviationAction: 'surrender', basicAction: 'hit', group: 'fab4', note: 'Fab 4: נכנעים מ-‎+3.' },
  { id: '15v10s', handLabel: '15 מול 10 (כניעה)', playerValues: [10, 5], dealerUp: 10, index: 0, direction: 'atOrAbove', deviationAction: 'surrender', basicAction: 'surrender', group: 'fab4', note: 'Fab 4: כניעה היא גם פעולת האסטרטגיה הבסיסית; מתחת ל-‎0 ממשיכים לקחת קלף.' },
  { id: '15v9', handLabel: '15 מול 9 (כניעה)', playerValues: [10, 5], dealerUp: 9, index: 2, direction: 'atOrAbove', deviationAction: 'surrender', basicAction: 'hit', group: 'fab4', note: 'Fab 4: נכנעים מ-‎+2.' },
  { id: '15vA', handLabel: '15 מול אס (כניעה)', playerValues: [10, 5], dealerUp: 1, index: 1, direction: 'atOrAbove', deviationAction: 'surrender', basicAction: 'hit', group: 'fab4', note: 'Fab 4: נכנעים מ-‎+1 (בשולחן H17 זו גם אסטרטגיה בסיסית).' },
];

/** האם הסטייה בתוקף ב-True Count נתון. */
export function deviationApplies(dev: Deviation, tc: number): boolean {
  return dev.direction === 'atOrAbove' ? tc >= dev.index : tc <= dev.index;
}

/** הפעולה הנכונה לסטייה נתונה ב-True Count נתון. */
export function actionForDeviation(dev: Deviation, tc: number): PlayAction {
  return deviationApplies(dev, tc) ? dev.deviationAction : dev.basicAction;
}

/** מחפש סטייה רלוונטית ליד ולקלף דילר נתונים. */
export function findDeviation(playerValues: readonly number[], dealerUp: number): Deviation | undefined {
  const total = playerValues.reduce((a, b) => a + (b === 1 ? 11 : b), 0);
  return DEVIATIONS.find((d) => {
    if (d.group === 'insurance') return false;
    if (d.dealerUp !== dealerUp) return false;
    const isPairDev = d.playerValues.length === 2 && d.playerValues[0] === d.playerValues[1];
    const isPairHand = playerValues.length === 2 && playerValues[0] === playerValues[1];
    if (isPairDev !== isPairHand) return false;
    if (isPairDev) return playerValues[0] === d.playerValues[0];
    const devTotal = d.playerValues.reduce((a, b) => a + b, 0);
    return devTotal === total && playerValues.every((v) => v !== 1);
  });
}

/** האם האינדקסים רלוונטיים לחוקי השולחן שנבחרו. */
export function deviationsApplicable(rules: Rules): boolean {
  return rules.decks >= 4;
}

export const DEVIATIONS_NOTE_HE =
  'מספרי האינדקס לקוחים מרשימת Illustrious 18 ו-Fab 4 המתועדות (Don Schlesinger), והם מחושבים עבור נעל של 4-8 חפיסות בשיטת Hi-Lo. במשחק של חפיסה אחת או שתיים האינדקסים שונים ולכן אינם מוצגים כאן כאמת.';
