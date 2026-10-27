CREATE TABLE `community_notifications` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`recipient_user_id` varchar(36) NOT NULL,
	`actor_user_id` varchar(36) NOT NULL,
	`type` enum('POST_COMMENT','COMMENT_REPLY') NOT NULL,
	`community_id` varchar(36) NOT NULL,
	`post_id` bigint unsigned NOT NULL,
	`comment_id` bigint unsigned NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `community_reactions` ADD `value` tinyint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `community_notifications` ADD CONSTRAINT `community_notifications_recipient_user_id_users_id_fk` FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_notifications` ADD CONSTRAINT `community_notifications_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_notifications` ADD CONSTRAINT `community_notifications_community_id_communities_id_fk` FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_notifications` ADD CONSTRAINT `community_notifications_post_id_community_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `community_notifications_recipient_idx` ON `community_notifications` (`recipient_user_id`,`read`,`id`);