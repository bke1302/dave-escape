export class BigRoad {
    /** עמודות: כל עמודה היא רצף של אותה תוצאה. */
    columns = [];
    /** תיקואים שקרו לפני התוצאה הראשונה. */
    pendingTies = 0;
    handCount = 0;
    add(outcome) {
        this.handCount++;
        if (outcome === 'tie') {
            const last = this.lastCell();
            if (last)
                last.ties++;
            else
                this.pendingTies++;
            return;
        }
        const cell = { result: outcome, ties: 0, handIndex: this.handCount };
        const current = this.columns[this.columns.length - 1];
        if (!current || current[0].result !== outcome) {
            this.columns.push([cell]);
            if (this.columns.length === 1 && this.pendingTies > 0) {
                cell.ties += this.pendingTies;
                this.pendingTies = 0;
            }
        }
        else {
            current.push(cell);
        }
    }
    lastCell() {
        const column = this.columns[this.columns.length - 1];
        return column ? column[column.length - 1] : null;
    }
    /** אורך הרצף הנוכחי. */
    get currentStreak() {
        const column = this.columns[this.columns.length - 1];
        return column ? column.length : 0;
    }
    /** הרצף הארוך ביותר שנרשם. */
    get longestStreak() {
        return this.columns.reduce((max, c) => Math.max(max, c.length), 0);
    }
    /**
     * הטלה לרשת תצוגה בגובה 6 שורות.
     * כאשר עמודה עוברת 6 תוצאות, הרצף "מתעקל" ימינה — "זנב הדרקון".
     */
    grid(maxColumns = 24, rows = 6) {
        const map = new Map();
        let maxUsedColumn = 0;
        this.columns.forEach((column, columnIndex) => {
            let col = columnIndex;
            let row = 0;
            column.forEach((cell, i) => {
                if (i === 0) {
                    col = columnIndex;
                    row = 0;
                }
                else if (row + 1 < rows && !map.has(`${col},${row + 1}`)) {
                    row = row + 1;
                }
                else {
                    col = col + 1;
                }
                while (map.has(`${col},${row}`))
                    col++;
                map.set(`${col},${row}`, cell);
                if (col > maxUsedColumn)
                    maxUsedColumn = col;
            });
        });
        const startColumn = Math.max(0, maxUsedColumn - maxColumns + 1);
        const grid = [];
        for (let r = 0; r < rows; r++) {
            const line = [];
            for (let c = 0; c < maxColumns; c++) {
                line.push(map.get(`${startColumn + c},${r}`) ?? null);
            }
            grid.push(line);
        }
        return grid;
    }
}
/** לוח חרוזים: כל התוצאות לפי סדר, 6 שורות בעמודה. */
export function beadPlate(history, columns = 12, rows = 6) {
    const capacity = columns * rows;
    const recent = history.slice(-capacity);
    const grid = Array.from({ length: rows }, () => new Array(columns).fill(null));
    recent.forEach((outcome, i) => {
        const col = Math.floor(i / rows);
        const row = i % rows;
        if (col < columns)
            grid[row][col] = outcome;
    });
    return grid;
}
export function summarize(history) {
    const road = new BigRoad();
    for (const outcome of history)
        road.add(outcome);
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
export const ROAD_NOTE_HE = 'הלוחות מציגים מה כבר קרה. הם אינם משנים את ההסתברות של היד הבאה — כל יד בלתי תלויה בקודמותיה.';
/**
 * בקזינו מוצגים לעיתים גם לוחות נגזרים (Big Eye Boy, Small Road, Cockroach Pig),
 * הנגזרים מכניקנית מהדרך הגדולה. האפליקציה מציגה רק לוחות שהחוקים המדויקים שלהם
 * מיושמים כאן במלואם, ולכן היא נמנעת מהצגתם — ובכל מקרה, גם הם אינם מנבאים דבר.
 */
export const DERIVED_ROADS_NOTE_HE = 'בקזינו מוצגים לעיתים גם לוחות נגזרים (Big Eye Boy, Small Road, Cockroach Pig) הנגזרים מהדרך הגדולה. האפליקציה מציגה את שני הלוחות הבסיסיים בלבד — לוח החרוזים והדרך הגדולה — שאת חוקיהם היא מיישמת במדויק. גם הלוחות הנגזרים אינם מספקים מידע על היד הבאה.';
//# sourceMappingURL=road.js.map