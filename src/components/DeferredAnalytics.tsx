"use client";

import { init } from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Deferred Analytics loader
 *
 * Placeholder for analytics components.
 */
export function DeferredAnalytics() {
  useEffect(() => {
    console.log("[Sentry] Manual initialization in DeferredAnalytics...");

    init({
      dsn:
        process.env.NEXT_PUBLIC_SENTRY_DSN ||
        "https://1e7c15cec2b675492e1f5447c51d330c@o4510817678196736.ingest.de.sentry.io/4510817689469008",
      debug: true,
      tracesSampleRate: 0.05,
    });

    console.log("[Sentry] Initialization called.");
  }, []);

  return null;
}
