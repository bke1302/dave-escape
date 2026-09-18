/**
 * מריץ סימולציות ב-Web Worker, עם נפילה חזרה להרצה בחוט הראשי
 * אם ה-Worker אינו זמין (למשל בפתיחת הקובץ ישירות מהדיסק).
 */
import { compareStrategies, runSimulation, type SimConfig, type SimResult, type SimStrategy } from '../engine/montecarlo.ts';
import type { WorkerResponse } from '../workers/simWorker.ts';

export interface RunHandle {
  cancel: () => void;
}

function createWorker(): Worker | null {
  try {
    return new Worker(new URL('../workers/simWorker.js', import.meta.url), { type: 'module' });
  } catch {
    return null;
  }
}

export function runSimulationAsync(
  config: SimConfig,
  onProgress: (completed: number, total: number) => void,
  onDone: (result: SimResult) => void,
  onError: (message: string) => void,
): RunHandle {
  const worker = createWorker();
  if (!worker) {
    // נפילה חזרה: הרצה סינכרונית (הממשק ייעצר לרגע בסימולציות גדולות)
    setTimeout(() => {
      try {
        onDone(runSimulation(config, (p) => onProgress(p.completed, p.total)));
      } catch (error) {
        onError(error instanceof Error ? error.message : String(error));
      }
    }, 30);
    return { cancel: () => undefined };
  }

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const data = event.data;
    if (data.type === 'progress') onProgress(data.completed, data.total);
    else if (data.type === 'done') {
      onDone(data.result);
      worker.terminate();
    } else if (data.type === 'error') {
      onError(data.message);
      worker.terminate();
    }
  };
  worker.onerror = () => {
    // אם ה-Worker נכשל בטעינה — מריצים בחוט הראשי
    worker.terminate();
    try {
      onDone(runSimulation(config, (p) => onProgress(p.completed, p.total)));
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  };
  worker.postMessage({ type: 'run', config });
  return { cancel: () => worker.terminate() };
}

export function compareStrategiesAsync(
  base: Omit<SimConfig, 'strategy'>,
  strategies: SimStrategy[],
  onProgress: (completed: number, total: number, strategy?: SimStrategy) => void,
  onDone: (results: SimResult[]) => void,
  onError: (message: string) => void,
): RunHandle {
  const worker = createWorker();
  if (!worker) {
    setTimeout(() => {
      try {
        onDone(compareStrategies(base, strategies, (p) => onProgress(p.completed, p.total, p.strategy)));
      } catch (error) {
        onError(error instanceof Error ? error.message : String(error));
      }
    }, 30);
    return { cancel: () => undefined };
  }

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const data = event.data;
    if (data.type === 'progress') onProgress(data.completed, data.total, data.strategy);
    else if (data.type === 'compareDone') {
      onDone(data.results);
      worker.terminate();
    } else if (data.type === 'error') {
      onError(data.message);
      worker.terminate();
    }
  };
  worker.onerror = () => {
    worker.terminate();
    try {
      onDone(compareStrategies(base, strategies, (p) => onProgress(p.completed, p.total, p.strategy)));
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  };
  worker.postMessage({ type: 'compare', base, strategies });
  return { cancel: () => worker.terminate() };
}
