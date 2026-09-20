/** מסך שיעור באקרה — הסבר, דוגמה, תרגיל ומבחן. */
import { h } from '../../ui/dom.ts';
import { button, optionGrid } from '../../ui/components/controls.ts';
import { achievementToast, answerBanner } from '../../ui/components/feedbackUi.ts';
import { note, panel, screen } from '../../ui/components/layout.ts';
import { navigate, type ScreenInstance } from '../../ui/router.ts';
import { baccaratLessonById, type BaccaratQuizQuestion } from '../content/lessons.ts';
import { checkBaccaratAchievements } from '../content/progression.ts';
import { baccarat, recordBaccaratAnswer, updateBaccarat } from '../state.ts';

type Stage = 'read' | 'exercise' | 'quiz' | 'done';

export function baccaratLessonScreen(params: Record<string, string>): ScreenInstance {
  const lesson = baccaratLessonById(params.lessonId);
  if (!lesson) {
    return { element: screen({ title: 'שיעור לא נמצא', showBack: true }, note('השיעור המבוקש אינו קיים.')) };
  }

  let stage: Stage = 'read';
  let quizIndex = 0;
  let correctCount = 0;
  let totalQuestions = 0;
  const host = h('div', { class: 'stack' });

  const finish = (): void => {
    const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
    updateBaccarat((s) => ({
      lessons: {
        ...s.lessons,
        [lesson.id]: { completed: true, bestScore: Math.max(score, s.lessons[lesson.id]?.bestScore ?? 0) },
      },
      xp: s.xp + 25,
    }));
    const unlocked = checkBaccaratAchievements(baccarat());
    if (unlocked.length) {
      updateBaccarat((s) => ({
        achievements: { ...s.achievements, ...Object.fromEntries(unlocked.map((a) => [a.id, Date.now()])) },
      }));
      for (const a of unlocked) achievementToast(a.icon, a.title);
    }
    stage = 'done';
    render();
  };

  const questionPanel = (title: string, q: BaccaratQuizQuestion, onDone: () => void): HTMLElement => {
    const feedback = h('div', { class: 'stack' });
    let answered = false;
    return panel(
      { title, subtitle: q.question, icon: '❓' },
      optionGrid(
        q.options.map((label, i) => ({ key: String(i), label })),
        (key, el) => {
          if (answered) return;
          answered = true;
          const correct = Number(key) === q.correctIndex;
          totalQuestions++;
          if (correct) correctCount++;
          recordBaccaratAnswer('quiz', correct);
          el.classList.add(correct ? 'correct' : 'wrong');
          feedback.replaceChildren(
            answerBanner(correct, correct ? 'תשובה נכונה' : `לא נכון — התשובה: ${q.options[q.correctIndex]}`, q.explanation),
            button('המשך', onDone, { tone: 'gold', wide: true }),
          );
        },
        q.options.length > 2 ? 1 : 2,
      ),
      feedback,
    );
  };

  const render = (): void => {
    host.replaceChildren();

    if (stage === 'read') {
      host.appendChild(
        panel(
          { title: lesson.title, subtitle: lesson.subtitle, icon: '📖' },
          h(
            'div',
            { class: 'lesson-body' },
            ...lesson.sections.map((section) =>
              h('div', { class: 'lesson-section' }, h('h3', { text: section.heading }), ...section.body.map((p) => h('p', { text: p }))),
            ),
            h(
              'div',
              { class: 'lesson-example' },
              h('h4', { text: lesson.example.title }),
              ...lesson.example.lines.map((line) => h('p', { text: line })),
            ),
          ),
          button('לתרגיל', () => {
            stage = 'exercise';
            render();
          }, { tone: 'gold', wide: true }),
        ),
      );
      return;
    }

    if (stage === 'exercise') {
      host.appendChild(
        questionPanel('תרגיל', lesson.exercise, () => {
          stage = 'quiz';
          quizIndex = 0;
          render();
        }),
      );
      return;
    }

    if (stage === 'quiz') {
      host.appendChild(
        questionPanel(`שאלת מבחן ${quizIndex + 1} מתוך ${lesson.quiz.length}`, lesson.quiz[quizIndex], () => {
          if (quizIndex + 1 < lesson.quiz.length) {
            quizIndex++;
            render();
          } else finish();
        }),
      );
      return;
    }

    const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
    host.appendChild(
      panel(
        { title: 'השיעור הושלם', subtitle: `ציון: ${score}% (${correctCount}/${totalQuestions})`, icon: score >= 80 ? '🏅' : '📘' },
        h('p', { class: 'text-dim', text: score >= 80 ? 'שליטה יפה בחומר. אפשר להמשיך לשיעור הבא.' : 'כדאי לחזור על השיעור — התרגול הוא שמקבע את החוקים.' }),
        button('חזרה לקורס', () => navigate('/baccarat/learn'), { tone: 'gold', wide: true }),
        lesson.id === 'third-card-banker'
          ? button('לאימון הקלף השלישי', () => navigate('/baccarat/train/third'), { tone: 'primary', wide: true })
          : null,
        lesson.id === 'modulo-ten'
          ? button('לאימון חישוב יד', () => navigate('/baccarat/train/hand'), { tone: 'primary', wide: true })
          : null,
        button('קרא שוב', () => {
          stage = 'read';
          correctCount = 0;
          totalQuestions = 0;
          render();
        }, { tone: 'ghost', wide: true }),
      ),
    );
  };

  render();
  const done = baccarat().lessons[lesson.id]?.completed;
  return {
    element: screen({ title: `${lesson.index}. ${lesson.title}`, subtitle: done ? 'הושלם' : `${lesson.minutes} דקות`, showBack: true }, host),
  };
}
