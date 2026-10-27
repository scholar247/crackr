ALTER TABLE `articles` ADD `meta_title` varchar(160);--> statement-breakpoint
ALTER TABLE `articles` ADD `meta_description` varchar(320);--> statement-breakpoint
ALTER TABLE `articles` ADD `keywords` json;--> statement-breakpoint
ALTER TABLE `articles` ADD `og_image` varchar(2048);