/** Web Worker להרצת סימולציות מונטה קרלו מבלי לתקוע את הממשק. */
import { compareStrategies, runSimulation } from "../engine/montecarlo.js";
const ctx = self;
ctx.onmessage = (event) => {
    const data = event.data;
    try {
        if (data.type === 'run') {
            const result = runSimulation(data.config, (p) => {
                ctx.postMessage({ type: 'progress', completed: p.completed, total: p.total });
            });
            ctx.postMessage({ type: 'done', result });
            return;
        }
        if (data.type === 'compare') {
            const results = compareStrategies(data.base, data.strategies, (p) => {
                ctx.postMessage({ type: 'progress', completed: p.completed, total: p.total, strategy: p.strategy });
            });
            ctx.postMessage({ type: 'compareDone', results });
        }
    }
    catch (error) {
        ctx.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    }
};
//# sourceMappingURL=simWorker.js.map