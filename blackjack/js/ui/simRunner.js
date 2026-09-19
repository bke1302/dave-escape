/**
 * מריץ סימולציות ב-Web Worker, עם נפילה חזרה להרצה בחוט הראשי
 * אם ה-Worker אינו זמין (למשל בפתיחת הקובץ ישירות מהדיסק).
 */
import { compareStrategies, runSimulation } from "../engine/montecarlo.js";
function createWorker() {
    try {
        return new Worker(new URL('../workers/simWorker.js', import.meta.url), { type: 'module' });
    }
    catch {
        return null;
    }
}
export function runSimulationAsync(config, onProgress, onDone, onError) {
    const worker = createWorker();
    if (!worker) {
        // נפילה חזרה: הרצה סינכרונית (הממשק ייעצר לרגע בסימולציות גדולות)
        setTimeout(() => {
            try {
                onDone(runSimulation(config, (p) => onProgress(p.completed, p.total)));
            }
            catch (error) {
                onError(error instanceof Error ? error.message : String(error));
            }
        }, 30);
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
        // אם ה-Worker נכשל בטעינה — מריצים בחוט הראשי
        worker.terminate();
        try {
            onDone(runSimulation(config, (p) => onProgress(p.completed, p.total)));
        }
        catch (error) {
            onError(error instanceof Error ? error.message : String(error));
        }
    };
    worker.postMessage({ type: 'run', config });
    return { cancel: () => worker.terminate() };
}
export function compareStrategiesAsync(base, strategies, onProgress, onDone, onError) {
    const worker = createWorker();
    if (!worker) {
        setTimeout(() => {
            try {
                onDone(compareStrategies(base, strategies, (p) => onProgress(p.completed, p.total, p.strategy)));
            }
            catch (error) {
                onError(error instanceof Error ? error.message : String(error));
            }
        }, 30);
        return { cancel: () => undefined };
    }
    worker.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'progress')
            onProgress(data.completed, data.total, data.strategy);
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
        try {
            onDone(compareStrategies(base, strategies, (p) => onProgress(p.completed, p.total, p.strategy)));
        }
        catch (error) {
            onError(error instanceof Error ? error.message : String(error));
        }
    };
    worker.postMessage({ type: 'compare', base, strategies });
    return { cancel: () => worker.terminate() };
}
//# sourceMappingURL=simRunner.js.map