/** מסך ההתקדמות — רמות, דרישות והישגים. */
import { ACHIEVEMENTS, LEVELS, currentLevel, levelComplete, levelProgress, levelUnlocked, requirementDone } from '../content/progression.ts';
import { state } from '../state/appState.ts';
import { h, num, pct } from '../ui/dom.ts';
import { progressBar, progressRing } from '../ui/components/charts.ts';
import { panel, screen, statTile } from '../ui/components/layout.ts';
import { segmented } from '../ui/components/controls.ts';
import type { ScreenInstance } from '../ui/router.ts';

type Tab = 'levels' | 'achievements';

export function progressScreen(): ScreenInstance {
  let tab: Tab = 'levels';
  const host = h('div', { class: 'stack' });

  const renderLevels = (): HTMLElement[] => {
    const s = state();
    return LEVELS.map((level) => {
      const unlocked = levelUnlocked(level, s);
      const complete = levelComplete(level, s);
      const progress = levelProgress(level, s);
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
            const done = requirementDone(req, s);
            const current = req.current(s);
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
        h('p', { class: 'text-faint', text: `נפתח: ${level.unlocks.join(' · ')}` }),
      );
    });
  };

  const renderAchievements = (): HTMLElement[] => {
    const s = state();
    return [
      h(
        'div',
        { class: 'stack' },
        ...ACHIEVEMENTS.map((a) => {
          const unlocked = Boolean(s.progress.achievements[a.id]) || a.check(s);
          const p = a.progress ? a.progress(s) : unlocked ? 1 : 0;
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
    const s = state();
    const level = currentLevel(s);
    const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(s)).length;

    host.replaceChildren(
      panel(
        { title: `רמה ${level.level} · ${level.title}`, subtitle: level.subtitle, icon: level.icon },
        h(
          'div',
          { class: 'row-center', style: { gap: '18px' } },
          progressRing(levelProgress(level, s), pct(levelProgress(level, s), 0), 'ברמה הנוכחית'),
          h(
            'div',
            { class: 'grid grid-2', style: { flex: '1' } },
            statTile('XP', num(s.progress.xp)),
            statTile('הישגים', `${unlockedCount}/${ACHIEVEMENTS.length}`),
            statTile('רצף שיא', num(s.stats.bestStreak)),
            statTile('רצף יומי', num(s.progress.daily.streak)),
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
  const element = screen({ title: 'ההתקדמות שלי', subtitle: '10 רמות מקצה לקצה', showBack: true }, host);
  return { element };
}
