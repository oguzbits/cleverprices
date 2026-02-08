/**
 * Database Utilities
 */

/**
 * Retry wrapper for database operations.
 * Handles SQLITE_BUSY errors with exponential backoff and jitter.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelayMs = 150,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Robust SQLITE_BUSY / Lockdown detection
      const isSqliteLocked =
        errorMsg.includes("SQLITE_BUSY") ||
        (error as any).code === "SQLITE_BUSY" ||
        (error as any).cause?.message?.includes("SQLITE_BUSY") ||
        errorMsg.includes("database is locked") ||
        errorMsg.includes("SQLITE_READONLY"); // Sometimes related to WAL recovery or checkpoints

      if (!isSqliteLocked || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff + jitter
      const jitter = Math.random() * 50;
      const delay = baseDelayMs * Math.pow(2, attempt) + jitter;

      console.warn(
        `[DB Retry] Attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms. Error: ${errorMsg}`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
