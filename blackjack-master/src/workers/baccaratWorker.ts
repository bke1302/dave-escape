/** Web Worker לסימולציות באקרה. */
import {
  compareBaccaratBets,
  runBaccaratSimulation,
  type BaccaratSimConfig,
  type BaccaratSimResult,
  type BetChoice,
} from '../baccarat/engine/montecarlo.ts';

export type BaccaratWorkerRequest =
  | { type: 'run'; config: BaccaratSimConfig }
  | { type: 'compare'; base: Omit<BaccaratSimConfig, 'bet'>; bets: BetChoice[] };

export type BaccaratWorkerResponse =
  | { type: 'progress'; completed: number; total: number; bet?: BetChoice }
  | { type: 'done'; result: BaccaratSimResult }
  | { type: 'compareDone'; results: BaccaratSimResult[] }
  | { type: 'error'; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<BaccaratWorkerRequest>): void => {
  const data = event.data;
  try {
    if (data.type === 'run') {
      const result = runBaccaratSimulation(data.config, (p) => {
        ctx.postMessage({ type: 'progress', completed: p.completed, total: p.total } satisfies BaccaratWorkerResponse);
      });
      ctx.postMessage({ type: 'done', result } satisfies BaccaratWorkerResponse);
      return;
    }
    const results = compareBaccaratBets(data.base, data.bets, (p) => {
      ctx.postMessage({ type: 'progress', completed: p.completed, total: p.total, bet: p.bet } satisfies BaccaratWorkerResponse);
    });
    ctx.postMessage({ type: 'compareDone', results } satisfies BaccaratWorkerResponse);
  } catch (error) {
    ctx.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) } satisfies BaccaratWorkerResponse);
  }
};
