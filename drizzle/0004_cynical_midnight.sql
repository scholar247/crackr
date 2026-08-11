ALTER TABLE `articles` ADD `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `questions` ADD `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `articles` ADD CONSTRAINT `articles_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;