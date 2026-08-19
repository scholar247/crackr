ALTER TABLE `media` ADD `slug` varchar(220);--> statement-breakpoint
UPDATE `media` SET `slug` = CONCAT('file-', SUBSTRING(`id`, 1, 8)) WHERE `slug` IS NULL;--> statement-breakpoint
ALTER TABLE `media` MODIFY `slug` varchar(220) NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD CONSTRAINT `media_slug_idx` UNIQUE(`slug`);