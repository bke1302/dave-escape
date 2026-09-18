/** חנות מצב מינימלית בסגנון Zustand, עם שמירה מקומית (Local Storage). */

export type Listener<T> = (state: T) => void;

export interface Store<T> {
  get(): T;
  set(patch: Partial<T> | ((state: T) => Partial<T>)): void;
  subscribe(listener: Listener<T>): () => void;
  reset(): void;
}

export interface PersistOptions<T> {
  key: string;
  version: number;
  /** מיזוג מצב שמור עם ברירת המחדל (תומך בשדרוג גרסאות). */
  migrate?: (saved: unknown, version: number) => Partial<T>;
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hasStorage(): boolean {
  try {
    const k = '__bjm_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function createStore<T extends object>(initial: T, persist?: PersistOptions<T>): Store<T> {
  const storageAvailable = typeof localStorage !== 'undefined' && hasStorage();
  let state: T = { ...initial };

  if (persist && storageAvailable) {
    const saved = safeParse(localStorage.getItem(persist.key)) as { v?: number; data?: unknown } | null;
    if (saved && saved.data) {
      const data =
        persist.migrate && saved.v !== persist.version
          ? persist.migrate(saved.data, saved.v ?? 0)
          : (saved.data as Partial<T>);
      state = { ...initial, ...data };
    }
  }

  const listeners = new Set<Listener<T>>();
  let saveTimer: number | undefined;

  const save = (): void => {
    if (!persist || !storageAvailable) return;
    if (saveTimer !== undefined) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(persist.key, JSON.stringify({ v: persist.version, data: state }));
      } catch {
        /* אחסון מלא או חסום — האפליקציה ממשיכה לעבוד ללא שמירה */
      }
    }, 150) as unknown as number;
  };

  return {
    get: () => state,
    set(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      for (const listener of listeners) listener(state);
      save();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      state = { ...initial };
      for (const listener of listeners) listener(state);
      save();
    },
  };
}
