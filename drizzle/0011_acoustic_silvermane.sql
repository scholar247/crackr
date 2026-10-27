ALTER TABLE `assessments` ADD `student_instructions` text;--> statement-breakpoint
ALTER TABLE `assessments` ADD `tags` json;--> statement-breakpoint
ALTER TABLE `assessments` ADD `banner_image` varchar(2048);