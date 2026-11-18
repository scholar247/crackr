ALTER TABLE `mind_map_nodes` MODIFY COLUMN `label` varchar(300) NOT NULL;--> statement-breakpoint
ALTER TABLE `mind_map_nodes` ADD `label_hi` varchar(300);--> statement-breakpoint
ALTER TABLE `mind_map_nodes` ADD `style` json;--> statement-breakpoint
ALTER TABLE `mind_map_nodes` ADD `tags` json;--> statement-breakpoint
ALTER TABLE `mind_maps` ADD `theme` enum('COLOUR','CLASSIC') DEFAULT 'COLOUR' NOT NULL;