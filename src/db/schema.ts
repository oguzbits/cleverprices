import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  index,
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
    asin: text("asin").notNull().unique(),
    slug: text("slug").notNull().unique(),

    // Basic Info
    title: text("title").notNull(),
    brand: text("brand"),
    category: text("category").notNull(), // CategorySlug
    imageUrl: text("image_url"),

    // Specifications
    capacity: real("capacity"), // Numeric capacity
    capacityUnit: text("capacity_unit"), // "GB", "TB", "W"
    normalizedCapacity: real("normalized_capacity"), // Capacity in base unit (GB for storage, W for PSU)
    formFactor: text("form_factor"),
    technology: text("technology"), // "SSD", "HDD", "DDR4", "DDR5", etc.
    warranty: text("warranty"),
    condition: text("condition").default("New"), // "New", "Renewed", "Used"

    // PSU-specific
    certification: text("certification"), // "80+ Gold", etc.
    modularityType: text("modularity_type"),

    // CPU/GPU-specific (for future)
    cores: integer("cores"),
    threads: integer("threads"),
    baseClock: text("base_clock"),
    boostClock: text("boost_clock"),
    tdp: integer("tdp"),

    // Ratings
    rating: real("rating"),
    reviewCount: integer("review_count"),

    // Keepa data
    salesRank: integer("sales_rank"),
    salesRankReference: integer("sales_rank_reference"), // Category sales rank

    // Features/Description
    features: text("features"), // JSON array
    description: text("description"),

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_products_category").on(table.category),
    index("idx_products_brand").on(table.brand),
    index("idx_products_asin").on(table.asin),
  ],
);

/**
 * Prices Table
 * Current prices per product per country
 */
export const prices = sqliteTable(
  "prices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    country: text("country").notNull(), // CountryCode: "us", "de", etc.

    // Amazon prices
    amazonPrice: real("amazon_price"), // Sold by Amazon
    amazonPriceFormatted: text("amazon_price_formatted"),
    newPrice: real("new_price"), // Marketplace new
    usedPrice: real("used_price"), // Marketplace used
    warehousePrice: real("warehouse_price"), // Amazon Warehouse

    // Calculated
    pricePerUnit: real("price_per_unit"), // Price per GB/TB/W

    // Currency
    currency: text("currency").notNull(), // "USD", "EUR", etc.

    // Availability
    availability: text("availability"), // "in_stock", "out_of_stock", "unknown"

    // Source info
    source: text("source").notNull(), // "keepa", "amazon-paapi", "static"

    // Timestamps
    lastUpdated: integer("last_updated", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_prices_product_country").on(table.productId, table.country),
  ],
);

/**
 * Price History Table
 * Historical prices for charts
 */
export const priceHistory = sqliteTable(
  "price_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    country: text("country").notNull(),

    // Price at this point in time
    price: real("price").notNull(),
    currency: text("currency").notNull(),

    // Type of price
    priceType: text("price_type").notNull(), // "amazon", "new", "used", "warehouse"

    // Timestamp
    recordedAt: integer("recorded_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_price_history_product_country").on(
      table.productId,
      table.country,
    ),
    index("idx_price_history_recorded").on(table.recordedAt),
  ],
);

/**
 * Affiliate Links Table
 * Store affiliate URLs per product/country/source
 */
export const affiliateLinks = sqliteTable(
  "affiliate_links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    country: text("country").notNull(),
    source: text("source").notNull(), // "amazon", "ebay", "newegg"

    url: text("url").notNull(),

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_affiliate_product_country_source").on(
      table.productId,
      table.country,
      table.source,
    ),
  ],
);

// Type exports for use in application
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Price = typeof prices.$inferSelect;
export type NewPrice = typeof prices.$inferInsert;
export type PriceHistoryRecord = typeof priceHistory.$inferSelect;
export type NewPriceHistoryRecord = typeof priceHistory.$inferInsert;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type NewAffiliateLink = typeof affiliateLinks.$inferInsert;
