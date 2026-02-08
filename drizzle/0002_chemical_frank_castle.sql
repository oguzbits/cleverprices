ALTER TABLE `prices` ADD `list_price` real;--> statement-breakpoint
ALTER TABLE `prices` ADD `price_min` real;--> statement-breakpoint
ALTER TABLE `prices` ADD `price_max` real;--> statement-breakpoint
ALTER TABLE `prices` ADD `price_avg_30` real;--> statement-breakpoint
ALTER TABLE `prices` ADD `delivery_time` text;--> statement-breakpoint
ALTER TABLE `prices` ADD `delivery_cost` real;--> statement-breakpoint
ALTER TABLE `prices` ADD `delivery_free` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `monthly_sold` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `offer_count_new` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `offer_count_used` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `prime_eligible` integer;