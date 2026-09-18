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
import { homeScreen } from './screens/home.ts';
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

function registerRoutes(): void {
  registerScreen('/splash', splashScreen);
  registerScreen('/home', homeScreen);
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
