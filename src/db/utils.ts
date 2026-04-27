/**
 * Custom error thrown when the database circuit breaker trips.
 */
export class DatabaseBusyError extends Error {
  constructor(message: string = "Database is currently under heavy load.") {
    super(message);
    this.name = "DatabaseBusyError";
  }
}

/**
 * Retry wrapper for database operations.
 * Handles SQLITE_BUSY errors with exponential backoff and jitter.
 * Includes a "Circuit Breaker" to fail fast if the lock persists.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 10, // Increased to handle high-concurrency bursts
  baseDelayMs = 200,
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
        errorMsg.includes("SQLITE_READONLY");

      if (!isSqliteLocked) {
        throw error;
      }

      // --- CIRCUIT BREAKER ---
      // If we've reached the final attempt and it's still locked,
      // throw a specific error instead of just the raw SQLite error.
      if (attempt === maxRetries - 1) {
        console.error(
          `[DB Circuit Breaker] Tripped after ${maxRetries} attempts.`,
        );
        throw new DatabaseBusyError(
          `Database lock persistent after ${maxRetries} attempts: ${errorMsg}`,
        );
      }

      // Exponential backoff + jitter
      const jitter = Math.random() * 100;
      const delay = baseDelayMs * Math.pow(2, attempt) + jitter;

      console.warn(
        `[DB Retry] Attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms. Error: ${errorMsg}`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
