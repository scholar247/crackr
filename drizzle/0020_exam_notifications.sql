CREATE TABLE `exam_notification_exams` (
	`notification_id` varchar(36) NOT NULL,
	`exam_id` varchar(36) NOT NULL,
	CONSTRAINT `exam_notification_exams_notification_id_exam_id_pk` PRIMARY KEY(`notification_id`,`exam_id`)
);
--> statement-breakpoint
CREATE TABLE `exam_notifications` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`summary` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` enum('EXAM_DATES','DATE_SHEET','ADMIT_CARD','RESULT','SYLLABUS','SAMPLE_PAPER','CIRCULAR','GENERAL') NOT NULL DEFAULT 'GENERAL',
	`status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	`is_important` boolean NOT NULL DEFAULT false,
	`source_url` varchar(2048),
	`published_at` timestamp,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exam_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `exam_notifications_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `exam_notification_exams` ADD CONSTRAINT `exam_notification_exams_notification_id_exam_notifications_id_fk` FOREIGN KEY (`notification_id`) REFERENCES `exam_notifications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_notification_exams` ADD CONSTRAINT `exam_notification_exams_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_notifications` ADD CONSTRAINT `exam_notifications_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `exam_notification_exams_exam_idx` ON `exam_notification_exams` (`exam_id`);--> statement-breakpoint
CREATE INDEX `exam_notifications_status_published_idx` ON `exam_notifications` (`status`,`published_at`);