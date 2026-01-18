/**
 * Database Utilities
 */

/**
 * Retry wrapper for database operations.
 * Handles SQLITE_BUSY errors with exponential backoff.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelayMs = 100,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const isSqliteBusy =
        error instanceof Error &&
        (error.message.includes("SQLITE_BUSY") ||
          (error as any).code === "SQLITE_BUSY" ||
          (error as any).cause?.message?.includes("SQLITE_BUSY"));

      if (!isSqliteBusy || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(
        `  ⏳ DB Retry ${attempt + 1}/${maxRetries} after ${delay}ms (SQLITE_BUSY)`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
