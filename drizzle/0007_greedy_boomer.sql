ALTER TABLE `users` ADD `college` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `degree` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passing_year` int;--> statement-breakpoint
ALTER TABLE `users` ADD `target_program_id` varchar(36);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_target_program_id_programs_id_fk` FOREIGN KEY (`target_program_id`) REFERENCES `programs`(`id`) ON DELETE set null ON UPDATE no action;