/** טבלת אסטרטגיה בסיסית אינטראקטיבית. */
import { CELL_LABEL_HE, DEALER_UPS, type CellCode, type StrategyChart } from '../../engine/basicStrategy.ts';
import { h } from '../dom.ts';

const CELL_CLASS: Record<CellCode, string> = {
  H: 'cell-hit',
  S: 'cell-stand',
  D: 'cell-double',
  Ds: 'cell-double',
  P: 'cell-split',
  R: 'cell-surrender',
  Rs: 'cell-surrender',
  Rp: 'cell-surrender',
};

const CELL_SHORT: Record<CellCode, string> = {
  H: 'ק',
  S: 'ע',
  D: 'הכ',
  Ds: 'הכ/ע',
  P: 'פ',
  R: 'כנ',
  Rs: 'כנ/ע',
  Rp: 'כנ/פ',
};

function headerRow(): HTMLElement {
  return h(
    'tr',
    {},
    h('th', { class: 'corner', text: 'יד' }),
    ...DEALER_UPS.map((up) => h('th', { text: up === 1 ? 'A' : String(up) })),
  );
}

function bodyRow(label: string, cells: CellCode[], onCell?: (code: CellCode) => void): HTMLElement {
  return h(
    'tr',
    {},
    h('th', { class: 'row-head', text: label }),
    ...cells.map((code) =>
      h(
        'td',
        {
          class: `strategy-cell ${CELL_CLASS[code]}`,
          attrs: { title: CELL_LABEL_HE[code], 'aria-label': CELL_LABEL_HE[code] },
          on: onCell ? { click: () => onCell(code) } : {},
        },
        CELL_SHORT[code],
      ),
    ),
  );
}

export type ChartSection = 'hard' | 'soft' | 'pairs';

export function strategyTable(chart: StrategyChart, section: ChartSection): HTMLElement {
  const table = h('table', { class: 'strategy-table', attrs: { role: 'table' } });
  const thead = h('thead', {}, headerRow());
  const tbody = h('tbody', {});

  if (section === 'hard') {
    for (let total = 21; total >= 5; total--) {
      if (total >= 18) {
        if (total === 21 || total === 20 || total === 19) continue;
      }
      tbody.appendChild(bodyRow(String(total), chart.hard[total]));
    }
  } else if (section === 'soft') {
    for (let second = 9; second >= 2; second--) {
      tbody.appendChild(bodyRow(`A,${second}`, chart.soft[second]));
    }
  } else {
    for (let v = 10; v >= 1; v--) {
      tbody.appendChild(bodyRow(v === 1 ? 'A,A' : `${v},${v}`, chart.pairs[v]));
    }
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  return h('div', { class: 'strategy-table-wrap' }, table);
}

export function strategyLegend(): HTMLElement {
  const items: [CellCode, string][] = [
    ['H', 'קח קלף'],
    ['S', 'עמוד'],
    ['D', 'הכפל'],
    ['P', 'פצל'],
    ['R', 'כניעה'],
  ];
  return h(
    'div',
    { class: 'strategy-legend' },
    ...items.map(([code, label]) =>
      h('span', { class: `legend-item ${CELL_CLASS[code]}` }, h('b', { text: CELL_SHORT[code] }), label),
    ),
  );
}
