CREATE TABLE `affiliate_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`country` text NOT NULL,
	`source` text NOT NULL,
	`url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_affiliate_product_country_source` ON `affiliate_links` (`product_id`,`country`,`source`);--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`country` text NOT NULL,
	`price` real NOT NULL,
	`currency` text NOT NULL,
	`price_type` text NOT NULL,
	`recorded_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_price_history_product_country` ON `price_history` (`product_id`,`country`);--> statement-breakpoint
CREATE INDEX `idx_price_history_recorded` ON `price_history` (`recorded_at`);--> statement-breakpoint
CREATE TABLE `prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`country` text NOT NULL,
	`amazon_price` real,
	`amazon_price_formatted` text,
	`new_price` real,
	`used_price` real,
	`warehouse_price` real,
	`price_per_unit` real,
	`currency` text NOT NULL,
	`availability` text,
	`source` text NOT NULL,
	`last_updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_prices_product_country` ON `prices` (`product_id`,`country`);--> statement-breakpoint
CREATE TABLE `product_identifiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`source` text NOT NULL,
	`external_id` text NOT NULL,
	`country` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_identifiers_source_external` ON `product_identifiers` (`source`,`external_id`);--> statement-breakpoint
CREATE INDEX `idx_identifiers_product` ON `product_identifiers` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asin` text NOT NULL,
	`gtin` text,
	`mpn` text,
	`sku` text,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`brand` text,
	`category` text NOT NULL,
	`image_url` text,
	`capacity` real,
	`capacity_unit` text,
	`normalized_capacity` real,
	`form_factor` text,
	`technology` text,
	`warranty` text,
	`condition` text DEFAULT 'New',
	`certification` text,
	`modularity_type` text,
	`cores` integer,
	`threads` integer,
	`base_clock` text,
	`boost_clock` text,
	`tdp` integer,
	`rating` real,
	`review_count` integer,
	`sales_rank` integer,
	`sales_rank_reference` integer,
	`features` text,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_asin_unique` ON `products` (`asin`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `idx_products_brand` ON `products` (`brand`);--> statement-breakpoint
CREATE INDEX `idx_products_asin` ON `products` (`asin`);--> statement-breakpoint
CREATE INDEX `idx_products_gtin` ON `products` (`gtin`);