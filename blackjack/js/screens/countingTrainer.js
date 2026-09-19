/** אימון ספירה — קלפים מופיעים בקצב, המשתמש שומר את הספירה בראש. */
import { buildShoeCards, hiLoValue } from "../engine/cards.js";
import { createRng, fisherYatesShuffle } from "../engine/rng.js";
import { runningCount } from "../engine/counting.js";
import { appStore, recordAnswer, state, updateProgress, updateStats } from "../state/appState.js";
import { checkAchievements } from "../content/progression.js";
import { h, num, pct } from "../ui/dom.js";
import { button, numberPad, segmented } from "../ui/components/controls.js";
import { achievementToast, answerBanner } from "../ui/components/feedbackUi.js";
import { cardView } from "../ui/components/playingCard.js";
import { note, panel, screen, statTile } from "../ui/components/layout.js";
import { sfx } from "../ui/feedback.js";
const LEVELS = [
    { key: 'beginner', label: 'מתחיל', decks: 1, cards: 20, intervalMs: 2000, distractions: false, multiplier: 1 },
    { key: 'easy', label: 'קל', decks: 1, cards: 30, intervalMs: 1400, distractions: false, multiplier: 1.3 },
    { key: 'medium', label: 'בינוני', decks: 2, cards: 52, intervalMs: 1000, distractions: false, multiplier: 1.8 },
    { key: 'hard', label: 'קשה', decks: 4, cards: 78, intervalMs: 700, distractions: true, multiplier: 2.4 },
    { key: 'expert', label: 'מומחה', decks: 6, cards: 104, intervalMs: 500, distractions: true, multiplier: 3.2 },
    { key: 'master', label: 'אלוף', decks: 8, cards: 156, intervalMs: 340, distractions: true, multiplier: 4 },
];
const DISTRACTIONS = [
    'משקה? ☕',
    'שולחן 7 פתוח',
    'מזל טוב! 🎉',
    'הימורים בבקשה',
    'הדילר מתחלף',
    '💬 שיחה ברקע',
];
export function countingTrainerScreen() {
    const rng = createRng();
    let level = LEVELS.find((l) => l.key === state().settings.difficulty) ?? LEVELS[2];
    let phase = 'setup';
    let deck = [];
    let index = 0;
    let actualCount = 0;
    let startedAt = 0;
    let finishedAt = 0;
    let timer;
    let answerValue = 0;
    let answeredCorrect = false;
    let reaction = 0;
    const host = h('div', { class: 'stack' });
    const stage = h('div', { class: 'count-stage' });
    const clearTimer = () => {
        if (timer !== undefined) {
            clearInterval(timer);
            timer = undefined;
        }
    };
    const showDistraction = () => {
        if (!level.distractions || rng() > 0.25)
            return;
        const el = h('span', {
            class: 'count-distraction',
            text: DISTRACTIONS[Math.floor(rng() * DISTRACTIONS.length)],
            style: { top: `${15 + rng() * 60}%` },
        });
        stage.appendChild(el);
        setTimeout(() => el.remove(), 2700);
    };
    const start = () => {
        deck = fisherYatesShuffle(buildShoeCards(level.decks), rng).slice(0, level.cards);
        actualCount = runningCount(deck);
        index = 0;
        phase = 'running';
        startedAt = Date.now();
        render();
        timer = setInterval(() => {
            if (index >= deck.length) {
                clearTimer();
                finishedAt = Date.now();
                phase = 'answer';
                render();
                return;
            }
            const card = deck[index++];
            stage.replaceChildren(cardView(card, { animate: false }));
            showDistraction();
            sfx.tick();
            renderProgress();
        }, level.intervalMs);
    };
    const progressEl = h('div', { class: 'timer-bar' }, h('div', { class: 'timer-fill', style: { width: '0%' } }));
    const renderProgress = () => {
        const fill = progressEl.firstElementChild;
        fill.style.width = `${(index / Math.max(1, deck.length)) * 100}%`;
    };
    const submit = (value) => {
        answerValue = value;
        answeredCorrect = value === actualCount;
        reaction = Date.now() - finishedAt;
        recordAnswer('runningCount', answeredCorrect, reaction);
        const elapsed = (finishedAt - startedAt) / 1000;
        const perCard = elapsed / Math.max(1, deck.length);
        const score = answeredCorrect ? Math.round(deck.length * 10 * level.multiplier + Math.max(0, 60 - reaction / 100)) : 0;
        updateStats((s) => ({
            countingSessions: s.countingSessions + 1,
            bestCountingAccuracy: Math.max(s.bestCountingAccuracy, answeredCorrect ? 1 : 0),
            perfectDecks: s.perfectDecks + (answeredCorrect && deck.length >= 52 ? 1 : 0),
            trainingTimeMs: s.trainingTimeMs + (finishedAt - startedAt),
        }));
        const unlocked = checkAchievements(appStore.get());
        if (unlocked.length) {
            updateProgress((p) => ({
                achievements: { ...p.achievements, ...Object.fromEntries(unlocked.map((a) => [a.id, Date.now()])) },
            }));
            for (const a of unlocked)
                achievementToast(a.icon, a.title);
        }
        phase = 'result';
        render(score, perCard);
    };
    const render = (score = 0, perCard = 0) => {
        host.replaceChildren();
        if (phase === 'setup') {
            host.append(panel({ title: 'בחר רמת קושי', subtitle: 'הקלפים יופיעו בזה אחר זה — שמור את הספירה בראש', icon: '⚡' }, segmented(LEVELS.map((l) => ({ value: l.key, label: l.label, hint: `${l.cards} קלפים` })), level.key, (value) => {
                level = LEVELS.find((l) => l.key === value) ?? level;
                render();
            }, 'רמת קושי'), h('div', { class: 'grid grid-3' }, statTile('חפיסות', String(level.decks)), statTile('קלפים', String(level.cards)), statTile('קצב', `${(level.intervalMs / 1000).toFixed(2)} שנ׳`)), level.distractions ? h('p', { class: 'text-faint', text: 'ברמה זו יופיעו הסחות דעת — בדיוק כמו בשולחן אמיתי.' }) : null, button('התחל אימון', start, { tone: 'gold', wide: true })), note('ערכי Hi-Lo: 2-6 = ‎+1 · 7-9 = 0 · 10/J/Q/K/A = ‎-1'));
            return;
        }
        if (phase === 'running') {
            host.appendChild(panel({ title: `${level.label} · ${index}/${deck.length}`, icon: '👀' }, stage, progressEl, button('עצור', () => {
                clearTimer();
                phase = 'setup';
                render();
            }, { tone: 'ghost', wide: true })));
            return;
        }
        if (phase === 'answer') {
            host.appendChild(panel({ title: 'מה הספירה הרצה?', subtitle: `הוצגו ${deck.length} קלפים`, icon: '🔢' }, numberPad(submit, true)));
            return;
        }
        host.append(panel({ title: answeredCorrect ? 'ספירה מדויקת' : 'ספירה שגויה', icon: answeredCorrect ? '🎯' : '📉' }, answerBanner(answeredCorrect, answeredCorrect ? `נכון — הספירה היא ${actualCount >= 0 ? '+' : ''}${actualCount}` : `התשובה שלך ${answerValue}, הספירה בפועל ${actualCount >= 0 ? '+' : ''}${actualCount}`, `סכום ערכי Hi-Lo של ${deck.length} הקלפים שהוצגו. סטייה נוצרת בדרך כלל כשמאבדים קלף אחד בקצב מהיר.`), h('div', { class: 'grid grid-4' }, statTile('ספירה רצה', `${actualCount >= 0 ? '+' : ''}${actualCount}`), statTile('דיוק', answeredCorrect ? '100%' : '0%', undefined, answeredCorrect ? 'good' : 'bad'), statTile('זמן תגובה', `${(reaction / 1000).toFixed(1)} שנ׳`), statTile('ניקוד', num(score))), h('p', { class: 'text-faint', text: `קצב הצגה: ${perCard.toFixed(2)} שניות לקלף · רמה: ${level.label}` }), button('אימון נוסף', () => {
            phase = 'setup';
            render();
        }, { tone: 'gold', wide: true })), note(`דיוק ספירה כולל: ${pct(state().stats.trainers.runningCount.attempts ? state().stats.trainers.runningCount.correct / state().stats.trainers.runningCount.attempts : 0, 0)} · מפגשים: ${num(state().stats.countingSessions)}`));
    };
    render();
    const element = screen({ title: 'אימון ספירת קלפים', subtitle: 'Hi-Lo במהירות משתנה', showBack: true }, host);
    return { element, onUnmount: clearTimer };
}
export { hiLoValue };
//# sourceMappingURL=countingTrainer.js.map