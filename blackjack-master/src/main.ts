/** נקודת הכניסה של האפליקציה. */
import { settings } from './state/appState.ts';
import { primeAudio } from './ui/feedback.ts';
import { registerScreen, startRouter } from './ui/router.ts';
import { bankrollScreen } from './screens/bankroll.ts';
import { bettingTrainerScreen } from './screens/bettingTrainer.ts';
import { casinoAdvancedScreen } from './screens/casinoAdvanced.ts';
import { casinoScreen } from './screens/casino.ts';
import { compareScreen } from './screens/compare.ts';
import { countingTrainerScreen } from './screens/countingTrainer.ts';
import { dailyScreen } from './screens/daily.ts';
import { deckEstimationScreen } from './screens/deckEstimation.ts';
import { deviationTrainerScreen } from './screens/deviationTrainer.ts';
import { gameScreen } from './screens/game.ts';
import { blackjackHomeScreen } from './screens/home.ts';
import { mainHomeScreen } from './screens/mainHome.ts';
import { overviewScreen } from './screens/overview.ts';
import { learnScreen } from './screens/learn.ts';
import { lessonScreen } from './screens/lesson.ts';
import { progressScreen } from './screens/progress.ts';
import { responsibleScreen } from './screens/responsible.ts';
import { runningCountScreen } from './screens/runningCountTrainer.ts';
import { settingsScreen } from './screens/settings.ts';
import { simulatorScreen } from './screens/simulator.ts';
import { splashScreen } from './screens/splash.ts';
import { statsScreen } from './screens/stats.ts';
import { strategyChartScreen } from './screens/strategyChart.ts';
import { strategyTrainerScreen } from './screens/strategyTrainer.ts';
import { trainingScreen } from './screens/training.ts';
import { trueCountScreen } from './screens/trueCountTrainer.ts';

// ── מודול הבאקרה ──────────────────────────────────────────────────────────────
import { baccaratHomeScreen } from './baccarat/screens/home.ts';
import { baccaratLearnScreen } from './baccarat/screens/learn.ts';
import { baccaratLessonScreen } from './baccarat/screens/lesson.ts';
import { baccaratPlayScreen } from './baccarat/screens/play.ts';
import { baccaratTrainHubScreen } from './baccarat/screens/trainHub.ts';
import { baccaratHandTrainerScreen } from './baccarat/screens/handTrainer.ts';
import { baccaratThirdCardTrainerScreen } from './baccarat/screens/thirdCardTrainer.ts';
import { baccaratFullHandTrainerScreen } from './baccarat/screens/fullHandTrainer.ts';
import { baccaratRoadTrainerScreen } from './baccarat/screens/roadTrainer.ts';
import { baccaratProbabilityScreen } from './baccarat/screens/probability.ts';
import { baccaratTrackingScreen } from './baccarat/screens/tracking.ts';
import { baccaratSimulatorScreen } from './baccarat/screens/simulator.ts';
import { baccaratStatsScreen } from './baccarat/screens/stats.ts';
import { baccaratProgressScreen } from './baccarat/screens/progress.ts';
import { baccaratSettingsScreen } from './baccarat/screens/settings.ts';

function registerRoutes(): void {
  registerScreen('/splash', splashScreen);
  registerScreen('/home', mainHomeScreen);
  registerScreen('/overview', overviewScreen);

  // ── בלאק ג'ק ──
  registerScreen('/blackjack', blackjackHomeScreen);
  registerScreen('/game', gameScreen);
  registerScreen('/learn', learnScreen);
  registerScreen('/learn/:lessonId', lessonScreen);
  registerScreen('/strategy', strategyTrainerScreen);
  registerScreen('/strategy/chart', strategyChartScreen);
  registerScreen('/training', trainingScreen);
  registerScreen('/counting', countingTrainerScreen);
  registerScreen('/running-count', runningCountScreen);
  registerScreen('/true-count', trueCountScreen);
  registerScreen('/deck-estimation', deckEstimationScreen);
  registerScreen('/betting', bettingTrainerScreen);
  registerScreen('/deviations', deviationTrainerScreen);
  registerScreen('/casino', casinoScreen);
  registerScreen('/casino-advanced', casinoAdvancedScreen);
  registerScreen('/simulator', simulatorScreen);
  registerScreen('/compare', compareScreen);
  registerScreen('/bankroll', bankrollScreen);
  registerScreen('/progress', progressScreen);
  registerScreen('/daily', dailyScreen);
  registerScreen('/stats', statsScreen);
  registerScreen('/settings', settingsScreen);
  registerScreen('/responsible', responsibleScreen);

  // ── באקרה ──
  registerScreen('/baccarat', baccaratHomeScreen);
  registerScreen('/baccarat/play', baccaratPlayScreen);
  registerScreen('/baccarat/learn', baccaratLearnScreen);
  registerScreen('/baccarat/learn/:lessonId', baccaratLessonScreen);
  registerScreen('/baccarat/train', baccaratTrainHubScreen);
  registerScreen('/baccarat/train/hand', baccaratHandTrainerScreen);
  registerScreen('/baccarat/train/third', baccaratThirdCardTrainerScreen);
  registerScreen('/baccarat/train/full', baccaratFullHandTrainerScreen);
  registerScreen('/baccarat/train/road', baccaratRoadTrainerScreen);
  registerScreen('/baccarat/probability', baccaratProbabilityScreen);
  registerScreen('/baccarat/tracking', baccaratTrackingScreen);
  registerScreen('/baccarat/simulate', baccaratSimulatorScreen);
  registerScreen('/baccarat/stats', baccaratStatsScreen);
  registerScreen('/baccarat/progress', baccaratProgressScreen);
  registerScreen('/baccarat/settings', baccaratSettingsScreen);
}

function applyPreferences(): void {
  document.body.classList.toggle('no-animations', !settings().animations);
}

function bootstrap(): void {
  const root = document.getElementById('app');
  if (!root) throw new Error('לא נמצא אלמנט השורש של האפליקציה');

  applyPreferences();
  registerRoutes();
  startRouter(root);

  const prime = (): void => {
    primeAudio();
    window.removeEventListener('pointerdown', prime);
  };
  window.addEventListener('pointerdown', prime);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        /* עבודה ללא Service Worker — האפליקציה עדיין פועלת */
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
