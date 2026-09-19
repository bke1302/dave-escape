/** עוזרי DOM קלילים — בניית ממשק ללא ספריות חיצוניות. */

export type Child = Node | string | number | null | undefined | false | Child[];

export interface ElementProps {
  class?: string;
  id?: string;
  text?: string;
  html?: string;
  style?: Partial<CSSStyleDeclaration> | string;
  dataset?: Record<string, string>;
  attrs?: Record<string, string | number | boolean | null>;
  on?: Partial<Record<keyof HTMLElementEventMap, (event: never) => void>>;
}

function appendChild(parent: HTMLElement, child: Child): void {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) {
    for (const c of child) appendChild(parent, c);
    return;
  }
  if (child instanceof Node) parent.appendChild(child);
  else parent.appendChild(document.createTextNode(String(child)));
}

/** יוצר אלמנט: h('div', {class:'x'}, 'טקסט'). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.id) el.id = props.id;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.html !== undefined) el.innerHTML = props.html;
  if (props.style) {
    if (typeof props.style === 'string') el.setAttribute('style', props.style);
    else Object.assign(el.style, props.style);
  }
  if (props.dataset) for (const [k, v] of Object.entries(props.dataset)) el.dataset[k] = v;
  if (props.attrs) {
    for (const [k, v] of Object.entries(props.attrs)) {
      if (v === null || v === false) el.removeAttribute(k);
      else el.setAttribute(k, String(v));
    }
  }
  if (props.on) {
    for (const [event, handler] of Object.entries(props.on)) {
      if (handler) el.addEventListener(event, handler as EventListener);
    }
  }
  for (const child of children) appendChild(el, child);
  return el;
}

export function clear(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function qs<T extends HTMLElement>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

export function qsa<T extends HTMLElement>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

/** השהיה מבוססת הבטחה (Promise) — לאנימציות חלוקה. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** ממתין לפריים הבא — מבטיח שהאנימציה תתחיל אחרי ההוספה ל-DOM. */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** פורמט מספר בעברית. */
export function num(value: number, digits: number = 0): string {
  return value.toLocaleString('he-IL', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** פורמט מטבע (ז'יטונים) לפי מוסכמת התצוגה הישראלית: 1,000 ₪. */
export function money(value: number): string {
  return Math.round(value).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  });
}

export function pct(value: number, digits: number = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function signedPct(value: number, digits: number = 2): string {
  return `${value > 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`;
}
