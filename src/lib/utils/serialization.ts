/**
 * Utility to ensure data is strictly JSON-serializable.
 * Used to prevent Next.js "use cache" and RSC serialization errors.
 */

export function isSerializable(value: unknown): boolean {
  try {
    // A value is serializable if it survives a round-trip through JSON
    // without losing data or changing structure (except for Dates becoming strings)
    const stringified = JSON.stringify(value);
    if (stringified === undefined) return false;

    // Check for common pitfalls that JSON.stringify might "hide" by turning into null
    if (containsNonSerializable(value)) {
      return false;
    }

    return true;
  } catch (_e) {
    return false;
  }
}

function containsNonSerializable(obj: unknown): boolean {
  if (obj === null || typeof obj !== "object") {
    return typeof obj === "function";
  }

  const o = obj as Record<string, unknown>;

  if (o instanceof Set || o instanceof Map) {
    return true;
  }

  for (const key in o) {
    if (Object.prototype.hasOwnProperty.call(o, key)) {
      if (containsNonSerializable(o[key])) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Development-only guard to throw errors if non-serializable data is returned.
 */
export function assertSerializable<T>(data: T, context: string): T {
  if (process.env.NODE_ENV === "development") {
    if (!isSerializable(data)) {
      console.error(
        `[SERIALIZATION ERROR] Non-serializable data detected in: ${context}`,
      );
      console.error("Data:", data);
      // In dev, we throw to catch it early. In prod, we just log to avoid crashing.
      throw new Error(
        `Serialization Failure in ${context}. Check console for details.`,
      );
    }
  }
  return data;
}

/**
 * Force an object to be JSON-serializable by performing a round-trip.
 * This is a physical boundary that ensures no non-serializable objects (like Lucide icons)
 * reach the cache layer.
 */
export function serializeSafe<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(JSON.stringify(obj));
}
