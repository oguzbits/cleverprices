DROP INDEX `idx_products_capacity`;--> statement-breakpoint
ALTER TABLE `products` ADD `canonical_id` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `official_specifications` text;--> statement-breakpoint
ALTER TABLE `products` ADD `official_title` text;--> statement-breakpoint
ALTER TABLE `products` ADD `keepa_features` text;--> statement-breakpoint
ALTER TABLE `products` ADD `ebay_raw_data` text;--> statement-breakpoint
ALTER TABLE `products` ADD `completeness_score` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` ADD `missing_specs` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `products` ADD `icecat_id` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `enrichment_status` text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `products` ADD `specifications_source` text;--> statement-breakpoint
ALTER TABLE `products` ADD `last_enriched_at` integer;--> statement-breakpoint
CREATE INDEX `idx_products_canonical_id` ON `products` (`canonical_id`);--> statement-breakpoint
CREATE INDEX `idx_products_parent_asin` ON `products` (`parent_asin`);--> statement-breakpoint
CREATE INDEX `idx_products_enrichment_status` ON `products` (`enrichment_status`);--> statement-breakpoint
CREATE INDEX `idx_products_missing_specs` ON `products` (`missing_specs`);--> statement-breakpoint
CREATE INDEX `idx_products_capacity` ON `products` (`capacity`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`country` text NOT NULL,
	`price` real,
	`used_price` real,
	`warehouse_price` real,
	`list_price` real,
	`price_avg_90` real,
	`price_per_unit` real,
	`history_json` blob,
	`currency` text NOT NULL,
	`source` text NOT NULL,
	`last_updated` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_prices`("id", "product_id", "country", "price", "used_price", "warehouse_price", "list_price", "price_avg_90", "price_per_unit", "history_json", "currency", "source", "last_updated") SELECT "id", "product_id", "country", "price", "used_price", "warehouse_price", "list_price", "price_avg_90", "price_per_unit", "history_json", "currency", "source", "last_updated" FROM `prices`;--> statement-breakpoint
DROP TABLE `prices`;--> statement-breakpoint
ALTER TABLE `__new_prices` RENAME TO `prices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_price_product_country` ON `prices` (`product_id`,`country`);--> statement-breakpoint
CREATE INDEX `idx_prices_country` ON `prices` (`country`);--> statement-breakpoint
CREATE INDEX `idx_prices_product_id` ON `prices` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_prices_last_updated` ON `prices` (`last_updated`);--> statement-breakpoint
CREATE INDEX `idx_prices_price_val` ON `prices` (`price`);--> statement-breakpoint
CREATE INDEX `idx_prices_unit_val` ON `prices` (`price_per_unit`);--> statement-breakpoint
CREATE INDEX `idx_prices_country_price` ON `prices` (`country`,`price`);--> statement-breakpoint
CREATE INDEX `idx_prices_country_unit` ON `prices` (`country`,`price_per_unit`);