/** חנות מצב מינימלית בסגנון Zustand, עם שמירה מקומית (Local Storage). */
function safeParse(raw) {
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function hasStorage() {
    try {
        const k = '__bjm_probe__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return true;
    }
    catch {
        return false;
    }
}
export function createStore(initial, persist) {
    const storageAvailable = typeof localStorage !== 'undefined' && hasStorage();
    let state = { ...initial };
    if (persist && storageAvailable) {
        const saved = safeParse(localStorage.getItem(persist.key));
        if (saved && saved.data) {
            const data = persist.migrate && saved.v !== persist.version
                ? persist.migrate(saved.data, saved.v ?? 0)
                : saved.data;
            state = { ...initial, ...data };
        }
    }
    const listeners = new Set();
    let saveTimer;
    const save = () => {
        if (!persist || !storageAvailable)
            return;
        if (saveTimer !== undefined)
            clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            try {
                localStorage.setItem(persist.key, JSON.stringify({ v: persist.version, data: state }));
            }
            catch {
                /* אחסון מלא או חסום — האפליקציה ממשיכה לעבוד ללא שמירה */
            }
        }, 150);
    };
    return {
        get: () => state,
        set(patch) {
            const next = typeof patch === 'function' ? patch(state) : patch;
            state = { ...state, ...next };
            for (const listener of listeners)
                listener(state);
            save();
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        reset() {
            state = { ...initial };
            for (const listener of listeners)
                listener(state);
            save();
        },
    };
}
//# sourceMappingURL=store.js.map