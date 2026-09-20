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
import { blackjackHomeScreen } from "./screens/home.js";
import { mainHomeScreen } from "./screens/mainHome.js";
import { overviewScreen } from "./screens/overview.js";
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
// ── מודול הבאקרה ──────────────────────────────────────────────────────────────
import { baccaratHomeScreen } from "./baccarat/screens/home.js";
import { baccaratLearnScreen } from "./baccarat/screens/learn.js";
import { baccaratLessonScreen } from "./baccarat/screens/lesson.js";
import { baccaratPlayScreen } from "./baccarat/screens/play.js";
import { baccaratTrainHubScreen } from "./baccarat/screens/trainHub.js";
import { baccaratHandTrainerScreen } from "./baccarat/screens/handTrainer.js";
import { baccaratThirdCardTrainerScreen } from "./baccarat/screens/thirdCardTrainer.js";
import { baccaratFullHandTrainerScreen } from "./baccarat/screens/fullHandTrainer.js";
import { baccaratRoadTrainerScreen } from "./baccarat/screens/roadTrainer.js";
import { baccaratProbabilityScreen } from "./baccarat/screens/probability.js";
import { baccaratTrackingScreen } from "./baccarat/screens/tracking.js";
import { baccaratSimulatorScreen } from "./baccarat/screens/simulator.js";
import { baccaratStatsScreen } from "./baccarat/screens/stats.js";
import { baccaratProgressScreen } from "./baccarat/screens/progress.js";
import { baccaratSettingsScreen } from "./baccarat/screens/settings.js";
function registerRoutes() {
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