/** מסך ההתקדמות של אקדמיית הבאקרה. */
import { h, num, pct } from '../../ui/dom.ts';
import { progressBar, progressRing } from '../../ui/components/charts.ts';
import { segmented } from '../../ui/components/controls.ts';
import { panel, screen, statTile } from '../../ui/components/layout.ts';
import type { ScreenInstance } from '../../ui/router.ts';
import { baccarat } from '../state.ts';
import {
  BACCARAT_ACHIEVEMENTS,
  BACCARAT_LEVELS,
  baccaratCurrentLevel,
  baccaratLevelComplete,
  baccaratLevelProgress,
  baccaratLevelUnlocked,
  baccaratOverallProgress,
  baccaratRequirementDone,
} from '../content/progression.ts';

type Tab = 'levels' | 'achievements';

export function baccaratProgressScreen(): ScreenInstance {
  let tab: Tab = 'levels';
  const host = h('div', { class: 'stack' });

  const renderLevels = (): HTMLElement[] => {
    const b = baccarat();
    return BACCARAT_LEVELS.map((level) => {
      const unlocked = baccaratLevelUnlocked(level, b);
      const complete = baccaratLevelComplete(level, b);
      const progress = baccaratLevelProgress(level, b);
      return panel(
        { class: `level-card${unlocked ? '' : ' locked'}` },
        h(
          'div',
          { class: 'level-head' },
          h('span', { class: 'level-badge', text: complete ? '✓' : unlocked ? level.icon : '🔒' }),
          h(
            'div',
            { class: 'panel-head-text' },
            h('h2', { class: 'panel-title', text: `רמה ${level.level} · ${level.title}` }),
            h('p', { class: 'panel-subtitle', text: level.subtitle }),
          ),
          complete ? h('span', { class: 'pill good', text: 'הושלם' }) : h('span', { class: 'pill', text: pct(progress, 0) }),
        ),
        progressBar(progress),
        h(
          'div',
          { class: 'stack', style: { gap: '4px' } },
          ...level.requirements.map((req) => {
            const done = baccaratRequirementDone(req, b);
            const current = req.current(b);
            const valueText =
              req.format === 'percent'
                ? `${pct(current, 0)} / ${pct(req.target, 0)}`
                : `${num(Math.min(current, req.target))} / ${num(req.target)}`;
            return h(
              'div',
              { class: `req-row${done ? ' done' : ''}` },
              h('span', { class: 'req-mark', text: done ? '✓' : '' }),
              h('span', { text: req.label }),
              h('span', { class: 'row-value', style: { marginInlineStart: 'auto' }, text: valueText }),
            );
          }),
        ),
        h('p', { class: 'text-faint', text: `נפתח: ${level.unlocks}` }),
      );
    });
  };

  const renderAchievements = (): HTMLElement[] => {
    const b = baccarat();
    return [
      h(
        'div',
        { class: 'stack' },
        ...BACCARAT_ACHIEVEMENTS.map((a) => {
          const unlocked = Boolean(b.achievements[a.id]) || a.check(b);
          const p = a.progress ? a.progress(b) : unlocked ? 1 : 0;
          return h(
            'div',
            { class: `achievement-card${unlocked ? ' unlocked' : ''}` },
            h('span', { class: 'achievement-icon', text: a.icon }),
            h(
              'div',
              { class: 'achievement-texts' },
              h('div', { class: 'achievement-title', text: a.title }),
              h('div', { class: 'achievement-desc', text: a.description }),
              unlocked ? null : progressBar(p, undefined, pct(p, 0)),
            ),
            unlocked ? h('span', { class: 'pill gold', text: 'נפתח' }) : null,
          );
        }),
      ),
    ];
  };

  const render = (): void => {
    const b = baccarat();
    const level = baccaratCurrentLevel(b);
    const unlockedCount = BACCARAT_ACHIEVEMENTS.filter((a) => a.check(b)).length;

    host.replaceChildren(
      panel(
        { title: `רמה ${level.level} · ${level.title}`, subtitle: level.subtitle, icon: level.icon },
        h(
          'div',
          { class: 'row-center', style: { gap: '18px' } },
          progressRing(baccaratOverallProgress(b), pct(baccaratOverallProgress(b), 0), 'מסלול מלא'),
          h(
            'div',
            { class: 'grid grid-2', style: { flex: '1' } },
            statTile('XP', num(b.xp)),
            statTile('הישגים', `${unlockedCount}/${BACCARAT_ACHIEVEMENTS.length}`),
            statTile('ידיים', num(b.handsPlayed)),
            statTile('רצף שיא', num(b.bestStreak)),
          ),
        ),
      ),
      segmented(
        [
          { value: 'levels', label: 'רמות' },
          { value: 'achievements', label: 'הישגים' },
        ],
        tab,
        (value) => {
          tab = value as Tab;
          render();
        },
        'תצוגה',
      ),
      ...(tab === 'levels' ? renderLevels() : renderAchievements()),
    );
  };

  render();
  return { element: screen({ title: 'ההתקדמות שלי', subtitle: '14 רמות באקדמיית הבאקרה', showBack: true }, host) };
}
