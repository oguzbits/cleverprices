/**
 * Golden Schemas for Product Categories
 * Defines mandatory attributes and validation patterns for each category.
 */

export interface AttributeSchema {
  required: boolean;
  patterns?: RegExp[]; // Optional regex for value validation
  weight: number; // Weight for the health score (e.g. 1-10)
}

export interface CategorySchema {
  attributes: Record<string, AttributeSchema>;
  minRequiredScore: number; // Minimum score 0-100 to pass
}

export const CATEGORY_SCHEMAS: Record<string, CategorySchema> = {
  smartphones: {
    minRequiredScore: 70,
    attributes: {
      Marke: { required: true, weight: 10 },
      Modell: { required: true, weight: 10 },
      "RAM-Kapazität": { required: true, weight: 8, patterns: [/GB$/i] },
      "Interne Speicherkapazität": {
        required: true,
        weight: 8,
        patterns: [/GB$/i, /TB$/i],
      },
      Bildschirmdiagonale: {
        required: true,
        weight: 5,
        patterns: [/cm$/i, /Zoll$/i],
      },
      Mobilfunknetzgenerierung: { required: true, weight: 5 },
      Betriebssystem: { required: true, weight: 5 },
    },
  },
  ssds: {
    minRequiredScore: 80,
    attributes: {
      Marke: { required: true, weight: 10 },
      "SSD Speicherkapazität": {
        required: true,
        weight: 10,
        patterns: [/GB$/i, /TB$/i],
      },
      Schnittstelle: { required: true, weight: 8 },
      "SSD-Formfaktor": { required: true, weight: 8 },
      Lesegeschwindigkeit: {
        required: false,
        weight: 5,
        patterns: [/MB\/s$/i],
      },
    },
  },
  hdds: {
    minRequiredScore: 80,
    attributes: {
      Marke: { required: true, weight: 10 },
      Festplattenkapazität: {
        required: true,
        weight: 10,
        patterns: [/GB$/i, /TB$/i],
      },
      "Festplatten-Formfaktor": { required: true, weight: 8 },
      Schnittstelle: { required: true, weight: 8 },
      Rotationsgeschwindigkeit: {
        required: false,
        weight: 5,
        patterns: [/RPM$/i],
      },
    },
  },
  ram: {
    minRequiredScore: 80,
    attributes: {
      Marke: { required: true, weight: 10 },
      "RAM-Speicher": { required: true, weight: 10, patterns: [/GB$/i] },
      Speicherlayout: { required: true, weight: 8 },
      "Interner Speichertyp": {
        required: true,
        weight: 10,
        patterns: [/DDR\d/i],
      },
      Speichertaktfrequenz: { required: true, weight: 8, patterns: [/MHz$/i] },
    },
  },
};

/**
 * Get schema for a category or fallback to generic
 */
export function getCategorySchema(category: string): CategorySchema | null {
  return CATEGORY_SCHEMAS[category.toLowerCase()] || null;
}
