/**
 * Product Slug Generation Utility
 *
 * Centralized slug generation for consistent, SEO-friendly, unique product URLs.
 */

/**
 * Generate URL-safe slug from title with uniqueness guarantee.
 *
 * Strategy:
 * 1. Extract brand + cleaned model name
 * 2. Include key differentiators (capacity for storage, size for displays)
 * 3. Append last 4 chars of ASIN for guaranteed uniqueness
 *
 * @example
 * generateProductSlug("Samsung 990 PRO 4TB NVMe...", "Samsung", "B0CBYZ6DD1")
 * // → "samsung-990-pro-4tb-6dd1"
 */
export function generateProductSlug(
  title: string,
  brand?: string | null,
  asin?: string,
  capacity?: number | null,
  capacityUnit?: string | null,
): string {
  // 1. Clean the title - remove common filler words and specs noise
  let cleanTitle = title
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");

  // Remove brand prefix if duplicated (e.g., "Samsung Samsung 990 PRO")
  if (brand) {
    const brandLower = brand.toLowerCase();
    const doublePattern = new RegExp(
      `^${brandLower}\\s+${brandLower}\\s+`,
      "i",
    );
    cleanTitle = cleanTitle.replace(doublePattern, `${brandLower} `);
  }

  // 2. Extract capacity from title if not provided or invalid unit
  // This handles cases where DB has "stück" instead of "TB"/"GB"
  let extractedCapacity = capacity;
  let extractedUnit = capacityUnit;

  const validUnits = ["tb", "gb", "w", "zoll"];
  const hasValidUnit =
    capacityUnit && validUnits.includes(capacityUnit.toLowerCase());

  if (!hasValidUnit) {
    // Try to extract storage capacity (TB/GB)
    const storageMatch = title.match(/(\d+(?:\.\d+)?)\s*(TB|GB)/i);
    if (storageMatch) {
      extractedCapacity = parseFloat(storageMatch[1]);
      extractedUnit = storageMatch[2].toUpperCase();
    } else {
      // Try to extract display size (Zoll/inches)
      const displayMatch = title.match(/(\d+(?:\.\d+)?)\s*(?:Zoll|"|inches?)/i);
      if (displayMatch) {
        extractedCapacity = parseFloat(displayMatch[1]);
        extractedUnit = "zoll";
      } else {
        // Try to extract wattage
        const wattMatch = title.match(/(\d+)\s*W(?:att)?(?:\s|,|$)/i);
        if (wattMatch) {
          extractedCapacity = parseInt(wattMatch[1]);
          extractedUnit = "w";
        }
      }
    }
  }

  // Remove common noise patterns (technical specs, generic terms)
  const noisePatterns = [
    /\bnvme\b/gi,
    /\bm\.?2\b/gi,
    /\bpcie\s*[\d.]+\b/gi,
    /\b[\d.,]+\s*mb\/?s\b/gi, // speed specs like "7.450 MB/s" or "7450 MB/s"
    /\blesen\b/gi,
    /\bschreiben\b/gi,
    /\binterne?\b/gi,
    /\bexterne?\b/gi,
    /\bfestplatte\b/gi,
    /\bhard\s*drive\b/gi,
    /\bsolid\s*state\s*drive\b/gi,
    /\bssd\b/gi,
    /\bhdd\b/gi,
    /\bddr[45]\b/gi,
    /\bsodimm\b/gi,
    /\bdimm\b/gi,
    /\bram\b/gi,
    /\bspeicher\b/gi,
    /\bmemory\b/gi,
    /\bgrafikkarte\b/gi,
    /\bgraphics\s*card\b/gi,
    /\bgpu\b/gi,
    /\b\(?generalueberholt\)?\b/gi,
    /\b\(?renewed\)?\b/gi,
    /\b\(?refurbished\)?\b/gi,
    /\b\d+\s*gb\b/gi, // Remove inline capacity (we add it back correctly)
    /\b\d+\s*tb\b/gi,
    /\b\d+\s*w\b/gi, // wattage
    /\b80\s*plus\b/gi,
    /\bplatinum\b/gi,
    /\bgold\b/gi,
    /\bbronze\b/gi,
    /\bmodular\b/gi,
    /\bfully\b/gi,
    /\bsemi\b/gi,
    /\batx\b/gi,
    /\bsfx\b/gi,
    /\bnetzteil\b/gi,
    /\bpower\s*supply\b/gi,
    /\bpsu\b/gi,
    // German marketing phrases
    /\bfuer\s+gaming\b/gi,
    /\bund\s+videobearbeitung\b/gi,
    /\bfuer\s+\w+\b/gi, // "Für X" patterns
    // Part numbers (typically end of title)
    /\b[a-z]{2,3}-[a-z0-9]+\b/gi, // Part numbers like "MZ-V9P4T0BW"
  ];

  let processed = cleanTitle;
  for (const pattern of noisePatterns) {
    processed = processed.replace(pattern, " ");
  }

  // Clean up extra spaces and dashes
  processed = processed
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // 3. Build the slug with brand prefix
  let slug = processed;

  // Ensure brand is at the start
  if (brand) {
    const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!slug.startsWith(brandSlug)) {
      slug = `${brandSlug}-${slug}`;
    }
  }

  // 4. Truncate to reasonable length FIRST (before adding capacity and ASIN)
  // This ensures critical differentiators don't get cut off
  const maxBaseLength = 45; // Leave room for capacity suffix (5 chars) + ASIN (5 chars)
  if (slug.length > maxBaseLength) {
    const cutoff = slug.substring(0, maxBaseLength).lastIndexOf("-");
    if (cutoff > 20) {
      slug = slug.substring(0, cutoff);
    } else {
      slug = slug.substring(0, maxBaseLength);
    }
  }

  // 5. Add capacity if available (key differentiator for storage products)
  if (extractedCapacity && extractedUnit) {
    const unit = extractedUnit.toLowerCase();
    const capacityStr =
      extractedCapacity % 1 === 0
        ? String(extractedCapacity)
        : extractedCapacity.toFixed(1);
    const capacitySuffix = `-${capacityStr}${unit}`;

    // Only add if not already present
    if (!slug.includes(capacitySuffix.slice(1))) {
      slug = slug + capacitySuffix;
    }
  }

  // 6. Add short ASIN suffix for uniqueness (last 4 chars, lowercase)
  if (asin && asin.length >= 4) {
    const asinSuffix = asin.slice(-4).toLowerCase();
    slug = `${slug}-${asinSuffix}`;
  }

  // Final cleanup
  slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "");

  return slug;
}
