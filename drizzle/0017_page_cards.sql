CREATE TABLE `page_cards` (
	`id` varchar(36) NOT NULL,
	`page` varchar(60) NOT NULL,
	`section` varchar(60) NOT NULL,
	`sequence` int NOT NULL DEFAULT 0,
	`title` varchar(160) NOT NULL,
	`badge` varchar(60),
	`description` text,
	`list_items` json,
	`cta_label` varchar(80),
	`cta_link` varchar(2048),
	`cta_type` enum('BUTTON','TEXT') NOT NULL DEFAULT 'TEXT',
	`accent` enum('PRIMARY','SECONDARY','TERTIARY') NOT NULL DEFAULT 'PRIMARY',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `page_cards_page_section_idx` ON `page_cards` (`page`,`section`,`sequence`);
