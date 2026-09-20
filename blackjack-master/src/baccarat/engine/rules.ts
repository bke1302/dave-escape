/**
 * חוקי שולחן באקרה (Punto Banco).
 * כל התשלומים והעמלות נגזרים מכאן — אין מספרים קבועים בקוד החישוב.
 */

export type CommissionMode = 'commission' | 'noCommission';

export interface BaccaratRules {
  /** מספר חפיסות בנעל (בדרך כלל 8, לעיתים 6). */
  decks: number;
  /** חדירה — איזה חלק מהנעל מחולק לפני ערבוב. */
  penetration: number;
  /** שיטת התשלום על הבנקאי. */
  commissionMode: CommissionMode;
  /** שיעור העמלה על ניצחון בנקאי (במצב עמלה). */
  commissionRate: number;
  /**
   * במצב "ללא עמלה": התשלום על ניצחון בנקאי עם סכום 6.
   * 0.5 = חצי מההימור (החוק הנפוץ), 1 = תשלום מלא.
   */
  bankerSixPayout: number;
  /** תשלום על הימור תיקו: 8 (8:1) או 9 (9:1). */
  tiePayout: number;
}

export const DEFAULT_BACCARAT_RULES: BaccaratRules = {
  decks: 8,
  penetration: 0.85,
  commissionMode: 'commission',
  commissionRate: 0.05,
  bankerSixPayout: 0.5,
  tiePayout: 8,
};

export const DECK_OPTIONS_BACCARAT: readonly number[] = [6, 8];
export const TIE_PAYOUT_OPTIONS: readonly number[] = [8, 9];

export function cloneBaccaratRules(rules: BaccaratRules): BaccaratRules {
  return { ...rules };
}

/** תיאור החוקים בעברית — מוצג בכל מסך שתלוי בהם. */
export function describeBaccaratRulesHe(rules: BaccaratRules): string {
  const parts: string[] = [`${rules.decks} חפיסות`];
  if (rules.commissionMode === 'commission') {
    parts.push(`עמלת בנקאי ${(rules.commissionRate * 100).toFixed(0)}%`);
  } else {
    parts.push(
      rules.bankerSixPayout === 1
        ? 'ללא עמלה (תשלום מלא)'
        : `ללא עמלה · בנקאי עם 6 משלם ${rules.bankerSixPayout === 0.5 ? '1:2' : rules.bankerSixPayout}`,
    );
  }
  parts.push(`תיקו ${rules.tiePayout}:1`);
  parts.push(`חדירה ${Math.round(rules.penetration * 100)}%`);
  return parts.join(' · ');
}

/**
 * התשלום נטו (ללא החזר ההימור) על ניצחון בהימור נתון.
 * bankerTotal נדרש רק לחוק "ללא עמלה".
 */
export function netPayout(
  rules: BaccaratRules,
  bet: 'player' | 'banker' | 'tie',
  amount: number,
  bankerTotal: number,
): number {
  if (bet === 'player') return amount;
  if (bet === 'tie') return amount * rules.tiePayout;
  // בנקאי
  if (rules.commissionMode === 'commission') return amount * (1 - rules.commissionRate);
  return bankerTotal === 6 ? amount * rules.bankerSixPayout : amount;
}
