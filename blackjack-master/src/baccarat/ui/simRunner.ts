/** הרצת סימולציות באקרה ב-Worker, עם נפילה חזרה לחוט הראשי. */
import {
  compareBaccaratBets,
  runBaccaratSimulation,
  type BaccaratSimConfig,
  type BaccaratSimResult,
  type BetChoice,
} from '../engine/montecarlo.ts';
import type { BaccaratWorkerResponse } from '../../workers/baccaratWorker.ts';

export interface BaccaratRunHandle {
  cancel: () => void;
}

function createWorker(): Worker | null {
  try {
    return new Worker(new URL('../../workers/baccaratWorker.js', import.meta.url), { type: 'module' });
  } catch {
    return null;
  }
}

export function runBaccaratAsync(
  config: BaccaratSimConfig,
  onProgress: (completed: number, total: number) => void,
  onDone: (result: BaccaratSimResult) => void,
  onError: (message: string) => void,
): BaccaratRunHandle {
  const worker = createWorker();
  const fallback = (): void => {
    try {
      onDone(runBaccaratSimulation(config, (p) => onProgress(p.completed, p.total)));
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  };
  if (!worker) {
    setTimeout(fallback, 30);
    return { cancel: () => undefined };
  }
  worker.onmessage = (event: MessageEvent<BaccaratWorkerResponse>) => {
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
    worker.terminate();
    fallback();
  };
  worker.postMessage({ type: 'run', config });
  return { cancel: () => worker.terminate() };
}

export function compareBaccaratAsync(
  base: Omit<BaccaratSimConfig, 'bet'>,
  bets: BetChoice[],
  onProgress: (completed: number, total: number, bet?: BetChoice) => void,
  onDone: (results: BaccaratSimResult[]) => void,
  onError: (message: string) => void,
): BaccaratRunHandle {
  const worker = createWorker();
  const fallback = (): void => {
    try {
      onDone(compareBaccaratBets(base, bets, (p) => onProgress(p.completed, p.total, p.bet)));
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  };
  if (!worker) {
    setTimeout(fallback, 30);
    return { cancel: () => undefined };
  }
  worker.onmessage = (event: MessageEvent<BaccaratWorkerResponse>) => {
    const data = event.data;
    if (data.type === 'progress') onProgress(data.completed, data.total, data.bet);
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
    fallback();
  };
  worker.postMessage({ type: 'compare', base, bets });
  return { cancel: () => worker.terminate() };
}
