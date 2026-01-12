/**
 * Token Tracker for Keepa API
 *
 * Monitors and limits Keepa API token usage to stay within budget.
 * The €49/month plan provides 20 tokens/minute = 28,800 tokens/day.
 *
 * Strategy: Maximize products with 1-2x daily updates
 * - 25,000 tokens for product updates
 * - 3,800 tokens buffer for discovery/errors
 */

/**
 * Token Tracker for Keepa API
 *
 * Implements the "Leaky Bucket" algorithm used by Keepa.
 * - Capacity: 1200 tokens (for €49 plan)
 * - Refill Rate: 20 tokens / minute (1 token every 3s)
 * - Bursting: Allowed until bucket is empty
 */

export const TOKEN_BUDGET = {
  BUCKET_CAPACITY: 1200, // Max burst size
  REFILL_RATE_PER_MIN: 20, // 20 tokens per minute
  REFILL_MS_PER_TOKEN: 3000, // 3000ms per token
  SAFE_MINIMUM: 100, // Stop if below this to leave room for emergency queries
} as const;

// Global state to track bucket - updated by every API call response
let currentTokens = TOKEN_BUDGET.BUCKET_CAPACITY;
let lastUpdate = Date.now();

/**
 * Update the token count based on Keepa API response headers
 * MUST be called after every API request
 */
export function updateTokenStatus(tokensLeft: number): void {
  currentTokens = tokensLeft;
  lastUpdate = Date.now();
  console.log(`[Keepa Tokens] Bucket Level: ${currentTokens}/1200`);
}

/**
 * Estimate current tokens based on time since last update
 * (Optimistic refill)
 */
export function estimateCurrentTokens(): number {
  const now = Date.now();
  const elapsedMs = now - lastUpdate;
  const refilledTokens = Math.floor(
    elapsedMs / TOKEN_BUDGET.REFILL_MS_PER_TOKEN,
  );
  return Math.min(TOKEN_BUDGET.BUCKET_CAPACITY, currentTokens + refilledTokens);
}

/**
 * Check if we have enough budget for an operation.
 * Returns estimated wait time in ms if not enough.
 */
export function checkBudget(cost: number): {
  allowed: boolean;
  waitTimeMs: number;
} {
  const tokens = estimateCurrentTokens();

  if (tokens >= cost + TOKEN_BUDGET.SAFE_MINIMUM) {
    return { allowed: true, waitTimeMs: 0 };
  }

  // Calculate how long to wait to get enough tokens
  const deficit = cost + TOKEN_BUDGET.SAFE_MINIMUM - tokens;
  const waitTimeMs = deficit * TOKEN_BUDGET.REFILL_MS_PER_TOKEN;

  return { allowed: false, waitTimeMs };
}

/**
 * Helper: Just check if we can proceed (for boolean checks)
 */
export function hasTokenBudget(cost: number): boolean {
  return checkBudget(cost).allowed;
}

// Legacy exports for compatibility (will be removed later)
export function getTokenStatus() {
  return {
    tokensRemaining: estimateCurrentTokens(),
    tokensUsedToday: 0, // Not relevant in bucket model
    canProceed: true,
  };
}

export function recordTokenUsage(tokens: number) {
  // No-op, we track via updateTokenStatus now
}

export function getMaxProductsToday() {
  return 100000; // Unlimited, bound only by time
}

export function getRecommendedBatchSize() {
  return 50; // Standard batch
}
