import { IS_BUILD } from "@/db";

/**
 * DETERMINISTIC REFERENCE DATE
 * This date is used during static generation (Next build and ISR) to ensure
 * zero-bailout delivery. It is frozen at 2026-05-01T00:00:00Z.
 */
export const REFERENCE_DATE_MS = 1735689600000;

/**
 * getSafeNow
 * 
 * Returns the current timestamp in a way that is safe for Next.js static generation.
 * If we are in the build phase or Next.js static generation phase, it returns 
 * a fixed reference point. Otherwise, it returns Date.now().
 */
export function getSafeNow(): number {
  // 1. Check for manual build flag
  if (IS_BUILD) return REFERENCE_DATE_MS;

  // 2. Check for Next.js environment indicators that might imply static generation
  // In some environments, Date.now() triggers bailout. We can avoid it by checking
  // for the presence of certain environment variables used during build.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return REFERENCE_DATE_MS;
  }

  return Date.now();
}

/**
 * getSafeDate
 * 
 * Returns a Date object initialized with getSafeNow().
 */
export function getSafeDate(): Date {
  return new Date(getSafeNow());
}
