/** Web Worker להרצת סימולציות מונטה קרלו מבלי לתקוע את הממשק. */
import { compareStrategies, runSimulation, type SimConfig, type SimResult, type SimStrategy } from '../engine/montecarlo.ts';

export type WorkerRequest =
  | { type: 'run'; config: SimConfig }
  | { type: 'compare'; base: Omit<SimConfig, 'strategy'>; strategies: SimStrategy[] };

export type WorkerResponse =
  | { type: 'progress'; completed: number; total: number; strategy?: SimStrategy }
  | { type: 'done'; result: SimResult }
  | { type: 'compareDone'; results: SimResult[] }
  | { type: 'error'; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  const data = event.data;
  try {
    if (data.type === 'run') {
      const result = runSimulation(data.config, (p) => {
        ctx.postMessage({ type: 'progress', completed: p.completed, total: p.total } satisfies WorkerResponse);
      });
      ctx.postMessage({ type: 'done', result } satisfies WorkerResponse);
      return;
    }
    if (data.type === 'compare') {
      const results = compareStrategies(data.base, data.strategies, (p) => {
        ctx.postMessage({ type: 'progress', completed: p.completed, total: p.total, strategy: p.strategy } satisfies WorkerResponse);
      });
      ctx.postMessage({ type: 'compareDone', results } satisfies WorkerResponse);
    }
  } catch (error) {
    ctx.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) } satisfies WorkerResponse);
  }
};
