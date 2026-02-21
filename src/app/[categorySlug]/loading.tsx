/**
 * Category route loading boundary.
 *
 * IMPORTANT: This file must exist even though it returns nothing visible.
 *
 * Without this file, Next.js App Router has no Suspense fallback at the
 * route level. React 18's concurrent mode then holds the PREVIOUS page
 * visible until the entire new page finishes rendering — which looks like
 * frozen/broken navigation (requiring a second click or window resize).
 *
 * By providing a null fallback here, React immediately commits the transition
 * (showing nothing in the content area for ~100-200ms) and then renders the
 * new page as it arrives. The Navbar and CategoryNav (in the layout) stay
 * visible the entire time, so navigation feels instant and clean.
 */
export default function CategoryLoading() {
  return null;
}
