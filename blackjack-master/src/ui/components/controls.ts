/** כפתורים, בוררים, ז'יטונים ומחוונים. */
import { h, num } from '../dom.ts';
import { sfx } from '../feedback.ts';

export type ButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';

export interface ButtonOptions {
  tone?: ButtonTone;
  icon?: string;
  disabled?: boolean;
  wide?: boolean;
  small?: boolean;
  ariaLabel?: string;
  class?: string;
}

export function button(label: string, onClick: () => void, options: ButtonOptions = {}): HTMLButtonElement {
  return h(
    'button',
    {
      class: [
        'btn',
        `btn-${options.tone ?? 'secondary'}`,
        options.wide ? 'btn-wide' : '',
        options.small ? 'btn-small' : '',
        options.class ?? '',
      ]
        .filter(Boolean)
        .join(' '),
      attrs: { type: 'button', disabled: options.disabled ?? false, 'aria-label': options.ariaLabel ?? label },
      on: {
        click: () => {
          if (options.disabled) return;
          sfx.tap();
          onClick();
        },
      },
    },
    options.icon ? h('span', { class: 'btn-icon', text: options.icon }) : null,
    h('span', { class: 'btn-label', text: label }),
  );
}

export interface SegmentedOption<T> {
  value: T;
  label: string;
  hint?: string;
}

export function segmented<T extends string | number | boolean>(
  options: SegmentedOption<T>[],
  value: T,
  onChange: (value: T) => void,
  ariaLabel: string = 'בחירה',
): HTMLElement {
  const wrap = h('div', { class: 'segmented', attrs: { role: 'radiogroup', 'aria-label': ariaLabel } });
  for (const option of options) {
    wrap.appendChild(
      h(
        'button',
        {
          class: `segment${option.value === value ? ' active' : ''}`,
          attrs: { type: 'button', role: 'radio', 'aria-checked': option.value === value },
          on: {
            click: () => {
              sfx.tap();
              onChange(option.value);
            },
          },
        },
        h('span', { class: 'segment-label', text: option.label }),
        option.hint ? h('span', { class: 'segment-hint', text: option.hint }) : null,
      ),
    );
  }
  return wrap;
}

export function toggle(label: string, value: boolean, onChange: (value: boolean) => void, hint?: string): HTMLElement {
  return h(
    'label',
    { class: 'toggle-row' },
    h(
      'div',
      { class: 'toggle-texts' },
      h('span', { class: 'toggle-label', text: label }),
      hint ? h('span', { class: 'toggle-hint', text: hint }) : null,
    ),
    h(
      'button',
      {
        class: `toggle${value ? ' on' : ''}`,
        attrs: { type: 'button', role: 'switch', 'aria-checked': value, 'aria-label': label },
        on: {
          click: () => {
            sfx.tap();
            onChange(!value);
          },
        },
      },
      h('span', { class: 'toggle-knob' }),
    ),
  );
}

export function slider(
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (value: number) => void,
  format: (v: number) => string = (v) => num(v),
): HTMLElement {
  const valueEl = h('span', { class: 'slider-value', text: format(value) });
  const input = h('input', {
    class: 'slider',
    attrs: { type: 'range', min, max, step, value, 'aria-label': label },
    on: {
      input: (event: Event) => {
        const v = Number((event.target as HTMLInputElement).value);
        valueEl.textContent = format(v);
        onChange(v);
      },
    },
  });
  return h(
    'div',
    { class: 'slider-row' },
    h('div', { class: 'slider-head' }, h('span', { class: 'slider-label', text: label }), valueEl),
    input,
  );
}

export const CHIP_VALUES = [5, 10, 25, 100, 500];

export function chip(value: number, onClick: () => void, disabled: boolean = false): HTMLElement {
  return h(
    'button',
    {
      class: `chip chip-${value}${disabled ? ' disabled' : ''}`,
      attrs: { type: 'button', disabled, 'aria-label': `ז'יטון ${value}` },
      on: {
        click: () => {
          if (disabled) return;
          sfx.chip();
          onClick();
        },
      },
    },
    h('span', { class: 'chip-inner', text: String(value) }),
  );
}

