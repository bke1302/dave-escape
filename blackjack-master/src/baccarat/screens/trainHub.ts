/** מרכז האימונים של באקרה. */
import { h, num, pct } from '../../ui/dom.ts';
import { panel, screen, statTile } from '../../ui/components/layout.ts';
import { navigate, type ScreenInstance } from '../../ui/router.ts';
import { sfx } from '../../ui/feedback.ts';
import { adaptiveHint, baccarat, baccaratAccuracy, BACCARAT_DOMAIN_LABEL_HE, type BaccaratDomain } from '../state.ts';

interface TrainerSpec {
  emoji: string;
  title: string;
  sub: string;
  path: string;
  domain: BaccaratDomain;
}

const TRAINERS: TrainerSpec[] = [
  { emoji: '➗', title: 'חישוב יד', sub: 'Modulo 10 במהירות', path: '/baccarat/train/hand', domain: 'handValue' },
  { emoji: '🃏', title: 'הקלף השלישי', sub: 'מי לוקח קלף — ולמה', path: '/baccarat/train/third', domain: 'thirdCard' },
  { emoji: '🧩', title: 'יד מלאה', sub: 'חשב את שתי הידיים וקבע מנצח', path: '/baccarat/train/full', domain: 'fullHand' },
  { emoji: '🗺️', title: 'קריאת לוחות', sub: 'Big Road ו-Bead Plate', path: '/baccarat/train/road', domain: 'road' },
  { emoji: '📐', title: 'הסתברויות', sub: 'יתרון הבית ומשמעותו', path: '/baccarat/probability', domain: 'probability' },
  { emoji: '🔍', title: 'מעקב ותבניות', sub: 'Tracking מול כשלים לוגיים', path: '/baccarat/tracking', domain: 'probability' },
];

export function baccaratTrainHubScreen(): ScreenInstance {
  const b = baccarat();
  const hint = adaptiveHint(b);

  const items = TRAINERS.map((t) => {
    const stats = b.trainers[t.domain];
    const highlight = hint.domain === t.domain;
    return h(
      'button',
      {
        class: 'menu-item',
        attrs: { type: 'button' },
        style: highlight ? { borderColor: 'rgba(227,179,65,0.45)' } : undefined,
        on: {
          click: () => {
            sfx.tap();
            navigate(t.path);
          },
        },
      },
      h('span', { class: 'menu-emoji', text: t.emoji }),
      h(
        'span',
        { class: 'menu-texts' },
        h('span', { class: 'menu-title', text: t.title + (highlight ? ' · מומלץ' : '') }),
        h('span', { class: 'menu-sub', text: t.sub }),
      ),
      stats.attempts ? h('span', { class: 'menu-badge', text: pct(baccaratAccuracy(stats), 0) }) : null,
      h('span', { class: 'menu-arrow', text: '‹' }),
    );
  });

  const element = screen(
    { title: 'אימון החלטות', subtitle: 'המערכת מתאימה את הקושי לביצועים שלך' },
    panel(
      { title: 'המלצת המערכת', subtitle: hint.message, icon: '🎯' },
      h(
        'div',
        { class: 'grid grid-3' },
        statTile('רמת קושי', `${hint.difficulty}/3`),
        statTile('רצף נוכחי', num(b.currentStreak)),
        statTile('רצף שיא', num(b.bestStreak)),
      ),
      hint.domain
        ? h('p', { class: 'text-faint', text: `התחום שדורש חיזוק: ${BACCARAT_DOMAIN_LABEL_HE[hint.domain]}` })
        : null,
    ),
    h('div', { class: 'menu-list' }, ...items),
  );

  return { element };
}
