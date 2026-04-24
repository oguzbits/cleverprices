import { mock } from "bun:test";

// Mock next/cache so that functions like cacheLife and cacheTag
// can be called during test execution without crashing (they are server-only).
mock.module("next/cache", () => {
  const m = {
    cacheLife: () => {},
    cacheTag: () => {},
    unstable_cache: (fn: any) => fn,
    unstable_noStore: () => {},
  };
  return { ...m, default: m };
});
