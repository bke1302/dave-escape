/** חוקי השולחן. כל חישובי האסטרטגיה, ה-EV והסימולציות נגזרים מהחוקים האלה. */

export type DeckCount = 1 | 2 | 4 | 6 | 8;
export type SurrenderRule = 'none' | 'late';
export type DoubleRule = 'any2' | '9-11' | '10-11';

export interface Rules {
  /** מספר חפיסות בנעל. */
  decks: DeckCount;
  /** הדילר לוקח קלף ב-17 רכה (H17) או עומד (S17). */
  dealerHitsSoft17: boolean;
  /** תשלום על בלאק ג'ק: 1.5 = 3:2, 1.2 = 6:5. */
  blackjackPayout: number;
  /** הכפלה לאחר פיצול (Double After Split). */
  doubleAfterSplit: boolean;
  /** על אילו ידיים מותר להכפיל. */
  doubleRule: DoubleRule;
  /** כניעה מאוחרת (אחרי בדיקת בלאק ג'ק של הדילר) או ללא כניעה כלל. */
  surrender: SurrenderRule;
  /** מספר הידיים המרבי לאחר פיצולים (4 = עד 3 פיצולים). */
  maxSplitHands: number;
  /** האם מותר לפצל אסים שוב. */
  resplitAces: boolean;
  /** האם מותר לקחת קלפים נוספים על אסים מפוצלים (בדרך כלל לא). */
  hitSplitAces: boolean;
  /** חדירה — אחוז הנעל שמחולק לפני ערבוב. */
  penetration: number;
  /** האם מוצע ביטוח. */
  insuranceOffered: boolean;
  /** הדילר מציץ בקלף הסמוי מול A/10 (משחק אמריקאי). */
  dealerPeeks: boolean;
}

export const DEFAULT_RULES: Rules = {
  decks: 6,
  dealerHitsSoft17: false,
  blackjackPayout: 1.5,
  doubleAfterSplit: true,
  doubleRule: 'any2',
  surrender: 'late',
  maxSplitHands: 4,
  resplitAces: false,
  hitSplitAces: false,
  penetration: 0.75,
  insuranceOffered: true,
  dealerPeeks: true,
};

export function cloneRules(rules: Rules): Rules {
  return { ...rules };
}

/** תיאור קצר של החוקים בעברית — מוצג בכל מסך שתלוי בחוקים. */
export function describeRulesHe(rules: Rules): string {
  const parts: string[] = [];
  parts.push(`${rules.decks} חפיסות`);
  parts.push(rules.dealerHitsSoft17 ? 'דילר לוקח ב-17 רכה (H17)' : 'דילר עומד ב-17 רכה (S17)');
  parts.push(rules.blackjackPayout === 1.5 ? 'בלאק ג\'ק 3:2' : `בלאק ג'ק ${rules.blackjackPayout === 1.2 ? '6:5' : rules.blackjackPayout}`);
  parts.push(rules.doubleAfterSplit ? 'הכפלה אחרי פיצול (DAS)' : 'ללא הכפלה אחרי פיצול');
  parts.push(rules.surrender === 'late' ? 'כניעה מאוחרת' : 'ללא כניעה');
  parts.push(`חדירה ${Math.round(rules.penetration * 100)}%`);
  return parts.join(' · ');
}

/** האם מותר להכפיל יד בעלת הסכום הנתון לפי חוקי ההכפלה. */
export function doubleAllowedForTotal(rules: Rules, total: number, soft: boolean): boolean {
  if (rules.doubleRule === 'any2') return true;
  if (soft) return false;
  if (rules.doubleRule === '9-11') return total >= 9 && total <= 11;
  return total === 10 || total === 11;
}

export const PENETRATION_OPTIONS: readonly number[] = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85];
export const DECK_OPTIONS: readonly DeckCount[] = [1, 2, 4, 6, 8];
