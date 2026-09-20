/** הרצת סימולציות באקרה ב-Worker, עם נפילה חזרה לחוט הראשי. */
import { compareBaccaratBets, runBaccaratSimulation, } from "../engine/montecarlo.js";
function createWorker() {
    try {
        return new Worker(new URL('../../workers/baccaratWorker.js', import.meta.url), { type: 'module' });
    }
    catch {
        return null;
    }
}
export function runBaccaratAsync(config, onProgress, onDone, onError) {
    const worker = createWorker();
    const fallback = () => {
        try {
            onDone(runBaccaratSimulation(config, (p) => onProgress(p.completed, p.total)));
        }
        catch (error) {
            onError(error instanceof Error ? error.message : String(error));
        }
    };
    if (!worker) {
        setTimeout(fallback, 30);
        return { cancel: () => undefined };
    }
    worker.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'progress')
            onProgress(data.completed, data.total);
        else if (data.type === 'done') {
            onDone(data.result);
            worker.terminate();
        }
        else if (data.type === 'error') {
            onError(data.message);
            worker.terminate();
        }
    };
    worker.onerror = () => {
        worker.terminate();
        fallback();
    };
    worker.postMessage({ type: 'run', config });
    return { cancel: () => worker.terminate() };
}
export function compareBaccaratAsync(base, bets, onProgress, onDone, onError) {
    const worker = createWorker();
    const fallback = () => {
        try {
            onDone(compareBaccaratBets(base, bets, (p) => onProgress(p.completed, p.total, p.bet)));
        }
        catch (error) {
            onError(error instanceof Error ? error.message : String(error));
        }
    };
    if (!worker) {
        setTimeout(fallback, 30);
        return { cancel: () => undefined };
    }
    worker.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'progress')
            onProgress(data.completed, data.total, data.bet);
        else if (data.type === 'compareDone') {
            onDone(data.results);
            worker.terminate();
        }
        else if (data.type === 'error') {
            onError(data.message);
            worker.terminate();
        }
    };
    worker.onerror = () => {
        worker.terminate();
        fallback();
    };
    worker.postMessage({ type: 'compare', base, bets });
    return { cancel: () => worker.terminate() };
}
//# sourceMappingURL=simRunner.js.map