/** שורת בחירת פעולה במשחק (פגע/עמוד/הכפל/פצל/כניעה). */
export interface ActionButtonSpec {
  key: string;
  label: string;
  icon: string;
  tone: ButtonTone;
  disabled?: boolean;
  onClick: () => void;
}

export function actionBar(actions: ActionButtonSpec[]): HTMLElement {
  return h(
    'div',
    { class: 'action-bar' },
    ...actions.map((a) =>
      h(
        'button',
        {
          class: `action-btn action-${a.key}${a.disabled ? ' disabled' : ''}`,
          attrs: { type: 'button', disabled: a.disabled ?? false, 'aria-label': a.label },
          on: {
            click: () => {
              if (a.disabled) return;
              sfx.tap();
              a.onClick();
            },
          },
        },
        h('span', { class: 'action-icon', text: a.icon }),
        h('span', { class: 'action-label', text: a.label }),
      ),
    ),
  );
}

/** רשת אפשרויות לבחירה בתרגילים. */
export function optionGrid(
  options: { label: string; hint?: string; key: string }[],
  onSelect: (key: string, element: HTMLElement) => void,
  columns: number = 2,
): HTMLElement {
  const wrap = h('div', { class: `option-grid cols-${columns}` });
  for (const option of options) {
    const el = h(
      'button',
      {
        class: 'option-btn',
        attrs: { type: 'button', 'data-key': option.key },
        on: {
          click: () => {
            sfx.tap();
            onSelect(option.key, el);
          },
        },
      },
      h('span', { class: 'option-label', text: option.label }),
      option.hint ? h('span', { class: 'option-hint', text: option.hint }) : null,
    );
    wrap.appendChild(el);
  }
  return wrap;
}

/** שדה קלט מספרי גדול לתרגילי ספירה. */
export function numberPad(onSubmit: (value: number) => void, allowNegative: boolean = true): HTMLElement {
  let current = '';
  const display = h('div', { class: 'numpad-display', text: '0' });

  const update = (): void => {
    display.textContent = current === '' || current === '-' ? '0' : current;
  };

  const press = (key: string): void => {
    sfx.tap();
    if (key === 'clear') current = '';
    else if (key === 'back') current = current.slice(0, -1);
    else if (key === 'sign') {
      current = current.startsWith('-') ? current.slice(1) : `-${current}`;
    } else if (key === 'ok') {
      const value = Number(current === '' || current === '-' ? 0 : current);
      onSubmit(value);
      current = '';
    } else if (current.replace('-', '').length < 3) {
      current += key;
    }
    update();
  };

  const keys: { label: string; key: string; class?: string }[] = [
    { label: '7', key: '7' },
    { label: '8', key: '8' },
    { label: '9', key: '9' },
    { label: '4', key: '4' },
    { label: '5', key: '5' },
    { label: '6', key: '6' },
    { label: '1', key: '1' },
    { label: '2', key: '2' },
    { label: '3', key: '3' },
    { label: allowNegative ? '‎±' : '⌫', key: allowNegative ? 'sign' : 'back', class: 'alt' },
    { label: '0', key: '0' },
    { label: '⌫', key: 'back', class: 'alt' },
  ];

  return h(
    'div',
    { class: 'numpad' },
    display,
    h(
      'div',
      { class: 'numpad-keys' },
      ...keys.map((k) =>
        h(
          'button',
          {
            class: `numpad-key${k.class ? ` ${k.class}` : ''}`,
            attrs: { type: 'button', 'aria-label': k.label },
            on: { click: () => press(k.key) },
          },
          k.label,
        ),
      ),
    ),
    button('אישור', () => press('ok'), { tone: 'gold', wide: true }),
  );
}
