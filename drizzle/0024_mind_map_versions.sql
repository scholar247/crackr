CREATE TABLE `mind_map_versions` (
	`id` varchar(36) NOT NULL,
	`mind_map_id` varchar(36) NOT NULL,
	`version` int NOT NULL,
	`snapshot` json NOT NULL,
	`node_count` int,
	`published_by` varchar(36),
	`published_at` timestamp NOT NULL,
	CONSTRAINT `mind_map_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `mind_map_versions_map_version_idx` UNIQUE(`mind_map_id`,`version`)
);
--> statement-breakpoint
ALTER TABLE `mind_map_versions` ADD CONSTRAINT `mind_map_versions_mind_map_id_mind_maps_id_fk` FOREIGN KEY (`mind_map_id`) REFERENCES `mind_maps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_map_versions` ADD CONSTRAINT `mind_map_versions_published_by_users_id_fk` FOREIGN KEY (`published_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Back-fill: the currently published snapshot of each map becomes its version 1.
INSERT INTO `mind_map_versions` (`id`, `mind_map_id`, `version`, `snapshot`, `node_count`, `published_by`, `published_at`)
SELECT UUID(), `id`, 1, `published_snapshot`, NULL, `updated_by`, COALESCE(`published_at`, `updated_at`)
FROM `mind_maps` WHERE `published_snapshot` IS NOT NULL;
