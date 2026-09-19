/** יוצר RNG דטרמיניסטי מזרע נתון. איכות סטטיסטית טובה לצרכי סימולציה. */
export function createRng(seed = Date.now() >>> 0) {
    let a = seed >>> 0;
    return function next() {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** מספר שלם אקראי בתחום [min, max] כולל. */
export function randInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
}
/**
 * ערבוב Fisher-Yates (Knuth) — ערבוב אחיד ובלתי מוטה.
 * מערבב את המערך במקום (in place) ומחזיר אותו.
 */
export function fisherYatesShuffle(items, rng) {
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = items[i];
        items[i] = items[j];
        items[j] = tmp;
    }
    return items;
}
/** בחירת איבר אקראי מתוך מערך לא ריק. */
export function pick(items, rng) {
    return items[Math.floor(rng() * items.length)];
}
//# sourceMappingURL=rng.js.map