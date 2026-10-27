-- Drop FKs referencing questions.id first: MySQL validates FK column-type compatibility
-- at ALTER time, so questions.id can't change type while a referencing column is still
-- the old type (and vice versa) — reordering the plain MODIFY COLUMN statements alone
-- isn't enough, the constraints have to come off and go back on around the type changes.
ALTER TABLE `assessment_questions` DROP FOREIGN KEY `assessment_questions_question_id_questions_id_fk`;--> statement-breakpoint
ALTER TABLE `attempt_responses` DROP FOREIGN KEY `attempt_responses_question_id_questions_id_fk`;--> statement-breakpoint

ALTER TABLE `articles` MODIFY COLUMN `id` bigint unsigned AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `content_exam_map` MODIFY COLUMN `content_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `content_node_map` MODIFY COLUMN `content_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` MODIFY COLUMN `id` bigint unsigned AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `content_audience_map` MODIFY COLUMN `content_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `assessment_questions` MODIFY COLUMN `question_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `attempt_responses` MODIFY COLUMN `question_id` bigint unsigned NOT NULL;--> statement-breakpoint

ALTER TABLE `assessment_questions` ADD CONSTRAINT `assessment_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempt_responses` ADD CONSTRAINT `attempt_responses_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE restrict ON UPDATE no action;
