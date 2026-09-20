/** Web Worker לסימולציות באקרה. */
import { compareBaccaratBets, runBaccaratSimulation, } from "../baccarat/engine/montecarlo.js";
const ctx = self;
ctx.onmessage = (event) => {
    const data = event.data;
    try {
        if (data.type === 'run') {
            const result = runBaccaratSimulation(data.config, (p) => {
                ctx.postMessage({ type: 'progress', completed: p.completed, total: p.total });
            });
            ctx.postMessage({ type: 'done', result });
            return;
        }
        const results = compareBaccaratBets(data.base, data.bets, (p) => {
            ctx.postMessage({ type: 'progress', completed: p.completed, total: p.total, bet: p.bet });
        });
        ctx.postMessage({ type: 'compareDone', results });
    }
    catch (error) {
        ctx.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    }
};
//# sourceMappingURL=baccaratWorker.js.map