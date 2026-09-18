/** רכיבי פריסה בסיסיים — מסך, כותרת, כרטיס וסרגל ניווט. */
import { h } from '../dom.ts';
import { back, navigate } from '../router.ts';
import { sfx } from '../feedback.ts';

export interface ScreenOptions {
  title?: string;
  subtitle?: string;
  /** הצגת כפתור חזרה. */
  showBack?: boolean;
  /** פעולה בצד השני של הכותרת. */
  action?: HTMLElement;
  /** מחלקת עיצוב נוספת. */
  variant?: 'default' | 'table' | 'plain';
  /** הצגת סרגל ניווט תחתון. */
  nav?: boolean;
}

export function appHeader(options: ScreenOptions): HTMLElement {
  return h(
    'header',
    { class: 'app-header' },
    options.showBack
      ? h(
          'button',
          {
            class: 'icon-btn',
            attrs: { 'aria-label': 'חזור', type: 'button' },
            on: {
              click: () => {
                sfx.tap();
                back();
              },
            },
          },
          h('span', { class: 'icon-chevron', text: '›' }),
        )
      : h('span', { class: 'header-spacer' }),
    h(
      'div',
      { class: 'header-titles' },
      options.title ? h('h1', { class: 'header-title', text: options.title }) : null,
      options.subtitle ? h('p', { class: 'header-subtitle', text: options.subtitle }) : null,
    ),
    options.action ?? h('span', { class: 'header-spacer' }),
  );
}

export const NAV_ITEMS = [
  { path: '/home', label: 'בית', icon: '🏠' },
  { path: '/game', label: 'משחק', icon: '🎰' },
  { path: '/training', label: 'אימון', icon: '🧠' },
  { path: '/stats', label: 'נתונים', icon: '📊' },
  { path: '/settings', label: 'הגדרות', icon: '⚙️' },
];

export function bottomNav(activePath: string): HTMLElement {
  return h(
    'nav',
    { class: 'bottom-nav', attrs: { 'aria-label': 'ניווט ראשי' } },
    ...NAV_ITEMS.map((item) =>
      h(
        'button',
        {
          class: `nav-item${activePath.startsWith(item.path) ? ' active' : ''}`,
          attrs: { type: 'button', 'aria-label': item.label, 'aria-current': activePath.startsWith(item.path) ? 'page' : 'false' },
          on: {
            click: () => {
              sfx.tap();
              navigate(item.path);
            },
          },
        },
        h('span', { class: 'nav-icon', text: item.icon }),
        h('span', { class: 'nav-label', text: item.label }),
      ),
    ),
  );
}

/** מעטפת מסך סטנדרטית. */
export function screen(options: ScreenOptions, ...content: (Node | null | false)[]): HTMLElement {
  const body = h('main', { class: 'screen-body' }, ...content.filter(Boolean));
  return h(
    'div',
    { class: `screen screen-${options.variant ?? 'default'}${options.nav === false ? ' no-nav' : ''}` },
    options.title || options.showBack ? appHeader(options) : null,
    body,
    options.nav === false ? null : bottomNav(location.hash.slice(1) || '/home'),
  );
}

export interface CardOptions {
  title?: string;
  subtitle?: string;
  icon?: string;
  class?: string;
  onClick?: () => void;
}

/** כרטיס זכוכית סטנדרטי. */
export function panel(options: CardOptions, ...content: (Node | string | null | false)[]): HTMLElement {
  const el = h(
    options.onClick ? 'button' : 'div',
    {
      class: `panel${options.class ? ` ${options.class}` : ''}${options.onClick ? ' panel-action' : ''}`,
      attrs: options.onClick ? { type: 'button' } : {},
      on: options.onClick
        ? {
            click: () => {
              sfx.tap();
              options.onClick?.();
            },
          }
        : {},
    },
    options.title || options.icon
      ? h(
          'div',
          { class: 'panel-head' },
          options.icon ? h('span', { class: 'panel-icon', text: options.icon }) : null,
          h(
            'div',
            { class: 'panel-head-text' },
            options.title ? h('h2', { class: 'panel-title', text: options.title }) : null,
            options.subtitle ? h('p', { class: 'panel-subtitle', text: options.subtitle }) : null,
          ),
        )
      : null,
    ...content.filter((c) => c !== null && c !== false).map((c) => (typeof c === 'string' ? h('p', { class: 'panel-text', text: c }) : (c as Node))),
  );
  return el;
}

/** שורת סטטיסטיקה קומפקטית. */
export function statTile(label: string, value: string, hint?: string, tone?: 'good' | 'bad' | 'neutral'): HTMLElement {
  return h(
    'div',
    { class: `stat-tile${tone ? ` tone-${tone}` : ''}` },
    h('span', { class: 'stat-value', text: value }),
    h('span', { class: 'stat-label', text: label }),
    hint ? h('span', { class: 'stat-hint', text: hint }) : null,
  );
}

export function grid(columns: number, ...children: (Node | null | false)[]): HTMLElement {
  return h('div', { class: `grid grid-${columns}` }, ...children.filter(Boolean));
}

export function divider(text?: string): HTMLElement {
  return text ? h('div', { class: 'divider with-text' }, h('span', { text })) : h('div', { class: 'divider' });
}

export function note(text: string, icon: string = 'ℹ️'): HTMLElement {
  return h('div', { class: 'note' }, h('span', { class: 'note-icon', text: icon }), h('p', { text }));
}

export function emptyState(icon: string, title: string, text: string): HTMLElement {
  return h(
    'div',
    { class: 'empty-state' },
    h('span', { class: 'empty-icon', text: icon }),
    h('h3', { text: title }),
    h('p', { text }),
  );
}
