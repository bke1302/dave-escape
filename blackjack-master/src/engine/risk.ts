/**
 * סיכון פשיטת רגל (Risk of Ruin) וניהול הון.
 *
 * הנוסחאות מבוססות על קירוב תנועה בראונית עם היסט (diffusion approximation),
 * שהוא הסטנדרט בספרות הבלאק ג'ק. ההנחות מוצגות למשתמש במסך עצמו:
 *  1. תוחלת (μ) וסטיית תקן (σ) ליד קבועות לאורך המשחק.
 *  2. גודל הימור קבוע ביחידות (ללא Kelly דינמי).
 *  3. אין גבול עליון לרווח — "חורבן" = ירידת ההון לאפס.
 *  4. התפלגות התוצאות מקורבת לנורמלית (קירוב טוב לאורך אלפי ידיים).
 * אלה קירובים מתמטיים, לא הבטחה לגבי משחק אמיתי.
 */

/** התפלגות נורמלית מצטברת — קירוב Abramowitz & Stegun 7.1.26 (דיוק ~1e-7). */
export function normalCdf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-z * z);
  return 0.5 * (1 + sign * y);
}

export interface RorInput {
  /** הון התחלתי ביחידות הימור. */
  bankrollUnits: number;
  /** תוחלת ליד ביחידות הימור (למשל 0.01 = יתרון של 1% מהימור). */
  evPerHand: number;
  /** סטיית תקן ליד ביחידות הימור (טיפוסית ~1.15 ליד בודדת בהימור קבוע). */
  sdPerHand: number;
}

/** סיכון פשיטת רגל למשחק ללא הגבלת זמן. */
export function riskOfRuin(input: RorInput): number {
  const { bankrollUnits, evPerHand, sdPerHand } = input;
  if (bankrollUnits <= 0) return 1;
  if (sdPerHand <= 0) return evPerHand >= 0 ? 0 : 1;
  if (evPerHand <= 0) return 1; // בתוחלת שלילית, משחק אינסופי מוביל לחורבן ודאי
  const exponent = (-2 * evPerHand * bankrollUnits) / (sdPerHand * sdPerHand);
  return Math.min(1, Math.exp(exponent));
}

/** סיכון פשיטת רגל בתוך מספר ידיים סופי (זמן מעבר ראשון). */
export function riskOfRuinFinite(input: RorInput, hands: number): number {
  const { bankrollUnits: b, evPerHand: mu, sdPerHand: sigma } = input;
  if (b <= 0) return 1;
  if (hands <= 0) return 0;
  if (sigma <= 0) return mu >= 0 ? 0 : 1;
  const sqrtN = Math.sqrt(hands);
  const first = normalCdf((-b - mu * hands) / (sigma * sqrtN));
  const expTerm = Math.exp((-2 * mu * b) / (sigma * sigma));
  const second = expTerm * normalCdf((-b + mu * hands) / (sigma * sqrtN));
  return Math.max(0, Math.min(1, first + second));
}

/** ההון (ביחידות) הדרוש כדי להגיע לסיכון חורבן מבוקש. */
export function bankrollForRisk(targetRisk: number, evPerHand: number, sdPerHand: number): number | null {
  if (evPerHand <= 0 || targetRisk <= 0 || targetRisk >= 1) return null;
  return (-(sdPerHand * sdPerHand) * Math.log(targetRisk)) / (2 * evPerHand);
}

/** שבר קלי (Kelly) — חלק ההון שכדאי להמר לפי יתרון ושונות. */
export function kellyFraction(evPerHand: number, sdPerHand: number): number {
  if (sdPerHand <= 0) return 0;
  return evPerHand / (sdPerHand * sdPerHand);
}

/** רווח צפוי ורוחב סטיית תקן לאחר N ידיים. */
export function projection(evPerHand: number, sdPerHand: number, hands: number, unit: number) {
  const expected = evPerHand * hands * unit;
  const sd = sdPerHand * Math.sqrt(hands) * unit;
  return {
    expected,
    sd,
    /** תחום של 95% (‎±1.96 סטיות תקן). */
    low: expected - 1.96 * sd,
    high: expected + 1.96 * sd,
  };
}

export const RISK_ASSUMPTIONS_HE: readonly string[] = [
  'תוחלת וסטיית תקן ליד נחשבות קבועות לאורך כל המשחק.',
  'גודל ההימור קבוע ביחידות (ללא התאמת הון דינמית).',
  '"חורבן" מוגדר כירידת ההון לאפס, ללא יעד רווח שמסיים את המשחק.',
  'התוצאות מקורבות להתפלגות נורמלית — קירוב טוב לאורך אלפי ידיים.',
  'התוצאה היא הערכה מתמטית בלבד ואינה תחזית למשחק בודד.',
];
