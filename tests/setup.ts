import { mock } from "bun:test";

// Mock next/cache so that functions like cacheLife and cacheTag
// can be called during test execution without crashing (they are server-only).
mock.module("next/cache", () => {
  const m = {
    cacheLife: () => {},
    unstable_cacheLife: () => {},
    cacheTag: () => {},
    unstable_cacheTag: () => {},
    unstable_cache: <T extends (...args: unknown[]) => Promise<unknown>>(
      fn: T,
    ) => fn,
    unstable_noStore: () => {},
  };
  return { ...m, default: m };
});

// Next.js 15+ "use cache" compiles to call cacheLife/cacheTag from the global scope.
// We mock them globally here for the test environment.
(globalThis as typeof globalThis & { cacheLife?: unknown }).cacheLife =
  () => {};
(globalThis as typeof globalThis & { cacheTag?: unknown }).cacheTag = () => {};
