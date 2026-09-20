/** לוח מצב משולב לשני המשחקים. */
import { ACHIEVEMENTS, LEVELS, currentLevel, levelComplete, levelProgress } from '../content/progression.ts';
import { LESSONS } from '../content/lessons.ts';
import { accuracy, overallAccuracy, state } from '../state/appState.ts';
import { BACCARAT_ACHIEVEMENTS, BACCARAT_LEVELS, baccaratCurrentLevel, baccaratLevelComplete, baccaratOverallProgress } from '../baccarat/content/progression.ts';
import { BACCARAT_LESSONS } from '../baccarat/content/lessons.ts';
import { baccarat, baccaratAccuracy, baccaratOverallAccuracy } from '../baccarat/state.ts';
import { h, money, num, pct } from '../ui/dom.ts';
import { barChart, progressBar, progressRing } from '../ui/components/charts.ts';
import { button } from '../ui/components/controls.ts';
import { panel, screen, statTile } from '../ui/components/layout.ts';
import { navigate, type ScreenInstance } from '../ui/router.ts';

export function overviewScreen(): ScreenInstance {
  const s = state();
  const b = baccarat();
  const bjProgress = LEVELS.reduce((sum, l) => sum + levelProgress(l, s), 0) / LEVELS.length;
  const bcProgress = baccaratOverallProgress(b);
  const bjAchievements = ACHIEVEMENTS.filter((a) => a.check(s)).length;
  const bcAchievements = BACCARAT_ACHIEVEMENTS.filter((a) => a.check(b)).length;

  const element = screen(
    { title: 'התקדמות', subtitle: 'שני המשחקים במבט אחד' },
    panel(
      { title: 'התקדמות כוללת', icon: '🏆' },
      h(
        'div',
        { class: 'row-center', style: { gap: '20px' } },
        progressRing(bjProgress, pct(bjProgress, 0), 'בלאק ג׳ק'),
        progressRing(bcProgress, pct(bcProgress, 0), 'באקרה'),
      ),
      barChart(
        [
          { label: 'בלאק ג׳ק', value: bjProgress * 100, tone: 'neutral' },
          { label: 'באקרה', value: bcProgress * 100, tone: 'neutral' },
        ],
        (v) => `${v.toFixed(0)}%`,
      ),
    ),

    panel(
      { title: '🃏 בלאק ג׳ק', subtitle: `רמה ${currentLevel(s).level} · ${currentLevel(s).title}`, icon: '🃏' },
      progressBar(bjProgress, 'התקדמות במסלול', `${LEVELS.filter((l) => levelComplete(l, s)).length}/${LEVELS.length} רמות`),
      h(
        'div',
        { class: 'grid grid-2' },
        statTile('שיעורים', `${LESSONS.filter((l) => s.progress.lessons[l.id]?.completed).length}/${LESSONS.length}`),
        statTile('הישגים', `${bjAchievements}/${ACHIEVEMENTS.length}`),
        statTile('ידיים', num(s.stats.handsPlayed)),
        statTile('דיוק כולל', pct(overallAccuracy(s.stats), 0)),
        statTile('אסטרטגיה', pct(accuracy(s.stats.trainers.strategy), 0)),
        statTile('הון', money(s.stats.bankroll)),
      ),
      button('פתח התקדמות בלאק ג׳ק', () => navigate('/progress'), { tone: 'ghost', wide: true }),
    ),

    panel(
      { title: '♦️ באקרה', subtitle: `רמה ${baccaratCurrentLevel(b).level} · ${baccaratCurrentLevel(b).title}`, icon: '♦️' },
      progressBar(bcProgress, 'התקדמות במסלול', `${BACCARAT_LEVELS.filter((l) => baccaratLevelComplete(l, b)).length}/${BACCARAT_LEVELS.length} רמות`),
      h(
        'div',
        { class: 'grid grid-2' },
        statTile('שיעורים', `${BACCARAT_LESSONS.filter((l) => b.lessons[l.id]?.completed).length}/${BACCARAT_LESSONS.length}`),
        statTile('הישגים', `${bcAchievements}/${BACCARAT_ACHIEVEMENTS.length}`),
        statTile('ידיים', num(b.handsPlayed)),
        statTile('דיוק כולל', pct(baccaratOverallAccuracy(b), 0)),
        statTile('קלף שלישי', pct(baccaratAccuracy(b.trainers.thirdCard), 0)),
        statTile('הון', money(b.bankroll)),
      ),
      button('פתח התקדמות באקרה', () => navigate('/baccarat/progress'), { tone: 'ghost', wide: true }),
    ),

    panel(
      { title: 'זמן אימון', icon: '⏱️' },
      h(
        'div',
        { class: 'grid grid-3' },
        statTile('בלאק ג׳ק', `${Math.round(s.stats.trainingTimeMs / 60000)} דק׳`),
        statTile('באקרה', `${Math.round(b.trainingTimeMs / 60000)} דק׳`),
        statTile('סך הכול', `${Math.round((s.stats.trainingTimeMs + b.trainingTimeMs) / 60000)} דק׳`),
      ),
    ),
  );

  return { element };
}
