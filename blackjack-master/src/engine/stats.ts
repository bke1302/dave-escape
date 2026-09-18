/** כלי סטטיסטיקה: ממוצע, שונות, סטיית תקן, ירידת שיא ורצפים. */

export function mean(values: readonly number[]): number {
  if (!values.length) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** שונות מדגמית (n-1). */
export function variance(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  let sum = 0;
  for (const v of values) sum += (v - m) * (v - m);
  return sum / (values.length - 1);
}

export function standardDeviation(values: readonly number[]): number {
  return Math.sqrt(variance(values));
}

/** צובר סטטיסטיקות בזרימה (streaming) — חוסך זיכרון במיליוני ידיים. */
export class RunningStats {
  count = 0;
  private meanValue = 0;
  private m2 = 0;
  min = Number.POSITIVE_INFINITY;
  max = Number.NEGATIVE_INFINITY;
  sum = 0;

  push(value: number): void {
    this.count++;
    this.sum += value;
    const delta = value - this.meanValue;
    this.meanValue += delta / this.count;
    this.m2 += delta * (value - this.meanValue);
    if (value < this.min) this.min = value;
    if (value > this.max) this.max = value;
  }

  get average(): number {
    return this.count ? this.meanValue : 0;
  }

  get variance(): number {
    return this.count > 1 ? this.m2 / (this.count - 1) : 0;
  }

  get sd(): number {
    return Math.sqrt(this.variance);
  }
}

/** עוקב אחרי ירידת שיא (drawdown) ורצפים של ניצחונות/הפסדים. */
export class SeriesTracker {
  peak = 0;
  trough = 0;
  maxDrawdown = 0;
  current = 0;
  longestWinStreak = 0;
  longestLoseStreak = 0;
  private winStreak = 0;
  private loseStreak = 0;

  constructor(start: number = 0) {
    this.current = start;
    this.peak = start;
    this.trough = start;
  }

  update(net: number): void {
    this.current += net;
    if (this.current > this.peak) this.peak = this.current;
    if (this.current < this.trough) this.trough = this.current;
    const drawdown = this.peak - this.current;
    if (drawdown > this.maxDrawdown) this.maxDrawdown = drawdown;

    if (net > 0) {
      this.winStreak++;
      this.loseStreak = 0;
      if (this.winStreak > this.longestWinStreak) this.longestWinStreak = this.winStreak;
    } else if (net < 0) {
      this.loseStreak++;
      this.winStreak = 0;
      if (this.loseStreak > this.longestLoseStreak) this.longestLoseStreak = this.loseStreak;
    }
  }
}

/** עיגול לתצוגה. */
export function round(value: number, digits: number = 2): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

export function percent(value: number, digits: number = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function signed(value: number, digits: number = 0): string {
  const rounded = round(value, digits);
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('he-IL', { maximumFractionDigits: digits })}`;
}
