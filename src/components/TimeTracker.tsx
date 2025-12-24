"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEngagement } from "@/lib/analytics";

/**
 * TimeTracker Component
 *
 * Trackt wie lange Nutzer auf einer Seite bleiben.
 * Wichtig für SEO: Zeigt Engagement und Content-Qualität.
 *
 * Usage: Füge <TimeTracker /> in dein Layout ein
 */
export function TimeTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset für neue Seite
    startTimeRef.current = Date.now();
    hasTrackedRef.current = false;

    const trackTime = () => {
      if (hasTrackedRef.current) return;

      const timeOnPage = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // Nur tracken wenn mindestens 5 Sekunden auf der Seite
      if (timeOnPage >= 5) {
        trackEngagement.timeOnPage(pathname, timeOnPage);
        hasTrackedRef.current = true;
      }
    };

    // Track beim Verlassen der Seite (Browser schließen, Tab wechseln)
    const handleBeforeUnload = () => {
      trackTime();
    };

    // Track bei Visibility Change (Tab wechseln)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackTime();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Track auch beim Route-Wechsel (SPA Navigation)
      trackTime();

      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

  return null; // Unsichtbares Component
}
