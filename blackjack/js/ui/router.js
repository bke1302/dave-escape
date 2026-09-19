/** ניתוב מבוסס Hash עם מעברים חלקים ותמיכה בכפתור "חזור". */
const routes = [];
let container = null;
let currentInstance = null;
let currentPath = '';
const history = [];
export function registerScreen(pattern, factory) {
    routes.push({ pattern, segments: pattern.split('/').filter(Boolean), factory });
}
function matchRoute(path) {
    const parts = path.split('/').filter(Boolean);
    for (const route of routes) {
        if (route.segments.length !== parts.length)
            continue;
        const params = {};
        let ok = true;
        for (let i = 0; i < parts.length; i++) {
            const seg = route.segments[i];
            if (seg.startsWith(':'))
                params[seg.slice(1)] = decodeURIComponent(parts[i]);
            else if (seg !== parts[i]) {
                ok = false;
                break;
            }
        }
        if (ok)
            return { route, params };
    }
    return null;
}
export function navigate(path, replace = false) {
    const hash = `#${path}`;
    if (location.hash === hash)
        return;
    if (replace)
        location.replace(hash);
    else
        location.hash = hash;
}
export function back(fallback = '/home') {
    history.pop();
    const previous = history.pop();
    navigate(previous ?? fallback, true);
}
export function currentRoute() {
    return currentPath;
}
function render() {
    if (!container)
        return;
    const path = location.hash.slice(1) || '/splash';
    const match = matchRoute(path);
    if (!match) {
        navigate('/home', true);
        return;
    }
    currentInstance?.onUnmount?.();
    const previous = container.firstElementChild;
    if (previous)
        previous.remove();
    const instance = match.route.factory(match.params);
    currentInstance = instance;
    currentPath = path;
    if (history[history.length - 1] !== path)
        history.push(path);
    if (history.length > 40)
        history.shift();
    instance.element.classList.add('screen-enter');
    container.appendChild(instance.element);
    instance.onMount?.();
    requestAnimationFrame(() => {
        instance.element.classList.remove('screen-enter');
    });
    container.scrollTop = 0;
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent('route:changed', { detail: { path } }));
}
export function startRouter(root) {
    container = root;
    window.addEventListener('hashchange', render);
    render();
}
//# sourceMappingURL=router.js.map