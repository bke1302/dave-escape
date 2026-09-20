/**
 * לוחות התוצאות של באקרה (Roads).
 *
 * המערכת מיישמת את שני הלוחות הבסיסיים והמקובלים:
 *  • לוח החרוזים (Bead Plate) — כל תוצאה לפי סדר, כולל תיקו.
 *  • הדרך הגדולה (Big Road) — עמודה לכל רצף, תיקו מסומן על התא האחרון.
 *
 * חשוב: הלוחות מתעדים היסטוריה בלבד. הם אינם מנבאים את היד הבאה — כל יד
 * מחולקת מנעל מעורבבת ואינה תלויה בקודמותיה.
 */
import type { Outcome } from './game.ts';

export interface BigRoadCell {
  result: 'player' | 'banker';
  /** מספר התיקואים שנרשמו על התא הזה. */
  ties: number;
  /** מספר היד בהיסטוריה. */
  handIndex: number;
}

export class BigRoad {
  /** עמודות: כל עמודה היא רצף של אותה תוצאה. */
  columns: BigRoadCell[][] = [];
  /** תיקואים שקרו לפני התוצאה הראשונה. */
  pendingTies = 0;
  private handCount = 0;

  add(outcome: Outcome): void {
    this.handCount++;
    if (outcome === 'tie') {
      const last = this.lastCell();
      if (last) last.ties++;
      else this.pendingTies++;
      return;
    }
    const cell: BigRoadCell = { result: outcome, ties: 0, handIndex: this.handCount };
    const current = this.columns[this.columns.length - 1];
    if (!current || current[0].result !== outcome) {
      this.columns.push([cell]);
      if (this.columns.length === 1 && this.pendingTies > 0) {
        cell.ties += this.pendingTies;
        this.pendingTies = 0;
      }
    } else {
      current.push(cell);
    }
  }

  lastCell(): BigRoadCell | null {
    const column = this.columns[this.columns.length - 1];
    return column ? column[column.length - 1] : null;
  }

  /** אורך הרצף הנוכחי. */
  get currentStreak(): number {
    const column = this.columns[this.columns.length - 1];
    return column ? column.length : 0;
  }

  /** הרצף הארוך ביותר שנרשם. */
  get longestStreak(): number {
    return this.columns.reduce((max, c) => Math.max(max, c.length), 0);
  }

  /**
   * הטלה לרשת תצוגה בגובה 6 שורות.
   * כאשר עמודה עוברת 6 תוצאות, הרצף "מתעקל" ימינה — "זנב הדרקון".
   */
  grid(maxColumns: number = 24, rows: number = 6): (BigRoadCell | null)[][] {
    const map = new Map<string, BigRoadCell>();
    let maxUsedColumn = 0;

    this.columns.forEach((column, columnIndex) => {
      let col = columnIndex;
      let row = 0;
      column.forEach((cell, i) => {
        if (i === 0) {
          col = columnIndex;
          row = 0;
        } else if (row + 1 < rows && !map.has(`${col},${row + 1}`)) {
          row = row + 1;
        } else {
          col = col + 1;
        }
        while (map.has(`${col},${row}`)) col++;
        map.set(`${col},${row}`, cell);
        if (col > maxUsedColumn) maxUsedColumn = col;
      });
    });

    const startColumn = Math.max(0, maxUsedColumn - maxColumns + 1);
    const grid: (BigRoadCell | null)[][] = [];
    for (let r = 0; r < rows; r++) {
      const line: (BigRoadCell | null)[] = [];
      for (let c = 0; c < maxColumns; c++) {
        line.push(map.get(`${startColumn + c},${r}`) ?? null);
      }
      grid.push(line);
    }
    return grid;
  }
}

/** לוח חרוזים: כל התוצאות לפי סדר, 6 שורות בעמודה. */
export function beadPlate(history: readonly Outcome[], columns: number = 12, rows: number = 6): (Outcome | null)[][] {
  const capacity = columns * rows;
  const recent = history.slice(-capacity);
  const grid: (Outcome | null)[][] = Array.from({ length: rows }, () => new Array<Outcome | null>(columns).fill(null));
  recent.forEach((outcome, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    if (col < columns) grid[row][col] = outcome;
  });
  return grid;
}

export interface RoadSummary {
  total: number;
  player: number;
  banker: number;
  tie: number;
  longestStreak: number;
  currentStreak: number;
  currentResult: Outcome | null;
}

export function summarize(history: readonly Outcome[]): RoadSummary {
  const road = new BigRoad();
  for (const outcome of history) road.add(outcome);
  const last = history.filter((o) => o !== 'tie').slice(-1)[0] ?? null;
  return {
    total: history.length,
    player: history.filter((o) => o === 'player').length,
    banker: history.filter((o) => o === 'banker').length,
    tie: history.filter((o) => o === 'tie').length,
    longestStreak: road.longestStreak,
    currentStreak: road.currentStreak,
    currentResult: last,
  };
}

export const ROAD_NOTE_HE =
  'הלוחות מציגים מה כבר קרה. הם אינם משנים את ההסתברות של היד הבאה — כל יד בלתי תלויה בקודמותיה.';

/**
 * בקזינו מוצגים לעיתים גם לוחות נגזרים (Big Eye Boy, Small Road, Cockroach Pig),
 * הנגזרים מכניקנית מהדרך הגדולה. האפליקציה מציגה רק לוחות שהחוקים המדויקים שלהם
 * מיושמים כאן במלואם, ולכן היא נמנעת מהצגתם — ובכל מקרה, גם הם אינם מנבאים דבר.
 */
export const DERIVED_ROADS_NOTE_HE =
  'בקזינו מוצגים לעיתים גם לוחות נגזרים (Big Eye Boy, Small Road, Cockroach Pig) הנגזרים מהדרך הגדולה. האפליקציה מציגה את שני הלוחות הבסיסיים בלבד — לוח החרוזים והדרך הגדולה — שאת חוקיהם היא מיישמת במדויק. גם הלוחות הנגזרים אינם מספקים מידע על היד הבאה.';
