/**
 * Category route loading boundary.
 *
 * MUST EXIST — this is a hard React 18/19 requirement.
 *
 * Without a file here, the route has no Suspense fallback. React's concurrent
 * mode cannot commit the navigation transition and holds the previous page
 * visible indefinitely (the "frozen / needs second click" bug). The loading.tsx
 * file provides the Suspense fallback so React can commit immediately.
 *
 * Returns null because View Transitions (enabled in next.config.ts) handle
 * the visual continuity: the browser captures a snapshot of the old page and
 * crossfades it with the new content via CSS, hiding the brief blank.
 *
 * For cached pages (staleTimes: 30s), new content arrives in <50ms so the
 * blank is imperceptible. For first-time visits, the View Transition fade
 * provides clear visual feedback that navigation is in progress.
 */
export default function CategoryLoading() {
  return null;
}
