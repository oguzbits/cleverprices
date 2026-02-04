import { relations, sql } from "drizzle-orm";
import {
  blob,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Products Table
 * Core product information, updated from Keepa/PA API
 */
export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Identifiers
    asin: text("asin").notNull().unique(), // Amazon ASIN (primary for now)
    gtin: text("gtin"), // EAN-13 or UPC-12 for multi-source matching
    mpn: text("mpn"), // Manufacturer Part Number
    slug: text("slug").notNull().unique(),

    // Basic Info
    title: text("title").notNull(),
    brand: text("brand"),
    category: text("category").notNull(), // CategorySlug
    imageUrl: text("image_url"),
    manufacturer: text("manufacturer"),

    // Specifications (Core Filterable)
    capacity: real("capacity"), // Numeric capacity
    capacityUnit: text("capacity_unit"), // "GB", "TB", "W"
    normalizedCapacity: real("normalized_capacity"), // Base unit for math
    formFactor: text("form_factor"),
    technology: text("technology"), // "SSD", "HDD", "DDR4", etc.
    condition: text("condition").default("New"), // "New", "Used"

    // Ratings & Performance
    rating: real("rating"),
    reviewCount: integer("review_count"),
    salesRank: integer("sales_rank"),
    monthlySold: integer("monthly_sold"),

    // Variants
    parentAsin: text("parent_asin"),
    variationAttributes: text("variation_attributes"), // e.g. "Color: Black; Size: 256GB"

    // JSON Buckets
    specifications: text("specifications"), // Key-value JSON of all specs (legacy/catch-all)
    officialSpecifications: text("official_specifications"), // Manufacturer-verified (Icecat)
    officialTitle: text("official_title"), // Clean name from manufacturer
    keepaFeatures: text("keepa_features"), // Raw description and feature bullets for scavenging
    ebayRawData: text("ebay_raw_data"), // Raw eBay localizedAspects JSON

    // UI Content
    energyLabel: text("energy_label"),

    // Status
    historySeeded: integer("history_seeded", { mode: "boolean" }).default(
      false,
    ),

    // Data Quality Tracking
    completenessScore: integer("completeness_score").default(0), // 0-100
    missingSpecs: text("missing_specs").default("[]"), // JSON list of missing keys

    // Enrichment Tracking (Icecat)
    icecatId: integer("icecat_id"), // Mapped ID from external source
    enrichmentStatus: text("enrichment_status").default("pending"), // pending | processed | not_found | error
    specificationsSource: text("specifications_source"), // "icecat", "intel", "keepa_ai", "google"
    lastEnrichedAt: integer("last_enriched_at", { mode: "timestamp" }),

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    // Core lookups
    index("idx_products_category").on(table.category),
    index("idx_products_brand").on(table.brand),
    index("idx_products_asin").on(table.asin),
    index("idx_products_gtin").on(table.gtin),
    index("idx_products_created_at").on(table.createdAt),

    // Popularity & Ranking
    index("idx_products_sales_rank").on(table.salesRank),
    index("idx_products_rating").on(table.rating),
    index("idx_products_category_rank").on(table.category, table.salesRank), // Composite for "Popular in Category"

    // Filtering & Sorting
    index("idx_products_technology").on(table.technology), // Sidebar filter (SSD, HDD, DDR5)
    index("idx_products_capacity").on(table.capacity), // "Price per GB" sorting
    index("idx_products_parent_asin").on(table.parentAsin), // Variant lookups
    index("idx_products_enrichment_status").on(table.enrichmentStatus), // Category slug generation
  ],
);

/**
 * Prices Table
 * Current prices per product per country (lean schema)
 *
 * LEAN SCHEMA:
 * - `price`: Consolidated "clever" price (buyBox ?? min(amazon, new) ?? used)
 * - `used_price`: Separate used price option
 * - `history_json`: Daily low prices in cents, GZIP compressed
 *   Format after decompression: {"2025-01-15": 4999, ...}
 * - `price_avg_90`: 90-day average for deal calculation
 */
export const prices = sqliteTable(
  "prices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    country: text("country").notNull(), // CountryCode: "us", "de", etc.

    // Consolidated price (the "clever" price shown to users)
    price: real("price"),

    // Used price (Marketplace)
    usedPrice: real("used_price"),

    // Warehouse price (Amazon returns - Volatile)
    warehousePrice: real("warehouse_price"),

    // List price (MSRP/RRP)
    listPrice: real("list_price"),

    // Price statistics (from Keepa)
    priceAvg90: real("price_avg_90"), // 90-day average for deal badges

    // Derived unit price (Price per TB, Price per GB, etc.)
    pricePerUnit: real("price_per_unit"),

    // History as GZIP-compressed JSON blob (~73% smaller)
    // Use parseHistoryBlob() from history-compression.ts to read
    // Use compressHistory(JSON.stringify(obj)) to write
    historyJson: blob("history_json", { mode: "buffer" }),

    // Currency
    currency: text("currency").notNull(), // "USD", "EUR", etc.

    // Source info
    source: text("source").notNull(), // "keepa", "amazon-paapi", "static"

    // Timestamps
    lastUpdated: integer("last_updated", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("unique_price_product_country").on(
      table.productId,
      table.country,
    ),
    index("idx_prices_country").on(table.country),
    index("idx_prices_product_id").on(table.productId),
    index("idx_prices_last_updated").on(table.lastUpdated),
  ],
);

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  prices: many(prices),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
}));

// Type exports for use in application
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Price = typeof prices.$inferSelect;
export type NewPrice = typeof prices.$inferInsert;
