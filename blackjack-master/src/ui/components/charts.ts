/** גרפים קלילים מבוססי SVG — ללא ספריות חיצוניות. */
import { h, num } from '../dom.ts';

const NS = 'http://www.w3.org/2000/svg';

function svg(width: number, height: number, className: string): SVGSVGElement {
  const el = document.createElementNS(NS, 'svg');
  el.setAttribute('viewBox', `0 0 ${width} ${height}`);
  el.setAttribute('preserveAspectRatio', 'none');
  el.setAttribute('class', className);
  el.setAttribute('role', 'img');
  return el;
}

function node(tag: string, attrs: Record<string, string | number>): SVGElement {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** גרף קו של הון לאורך זמן. */
export function lineChart(values: readonly number[], options: { label?: string; height?: number } = {}): HTMLElement {
  const width = 300;
  const height = options.height ?? 120;
  const wrap = h('div', { class: 'chart' });
  if (values.length < 2) {
    wrap.appendChild(h('p', { class: 'chart-empty', text: 'אין מספיק נתונים להצגה' }));
    return wrap;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => `${(i * stepX).toFixed(2)},${(height - ((v - min) / range) * (height - 8) - 4).toFixed(2)}`);

  const chart = svg(width, height, 'line-chart');
  chart.setAttribute('aria-label', options.label ?? 'גרף');
  const baselineY = height - ((values[0] - min) / range) * (height - 8) - 4;
  chart.appendChild(node('line', { x1: 0, y1: baselineY, x2: width, y2: baselineY, class: 'chart-baseline' }));
  chart.appendChild(node('polyline', { points: points.join(' '), class: 'chart-line' }));
  chart.appendChild(
    node('polygon', {
      points: `0,${height} ${points.join(' ')} ${width},${height}`,
      class: `chart-area ${values[values.length - 1] >= values[0] ? 'up' : 'down'}`,
    }),
  );
  wrap.appendChild(chart);
  wrap.appendChild(
    h(
      'div',
      { class: 'chart-legend' },
      h('span', { text: `שיא ${num(max)}` }),
      h('span', { text: `שפל ${num(min)}` }),
    ),
  );
  return wrap;
}

/** גרף עמודות להשוואה. */
export function barChart(
  items: { label: string; value: number; tone?: 'good' | 'bad' | 'neutral' }[],
  format: (v: number) => string = (v) => num(v, 2),
): HTMLElement {
  const maxAbs = Math.max(...items.map((i) => Math.abs(i.value)), 1e-9);
  return h(
    'div',
    { class: 'bar-chart' },
    ...items.map((item) => {
      const ratio = Math.abs(item.value) / maxAbs;
      const tone = item.tone ?? (item.value >= 0 ? 'good' : 'bad');
      return h(
        'div',
        { class: 'bar-row' },
        h('span', { class: 'bar-label', text: item.label }),
        h(
          'div',
          { class: 'bar-track' },
          h('div', { class: `bar-fill tone-${tone}`, style: { width: `${Math.max(2, ratio * 100)}%` } }),
        ),
        h('span', { class: 'bar-value', text: format(item.value) }),
      );
    }),
  );
}

/** טבעת התקדמות. */
export function progressRing(value: number, label: string, sublabel?: string, size: number = 92): HTMLElement {
  const clamped = Math.max(0, Math.min(1, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const chart = svg(100, 100, 'progress-ring');
  chart.setAttribute('aria-label', `${label}: ${Math.round(clamped * 100)}%`);
  chart.style.width = `${size}px`;
  chart.style.height = `${size}px`;
  chart.appendChild(node('circle', { cx: 50, cy: 50, r: radius, class: 'ring-track' }));
  const arc = node('circle', {
    cx: 50,
    cy: 50,
    r: radius,
    class: 'ring-value',
    'stroke-dasharray': circumference,
    'stroke-dashoffset': circumference * (1 - clamped),
    transform: 'rotate(-90 50 50)',
  });
  chart.appendChild(arc);
  return h(
    'div',
    { class: 'progress-ring-wrap' },
    chart,
    h(
      'div',
      { class: 'ring-center' },
      h('span', { class: 'ring-label', text: label }),
      sublabel ? h('span', { class: 'ring-sublabel', text: sublabel }) : null,
    ),
  );
}

/** פס התקדמות אופקי. */
export function progressBar(value: number, label?: string, valueLabel?: string): HTMLElement {
  const clamped = Math.max(0, Math.min(1, value));
  return h(
    'div',
    { class: 'progress-row' },
    label || valueLabel
      ? h(
          'div',
          { class: 'progress-head' },
          label ? h('span', { class: 'progress-label', text: label }) : null,
          valueLabel ? h('span', { class: 'progress-value', text: valueLabel }) : null,
        )
      : null,
    h(
      'div',
      { class: 'progress-track', attrs: { role: 'progressbar', 'aria-valuenow': Math.round(clamped * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 } },
      h('div', { class: 'progress-fill', style: { width: `${clamped * 100}%` } }),
    ),
  );
}

/** מד ספירה (ספירה רצה/אמיתית) עם צבע לפי עוצמה. */
export function countMeter(label: string, value: number, digits: number = 0): HTMLElement {
  const tone = value > 1 ? 'hot' : value < -1 ? 'cold' : 'neutral';
  const text = `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
  return h(
    'div',
    { class: `count-meter tone-${tone}` },
    h('span', { class: 'count-label', text: label }),
    h('span', { class: 'count-value', text }),
  );
}
