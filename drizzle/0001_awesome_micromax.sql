CREATE TABLE `user_exam_targets` (
	`user_id` varchar(36) NOT NULL,
	`exam_id` varchar(36) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_exam_targets_user_id_exam_id_pk` PRIMARY KEY(`user_id`,`exam_id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `target_year` int;--> statement-breakpoint
ALTER TABLE `users` ADD `level` enum('BEGINNER','INTERMEDIATE','ADVANCED');--> statement-breakpoint
ALTER TABLE `user_exam_targets` ADD CONSTRAINT `user_exam_targets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_exam_targets` ADD CONSTRAINT `user_exam_targets_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;