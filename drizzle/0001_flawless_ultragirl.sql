CREATE TABLE `product_offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`source` text NOT NULL,
	`merchant_name` text NOT NULL,
	`merchant_logo` text,
	`price` real NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`shipping_cost` real,
	`total_price` real,
	`affiliate_url` text NOT NULL,
	`deep_link` text,
	`availability` text,
	`delivery_time` text,
	`merchant_rating` real,
	`merchant_review_count` integer,
	`last_updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_offers_product` ON `product_offers` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_offers_source` ON `product_offers` (`source`);--> statement-breakpoint
CREATE INDEX `idx_offers_price` ON `product_offers` (`price`);--> statement-breakpoint
CREATE INDEX `idx_offers_total_price` ON `product_offers` (`total_price`);