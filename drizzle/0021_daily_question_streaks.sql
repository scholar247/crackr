CREATE TABLE `daily_question_attempts` (
	`user_id` varchar(36) NOT NULL,
	`exam_id` varchar(36) NOT NULL,
	`day` date NOT NULL,
	`question_id` bigint unsigned,
	`selected_option` varchar(8) NOT NULL,
	`is_correct` boolean NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_question_attempts_user_id_exam_id_day_pk` PRIMARY KEY(`user_id`,`exam_id`,`day`)
);
--> statement-breakpoint
CREATE TABLE `daily_questions` (
	`exam_id` varchar(36) NOT NULL,
	`day` date NOT NULL,
	`question_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_questions_exam_id_day_pk` PRIMARY KEY(`exam_id`,`day`)
);
--> statement-breakpoint
CREATE TABLE `daily_streaks` (
	`user_id` varchar(36) NOT NULL,
	`exam_id` varchar(36) NOT NULL,
	`current_streak` int NOT NULL DEFAULT 0,
	`longest_streak` int NOT NULL DEFAULT 0,
	`total_solved` int NOT NULL DEFAULT 0,
	`total_correct` int NOT NULL DEFAULT 0,
	`first_day` date NOT NULL,
	`last_day` date NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_streaks_user_id_exam_id_pk` PRIMARY KEY(`user_id`,`exam_id`)
);
--> statement-breakpoint
ALTER TABLE `daily_question_attempts` ADD CONSTRAINT `daily_question_attempts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_question_attempts` ADD CONSTRAINT `daily_question_attempts_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_question_attempts` ADD CONSTRAINT `daily_question_attempts_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_questions` ADD CONSTRAINT `daily_questions_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_questions` ADD CONSTRAINT `daily_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_streaks` ADD CONSTRAINT `daily_streaks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_streaks` ADD CONSTRAINT `daily_streaks_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `daily_attempts_exam_day_idx` ON `daily_question_attempts` (`exam_id`,`day`);--> statement-breakpoint
CREATE INDEX `daily_streaks_exam_idx` ON `daily_streaks` (`exam_id`);