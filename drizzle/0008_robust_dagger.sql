CREATE TABLE `assessment_challenges` (
	`assessment_id` varchar(36) NOT NULL,
	`challenger_user_id` varchar(36) NOT NULL,
	`opponent_user_id` varchar(36) NOT NULL,
	`status` enum('PENDING','ACCEPTED','DECLINED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING',
	`responded_at` timestamp,
	CONSTRAINT `assessment_challenges_assessment_id` PRIMARY KEY(`assessment_id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_pending_invites` (
	`id` varchar(36) NOT NULL,
	`assessment_id` varchar(36) NOT NULL,
	`email` varchar(320) NOT NULL,
	`invited_by_user_id` varchar(36) NOT NULL,
	`status` enum('PENDING','CLAIMED','REVOKED') NOT NULL DEFAULT 'PENDING',
	`claimed_by_user_id` varchar(36),
	`claimed_at` timestamp,
	`available_from` timestamp,
	`available_until` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessment_pending_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `assessment_pending_invites_email_status_idx` UNIQUE(`email`,`status`,`assessment_id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_sections` (
	`id` varchar(36) NOT NULL,
	`assessment_id` varchar(36) NOT NULL,
	`title` varchar(160) NOT NULL,
	`node_id` varchar(36),
	`position` int NOT NULL,
	`question_count` int NOT NULL,
	`difficulty` enum('EASY','MEDIUM','HARD','EXPERT'),
	`default_marks` decimal(6,2) NOT NULL DEFAULT '1',
	`default_negative_marks` decimal(6,2) NOT NULL DEFAULT '0',
	CONSTRAINT `assessment_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessment_attempts` ADD `counts_toward_progress` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `assessment_questions` ADD `section_id` varchar(36);--> statement-breakpoint
ALTER TABLE `assessments` ADD `scheduling_mode` enum('FIXED','FLEXIBLE') DEFAULT 'FLEXIBLE' NOT NULL;--> statement-breakpoint
ALTER TABLE `attempt_responses` ADD `marked_for_review` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `assessment_challenges` ADD CONSTRAINT `assessment_challenges_assessment_id_assessments_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_challenges` ADD CONSTRAINT `assessment_challenges_challenger_user_id_users_id_fk` FOREIGN KEY (`challenger_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_challenges` ADD CONSTRAINT `assessment_challenges_opponent_user_id_users_id_fk` FOREIGN KEY (`opponent_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_pending_invites` ADD CONSTRAINT `assessment_pending_invites_assessment_id_assessments_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_pending_invites` ADD CONSTRAINT `assessment_pending_invites_invited_by_user_id_users_id_fk` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_pending_invites` ADD CONSTRAINT `assessment_pending_invites_claimed_by_user_id_users_id_fk` FOREIGN KEY (`claimed_by_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_sections` ADD CONSTRAINT `assessment_sections_assessment_id_assessments_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_sections` ADD CONSTRAINT `assessment_sections_node_id_curriculum_nodes_id_fk` FOREIGN KEY (`node_id`) REFERENCES `curriculum_nodes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_questions` ADD CONSTRAINT `assessment_questions_section_id_assessment_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `assessment_sections`(`id`) ON DELETE set null ON UPDATE no action;