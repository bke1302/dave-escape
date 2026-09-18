/** נקודת הכניסה של האפליקציה. */
import { settings } from "./state/appState.js";
import { primeAudio } from "./ui/feedback.js";
import { registerScreen, startRouter } from "./ui/router.js";
import { bankrollScreen } from "./screens/bankroll.js";
import { bettingTrainerScreen } from "./screens/bettingTrainer.js";
import { casinoAdvancedScreen } from "./screens/casinoAdvanced.js";
import { casinoScreen } from "./screens/casino.js";
import { compareScreen } from "./screens/compare.js";
import { countingTrainerScreen } from "./screens/countingTrainer.js";
import { dailyScreen } from "./screens/daily.js";
import { deckEstimationScreen } from "./screens/deckEstimation.js";
import { deviationTrainerScreen } from "./screens/deviationTrainer.js";
import { gameScreen } from "./screens/game.js";
import { homeScreen } from "./screens/home.js";
import { learnScreen } from "./screens/learn.js";
import { lessonScreen } from "./screens/lesson.js";
import { progressScreen } from "./screens/progress.js";
import { responsibleScreen } from "./screens/responsible.js";
import { runningCountScreen } from "./screens/runningCountTrainer.js";
import { settingsScreen } from "./screens/settings.js";
import { simulatorScreen } from "./screens/simulator.js";
import { splashScreen } from "./screens/splash.js";
import { statsScreen } from "./screens/stats.js";
import { strategyChartScreen } from "./screens/strategyChart.js";
import { strategyTrainerScreen } from "./screens/strategyTrainer.js";
import { trainingScreen } from "./screens/training.js";
import { trueCountScreen } from "./screens/trueCountTrainer.js";
function registerRoutes() {
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
function applyPreferences() {
    document.body.classList.toggle('no-animations', !settings().animations);
}
function bootstrap() {
    const root = document.getElementById('app');
    if (!root)
        throw new Error('לא נמצא אלמנט השורש של האפליקציה');
    applyPreferences();
    registerRoutes();
    startRouter(root);
    const prime = () => {
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
}
else {
    bootstrap();
}
//# sourceMappingURL=main.js.map