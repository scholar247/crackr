CREATE TABLE `sample_paper_downloads` (
	`id` varchar(36) NOT NULL,
	`sample_paper_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`document` enum('PAPER','SCHEME') NOT NULL,
	`user_agent` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sample_paper_downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sample_paper_downloads` ADD CONSTRAINT `sample_paper_downloads_sample_paper_id_sample_papers_id_fk` FOREIGN KEY (`sample_paper_id`) REFERENCES `sample_papers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sample_paper_downloads` ADD CONSTRAINT `sample_paper_downloads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sample_paper_downloads_paper_idx` ON `sample_paper_downloads` (`sample_paper_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `sample_paper_downloads_user_idx` ON `sample_paper_downloads` (`user_id`,`created_at`);