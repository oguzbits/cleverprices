/**
 * Utility to ensure data is strictly JSON-serializable.
 * Used to prevent Next.js "use cache" and RSC serialization errors.
 */

export function isSerializable(value: any): boolean {
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
  } catch (e) {
    return false;
  }
}

function containsNonSerializable(obj: any): boolean {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'function';
  }

  if (obj instanceof Set || obj instanceof Map) {
    return true;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (containsNonSerializable(obj[key])) {
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
  if (process.env.NODE_ENV === 'development') {
    if (!isSerializable(data)) {
      console.error(`[SERIALIZATION ERROR] Non-serializable data detected in: ${context}`);
      console.error('Data:', data);
      // In dev, we throw to catch it early. In prod, we just log to avoid crashing.
      throw new Error(`Serialization Failure in ${context}. Check console for details.`);
    }
  }
  return data;
}
