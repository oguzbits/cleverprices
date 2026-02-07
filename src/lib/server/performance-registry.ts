/**
 * Performance Registry
 *
 * Simple utility to track and log server-side rendering performance.
 * Helps identify regressions in PDP load times.
 */

interface PerformanceLog {
  slug: string;
  durationMs: number;
  timestamp: number;
}

const LOG_THRESHOLD_MS = 500; // Log a warning if render takes > 500ms

export function logPDPPerformance(slug: string, startTime: number) {
  const duration = performance.now() - startTime;

  if (duration > LOG_THRESHOLD_MS) {
    console.warn(
      `[PERFORMANCE WARNING] PDP for ${slug} took ${duration.toFixed(2)}ms`,
    );
  } else {
    // Optional: Verbose log for development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[PERFORMANCE] PDP for ${slug} took ${duration.toFixed(2)}ms`,
      );
    }
  }

  return duration;
}
