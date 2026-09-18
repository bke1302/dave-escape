/** מאמן אסטרטגיה בסיסית — "למד אותי". */
import { buildShoeCards, rankValue, type Card } from '../engine/cards.ts';
import { ACTION_LABEL_HE, decide, fmtEv, type PlayAction } from '../engine/basicStrategy.ts';
import { handValue, isPair } from '../engine/hand.ts';
import { createRng, fisherYatesShuffle } from '../engine/rng.ts';
import { accuracy, recordAnswer, rules, state } from '../state/appState.ts';
import { h, pct } from '../ui/dom.ts';
import { button, optionGrid } from '../ui/components/controls.ts';
import { answerBanner } from '../ui/components/feedbackUi.ts';
import { handView } from '../ui/components/playingCard.ts';
import { note, panel, screen, statTile } from '../ui/components/layout.ts';
import { navigate, type ScreenInstance } from '../ui/router.ts';

interface Situation {
  player: Card[];
  dealer: Card;
  options: PlayAction[];
}

const rng = createRng();

function dealSituation(allowSurrender: boolean, decks: number): Situation {
  const deck = fisherYatesShuffle(buildShoeCards(decks), rng);
  let player: Card[] = [];
  let dealer: Card = deck[0];
  for (let attempt = 0; attempt < 40; attempt++) {
    const cards = fisherYatesShuffle(buildShoeCards(1), rng);
    player = [cards[0], cards[1]];
    dealer = cards[2];
    const hv = handValue(player);
    // מדלגים על ידיים טריוויאליות ברוב המקרים כדי למקד את האימון.
    const trivial = hv.total >= 19 && !isPair(player);
    if (!trivial || rng() < 0.15) break;
  }
  const options: PlayAction[] = ['hit', 'stand', 'double'];
  if (isPair(player)) options.push('split');
  if (allowSurrender) options.push('surrender');
  return { player, dealer, options };
}

export function strategyTrainerScreen(): ScreenInstance {
  const r = rules();
  let situation = dealSituation(r.surrender === 'late', r.decks);
  let sessionCorrect = 0;
  let sessionTotal = 0;
  let answered = false;
  let startedAt = Date.now();

  const host = h('div', { class: 'stack' });
  const statsHost = h('div', { class: 'grid grid-3' });

  const renderStats = (): void => {
    const s = state();
    statsHost.replaceChildren(
      statTile('במפגש', `${sessionCorrect}/${sessionTotal}`),
      statTile('דיוק כולל', pct(accuracy(s.stats.trainers.strategy), 0)),
      statTile('רצף', String(s.stats.currentStreak)),
    );
  };

  const render = (): void => {
    answered = false;
    startedAt = Date.now();
    const banner = h('div', {});
    const hv = handValue(situation.player);
    const dealerValue = situation.dealer.rank === 'A' ? 'אס' : String(rankValue(situation.dealer.rank));

    host.replaceChildren(
      panel(
        { title: 'מה הפעולה הנכונה?', icon: '🧠' },
        h(
          'div',
          { class: 'row-center', style: { gap: '22px', padding: '6px 0 10px' } },
          h(
            'div',
            { class: 'stack', style: { alignItems: 'center' } },
            h('span', { class: 'text-faint', text: 'הדילר' }),
            handView([situation.dealer], { small: true, showTotal: false }),
            h('span', { class: 'pill', text: dealerValue }),
          ),
          h(
            'div',
            { class: 'stack', style: { alignItems: 'center' } },
            h('span', { class: 'text-faint', text: 'היד שלך' }),
            handView(situation.player, { showTotal: false }),
            h('span', { class: 'pill gold', text: hv.soft ? `רכה ${hv.total}` : `${hv.total}` }),
          ),
        ),
        optionGrid(
          situation.options.map((a) => ({ key: a, label: ACTION_LABEL_HE[a] })),
          (key, el) => {
            if (answered) return;
            answered = true;
            const decision = decide(situation.player, situation.dealer, r, {
              canDouble: true,
              canSplit: isPair(situation.player),
              canSurrender: r.surrender === 'late',
            });
            const correct = key === decision.action;
            sessionTotal++;
            if (correct) sessionCorrect++;
            recordAnswer('strategy', correct, Date.now() - startedAt);
            el.classList.add(correct ? 'correct' : 'wrong');
            const evLine = decision.evs
              .map((e) => `${ACTION_LABEL_HE[e.action]} ${fmtEv(e.ev)}`)
              .join(' · ');
            banner.replaceChildren(
              answerBanner(
                correct,
                correct ? 'נכון' : `לא נכון — הפעולה הנכונה: ${ACTION_LABEL_HE[decision.action]}`,
                decision.explanation,
              ),
              h('p', { class: 'text-faint', text: `תוחלת כל פעולה: ${evLine}` }),
              button('שאלה הבאה', () => {
                situation = dealSituation(r.surrender === 'late', r.decks);
                render();
                renderStats();
              }, { tone: 'gold', wide: true }),
            );
            renderStats();
          },
          situation.options.length > 3 ? 3 : situation.options.length,
        ),
        banner,
      ),
    );
  };

  render();
  renderStats();

  const element = screen(
    { title: 'אסטרטגיה בסיסית', subtitle: 'תרגול החלטות', showBack: true },
    statsHost,
    host,
    panel(
      { title: 'הטבלה המלאה', subtitle: 'מחושבת לפי החוקים שבחרת', icon: '📋' },
      button('פתח טבלת אסטרטגיה', () => navigate('/strategy/chart'), { tone: 'ghost', wide: true }),
    ),
    note('התוחלות מחושבות על ידי מנוע ה-EV של האפליקציה מהרכב הנעל ומחוקי השולחן שבחרת.'),
  );

  return { element };
}
