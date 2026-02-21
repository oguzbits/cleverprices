"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * BfcacheRecovery - Recovers from browser back-forward cache (bfcache) conflicts.
 *
 * Problem: When the browser restores a page from bfcache (pressing Back),
 * Next.js ALSO handles the `popstate` event and tries to reconcile its
 * router state. These two processes conflict: bfcache restores the frozen
 * React tree while Next.js tries to re-render from its router cache.
 * During this window, link clicks are silently dropped.
 *
 * Fix: Listen to the `pageshow` event. If `event.persisted = true`, the page
 * was restored from bfcache. Call `router.refresh()` to re-sync Next.js's
 * router with the current URL and unfreeze the navigation state.
 */
export function BfcacheRecovery() {
  const router = useRouter();

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache — re-sync the Next.js router
        router.refresh();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router]);

  return null;
}
