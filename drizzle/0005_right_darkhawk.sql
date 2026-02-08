DROP TABLE `affiliate_links`;--> statement-breakpoint
DROP TABLE `price_history`;--> statement-breakpoint
DROP TABLE `product_identifiers`;--> statement-breakpoint
DROP TABLE `product_offers`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`country` text NOT NULL,
	`price` real,
	`used_price` real,
	`list_price` real,
	`price_avg_90` real,
	`price_per_unit` real,
	`history_json` text,
	`currency` text NOT NULL,
	`source` text NOT NULL,
	`last_updated` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_prices`("id", "product_id", "country", "price", "used_price", "list_price", "price_avg_90", "price_per_unit", "history_json", "currency", "source", "last_updated") SELECT "id", "product_id", "country", "price", "used_price", "list_price", "price_avg_90", "price_per_unit", "history_json", "currency", "source", "last_updated" FROM `prices`;--> statement-breakpoint
DROP TABLE `prices`;--> statement-breakpoint
ALTER TABLE `__new_prices` RENAME TO `prices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_price_product_country` ON `prices` (`product_id`,`country`);--> statement-breakpoint
CREATE INDEX `idx_prices_country` ON `prices` (`country`);--> statement-breakpoint
CREATE INDEX `idx_prices_product_id` ON `prices` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_prices_last_updated` ON `prices` (`last_updated`);--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asin` text NOT NULL,
	`gtin` text,
	`mpn` text,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`brand` text,
	`category` text NOT NULL,
	`image_url` text,
	`manufacturer` text,
	`capacity` real,
	`capacity_unit` text,
	`normalized_capacity` real,
	`form_factor` text,
	`technology` text,
	`condition` text DEFAULT 'New',
	`rating` real,
	`review_count` integer,
	`sales_rank` integer,
	`monthly_sold` integer,
	`parent_asin` text,
	`variation_attributes` text,
	`specifications` text,
	`energy_label` text,
	`history_seeded` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "asin", "gtin", "mpn", "slug", "title", "brand", "category", "image_url", "manufacturer", "capacity", "capacity_unit", "normalized_capacity", "form_factor", "technology", "condition", "rating", "review_count", "sales_rank", "monthly_sold", "parent_asin", "variation_attributes", "specifications", "energy_label", "history_seeded", "created_at", "updated_at") SELECT "id", "asin", "gtin", "mpn", "slug", "title", "brand", "category", "image_url", "manufacturer", "capacity", "capacity_unit", "normalized_capacity", "form_factor", "technology", "condition", "rating", "review_count", "sales_rank", "monthly_sold", "parent_asin", "variation_attributes", "specifications", "energy_label", "history_seeded", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_asin_unique` ON `products` (`asin`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `idx_products_brand` ON `products` (`brand`);--> statement-breakpoint
CREATE INDEX `idx_products_asin` ON `products` (`asin`);--> statement-breakpoint
CREATE INDEX `idx_products_gtin` ON `products` (`gtin`);--> statement-breakpoint
CREATE INDEX `idx_products_created_at` ON `products` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_products_sales_rank` ON `products` (`sales_rank`);--> statement-breakpoint
CREATE INDEX `idx_products_rating` ON `products` (`rating`);--> statement-breakpoint
CREATE INDEX `idx_products_category_rank` ON `products` (`category`,`sales_rank`);--> statement-breakpoint
CREATE INDEX `idx_products_technology` ON `products` (`technology`);--> statement-breakpoint
CREATE INDEX `idx_products_capacity` ON `products` (`normalized_capacity`);