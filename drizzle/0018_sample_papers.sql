CREATE TABLE `sample_papers` (
	`id` varchar(36) NOT NULL,
	`exam_id` varchar(36) NOT NULL,
	`year` int NOT NULL,
	`subject` varchar(120) NOT NULL,
	`subject_slug` varchar(140) NOT NULL,
	`sample_paper_link` varchar(2048) NOT NULL,
	`marking_scheme_link` varchar(2048),
	`is_published` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sample_papers_id` PRIMARY KEY(`id`),
	CONSTRAINT `sample_papers_exam_year_subject_idx` UNIQUE(`exam_id`,`year`,`subject_slug`)
);
--> statement-breakpoint
ALTER TABLE `sample_papers` ADD CONSTRAINT `sample_papers_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sample_papers` ADD CONSTRAINT `sample_papers_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sample_papers_exam_published_idx` ON `sample_papers` (`exam_id`,`is_published`,`year`);