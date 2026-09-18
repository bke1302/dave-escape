/**
 * מחולל מספרים אקראיים (RNG) בעל זרע (seed) — מבוסס mulberry32.
 * נדרש זרע כדי שסימולציות יהיו ניתנות לשחזור (reproducible) ולבדיקה.
 */
export type Rng = () => number;

/** יוצר RNG דטרמיניסטי מזרע נתון. איכות סטטיסטית טובה לצרכי סימולציה. */
export function createRng(seed: number = Date.now() >>> 0): Rng {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** מספר שלם אקראי בתחום [min, max] כולל. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * ערבוב Fisher-Yates (Knuth) — ערבוב אחיד ובלתי מוטה.
 * מערבב את המערך במקום (in place) ומחזיר אותו.
 */
export function fisherYatesShuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

/** בחירת איבר אקראי מתוך מערך לא ריק. */
export function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}
