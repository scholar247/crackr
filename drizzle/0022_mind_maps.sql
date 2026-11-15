CREATE TABLE `mind_map_nodes` (
	`id` varchar(36) NOT NULL,
	`mind_map_id` varchar(36) NOT NULL,
	`parent_id` varchar(36),
	`curriculum_node_id` varchar(36),
	`label` varchar(160) NOT NULL,
	`description` varchar(500),
	`content` text,
	`display_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mind_map_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mind_maps` (
	`id` varchar(36) NOT NULL,
	`exam_id` varchar(36) NOT NULL,
	`chapter_node_id` varchar(36) NOT NULL,
	`status` enum('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`seo_title` varchar(200),
	`seo_description` varchar(320),
	`intro` text,
	`revision_notes` text,
	`faqs` json,
	`published_snapshot` json,
	`published_at` timestamp,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mind_maps_id` PRIMARY KEY(`id`),
	CONSTRAINT `mind_maps_exam_chapter_idx` UNIQUE(`exam_id`,`chapter_node_id`)
);
--> statement-breakpoint
ALTER TABLE `mind_map_nodes` ADD CONSTRAINT `mind_map_nodes_mind_map_id_mind_maps_id_fk` FOREIGN KEY (`mind_map_id`) REFERENCES `mind_maps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_map_nodes` ADD CONSTRAINT `mind_map_nodes_parent_id_mind_map_nodes_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `mind_map_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_map_nodes` ADD CONSTRAINT `mind_map_nodes_curriculum_node_id_curriculum_nodes_id_fk` FOREIGN KEY (`curriculum_node_id`) REFERENCES `curriculum_nodes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_maps` ADD CONSTRAINT `mind_maps_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_maps` ADD CONSTRAINT `mind_maps_chapter_node_id_curriculum_nodes_id_fk` FOREIGN KEY (`chapter_node_id`) REFERENCES `curriculum_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_maps` ADD CONSTRAINT `mind_maps_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_maps` ADD CONSTRAINT `mind_maps_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mind_map_nodes_map_parent_idx` ON `mind_map_nodes` (`mind_map_id`,`parent_id`,`display_order`);--> statement-breakpoint
CREATE INDEX `mind_maps_exam_status_idx` ON `mind_maps` (`exam_id`,`status`);