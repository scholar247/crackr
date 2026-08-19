CREATE TABLE `media` (
	`id` varchar(36) NOT NULL,
	`uploaded_by` varchar(36) NOT NULL,
	`original_file_name` varchar(255) NOT NULL,
	`storage_key` varchar(512) NOT NULL,
	`mime_type` varchar(127) NOT NULL,
	`extension` varchar(16),
	`size` int NOT NULL,
	`storage_provider` enum('LOCAL','S3') NOT NULL,
	`checksum` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_storage_key_idx` UNIQUE(`storage_key`)
);
--> statement-breakpoint
ALTER TABLE `media` ADD CONSTRAINT `media_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `media_uploaded_by_created_idx` ON `media` (`uploaded_by`,`created_at`);