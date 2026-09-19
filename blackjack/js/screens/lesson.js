/** מסך שיעור בודד — הסבר, דוגמה, תרגיל ומבחן. */
import { lessonById } from "../content/lessons.js";
import { checkAchievements } from "../content/progression.js";
import { appStore, recordAnswer, state, updateProgress } from "../state/appState.js";
import { h } from "../ui/dom.js";
import { button, optionGrid } from "../ui/components/controls.js";
import { achievementToast, answerBanner } from "../ui/components/feedbackUi.js";
import { note, panel, screen } from "../ui/components/layout.js";
import { navigate } from "../ui/router.js";
export function lessonScreen(params) {
    const lesson = lessonById(params.lessonId);
    if (!lesson) {
        return { element: screen({ title: 'שיעור לא נמצא', showBack: true }, note('השיעור המבוקש אינו קיים.')) };
    }
    let stage = 'read';
    let quizIndex = 0;
    let correctCount = 0;
    let totalQuestions = 0;
    const host = h('div', { class: 'stack' });
    const finish = () => {
        const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
        updateProgress((p) => ({
            lessons: {
                ...p.lessons,
                [lesson.id]: {
                    completed: true,
                    bestScore: Math.max(score, p.lessons[lesson.id]?.bestScore ?? 0),
                },
            },
            xp: p.xp + 25,
        }));
        const unlocked = checkAchievements(appStore.get());
        if (unlocked.length) {
            updateProgress((p) => ({
                achievements: { ...p.achievements, ...Object.fromEntries(unlocked.map((a) => [a.id, Date.now()])) },
            }));
            for (const a of unlocked)
                achievementToast(a.icon, a.title);
        }
        stage = 'done';
        render();
    };
    const questionPanel = (title, q, onDone) => {
        const banner = h('div', {});
        let answered = false;
        return panel({ title, subtitle: q.question, icon: '❓' }, optionGrid(q.options.map((label, i) => ({ key: String(i), label })), (key, el) => {
            if (answered)
                return;
            answered = true;
            const correct = Number(key) === q.correctIndex;
            totalQuestions++;
            if (correct)
                correctCount++;
            recordAnswer('lessons', correct);
            el.classList.add(correct ? 'correct' : 'wrong');
            banner.replaceChildren(answerBanner(correct, correct ? 'תשובה נכונה' : `לא נכון — התשובה: ${q.options[q.correctIndex]}`, q.explanation), button('המשך', () => onDone(correct), { tone: 'gold', wide: true }));
        }, q.options.length > 2 ? 2 : 1), banner);
    };
    const render = () => {
        host.replaceChildren();
        if (stage === 'read') {
            host.appendChild(panel({ title: lesson.title, subtitle: lesson.subtitle, icon: '📖' }, h('div', { class: 'lesson-body' }, ...lesson.sections.map((section) => h('div', { class: 'lesson-section' }, h('h3', { text: section.heading }), ...section.body.map((p) => h('p', { text: p })))), h('div', { class: 'lesson-example' }, h('h4', { text: lesson.example.title }), ...lesson.example.lines.map((line) => h('p', { text: line })))), button('לתרגיל', () => {
                stage = 'exercise';
                render();
            }, { tone: 'gold', wide: true })));
            return;
        }
        if (stage === 'exercise') {
            host.appendChild(questionPanel('תרגיל', lesson.exercise, () => {
                stage = 'quiz';
                quizIndex = 0;
                render();
            }));
            return;
        }
        if (stage === 'quiz') {
            const q = lesson.quiz[quizIndex];
            host.appendChild(questionPanel(`שאלת מבחן ${quizIndex + 1} מתוך ${lesson.quiz.length}`, q, () => {
                if (quizIndex + 1 < lesson.quiz.length) {
                    quizIndex++;
                    render();
                }
                else
                    finish();
            }));
            return;
        }
        const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const next = lessonById(params.lessonId);
        host.appendChild(panel({ title: 'השיעור הושלם', subtitle: `ציון: ${score}% (${correctCount}/${totalQuestions})`, icon: score >= 80 ? '🏅' : '📘' }, h('p', { class: 'text-dim', text: score >= 80 ? 'שליטה יפה בחומר. אפשר להמשיך לשיעור הבא.' : 'כדאי לחזור על השיעור — כל תשובה נכונה מוסיפה לדיוק הכולל שלך.' }), button('חזרה לקורס', () => navigate('/learn'), { tone: 'gold', wide: true }), button('קרא שוב', () => {
            stage = 'read';
            correctCount = 0;
            totalQuestions = 0;
            render();
        }, { tone: 'ghost', wide: true }), next && next.id === 'basic-strategy'
            ? button('לאימון אסטרטגיה', () => navigate('/strategy'), { tone: 'primary', wide: true })
            : null));
    };
    render();
    const done = state().progress.lessons[lesson.id]?.completed;
    const element = screen({ title: `${lesson.index}. ${lesson.title}`, subtitle: done ? 'הושלם' : `${lesson.minutes} דקות`, showBack: true }, host);
    return { element };
}
//# sourceMappingURL=lesson.js.map