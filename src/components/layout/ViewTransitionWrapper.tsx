"use client";

import { ViewTransition } from "react";

/**
 * ViewTransitionWrapper — enables seamless page crossfades on navigation.
 *
 * Wraps the main content area in React 19's <ViewTransition> component.
 * When combined with `experimental.viewTransition: true` in next.config.ts,
 * the browser natively crossfades the old page content to the new content
 * during navigation — no blank flash, no skeleton, no manual maintenance.
 *
 * How it works:
 * - The browser captures a snapshot of the current (old) page
 * - React renders the new page in the background
 * - Once ready, the browser crossfades between old and new snapshots
 * - The Navbar/CategoryNav (outside this wrapper) don't animate since
 *   they're persistent layout elements that don't change between pages
 */
export function ViewTransitionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ViewTransition>{children}</ViewTransition>;
}
