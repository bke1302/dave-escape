/** מסך הבית הראשי — בחירה בין שני המשחקים ולוח מצב משולב. */
import { LEVELS, currentLevel, levelProgress } from '../content/progression.ts';
import { overallAccuracy, state, todayKey } from '../state/appState.ts';
import { baccarat, baccaratOverallAccuracy } from '../baccarat/state.ts';
import { BACCARAT_LESSONS } from '../baccarat/content/lessons.ts';
import { baccaratCurrentLevel, baccaratOverallProgress } from '../baccarat/content/progression.ts';
import { LESSONS } from '../content/lessons.ts';
import { h, num, pct } from '../ui/dom.ts';
import { progressBar } from '../ui/components/charts.ts';
import { button } from '../ui/components/controls.ts';
import { panel, screen, statTile } from '../ui/components/layout.ts';
import { navigate, type ScreenInstance } from '../ui/router.ts';

/** התקדמות כוללת בבלאק ג'ק — ממוצע ההתקדמות בעשר הרמות. */
function blackjackProgress(): number {
  const s = state();
  return LEVELS.reduce((sum, level) => sum + levelProgress(level, s), 0) / LEVELS.length;
}

interface GameCardSpec {
  icon: string;
  title: string;
  tagline: string;
  progress: number;
  stats: [string, string][];
  action: string;
  path: string;
  accent: 'jack' | 'bacc';
}

function gameCard(spec: GameCardSpec): HTMLElement {
  return h(
    'section',
    { class: `game-card accent-${spec.accent}` },
    h(
      'div',
      { class: 'game-card-head' },
      h('span', { class: 'game-card-icon', text: spec.icon }),
      h(
        'div',
        {},
        h('h2', { class: 'game-card-title', text: spec.title }),
        h('p', { class: 'game-card-tagline', text: spec.tagline }),
      ),
    ),
    progressBar(spec.progress, 'התקדמות', pct(spec.progress, 0)),
    h(
      'div',
      { class: 'game-card-stats' },
      ...spec.stats.map(([label, value]) =>
        h('div', { class: 'game-stat' }, h('span', { class: 'game-stat-value', text: value }), h('span', { class: 'game-stat-label', text: label })),
      ),
    ),
    button(spec.action, () => navigate(spec.path), { tone: 'gold', wide: true }),
  );
}

export function mainHomeScreen(): ScreenInstance {
  const s = state();
  const b = baccarat();
  const bjLevel = currentLevel(s);
  const bcLevel = baccaratCurrentLevel(b);
  const bjLessons = LESSONS.filter((l) => s.progress.lessons[l.id]?.completed).length;
  const bcLessons = BACCARAT_LESSONS.filter((l) => b.lessons[l.id]?.completed).length;
  const totalTraining = Math.round((s.stats.trainingTimeMs + b.trainingTimeMs) / 60000);
  const dailyStreak = s.progress.daily.date === todayKey() || s.progress.daily.lastCompletedDate ? s.progress.daily.streak : 0;

  const element = screen(
    { variant: 'default' },
    h(
      'section',
      { class: 'hero main-hero' },
      h('h1', { class: 'hero-title', text: 'CASINO ACADEMY' }),
      h('p', { class: 'hero-tagline', text: 'שני משחקים. מנוע מתמטי אחד. הכול בעברית.' }),
      h(
        'div',
        { class: 'hero-stats' },
        h('span', { class: 'hero-chip', text: `🔥 רצף ${num(dailyStreak)} ימים` }),
        h('span', { class: 'hero-chip', text: `⏱️ ${num(totalTraining)} דק׳ אימון` }),
      ),
    ),

    gameCard({
      icon: '🃏',
      title: 'BLACKJACK',
      tagline: 'למד אסטרטגיה, ספירת קלפים וסימולציית קזינו',
      progress: blackjackProgress(),
      stats: [
        ['רמה', String(bjLevel.level)],
        ['שיעורים', `${bjLessons}/${LESSONS.length}`],
        ['ידיים', num(s.stats.handsPlayed)],
        ['דיוק', pct(overallAccuracy(s.stats), 0)],
      ],
      action: 'כניסה ל-Blackjack',
      path: '/blackjack',
      accent: 'jack',
    }),

    gameCard({
      icon: '♦️',
      title: 'BACCARAT',
      tagline: 'למד את המשחק צעד אחר צעד ותרגל קבלת החלטות',
      progress: baccaratOverallProgress(b),
      stats: [
        ['רמה', String(bcLevel.level)],
        ['שיעורים', `${bcLessons}/${BACCARAT_LESSONS.length}`],
        ['ידיים', num(b.handsPlayed)],
        ['דיוק', pct(baccaratOverallAccuracy(b), 0)],
      ],
      action: 'כניסה ל-Baccarat',
      path: '/baccarat',
      accent: 'bacc',
    }),

    panel(
      { title: 'לוח מצב משולב', icon: '📊', onClick: () => navigate('/overview') },
      h(
        'div',
        { class: 'grid grid-3' },
        statTile('ידיים בסך הכול', num(s.stats.handsPlayed + b.handsPlayed)),
        statTile('זמן אימון', `${num(totalTraining)} דק׳`),
        statTile('רצף שיא', num(Math.max(s.stats.bestStreak, b.bestStreak))),
      ),
    ),

    panel({ icon: '⚖️', title: 'משחק אחראי', subtitle: 'מה סימולציה יכולה — ומה לא', onClick: () => navigate('/responsible') }),
  );

  return { element };
}
