CREATE TABLE `communities` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`kind` enum('OFFICIAL','USER_CREATED') NOT NULL DEFAULT 'USER_CREATED',
	`visibility` enum('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
	`status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`program_id` varchar(36),
	`exam_id` varchar(36),
	`banner_image` varchar(2048),
	`creator_user_id` varchar(36) NOT NULL,
	`member_count` int NOT NULL DEFAULT 1,
	`post_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communities_id` PRIMARY KEY(`id`),
	CONSTRAINT `communities_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `community_members` (
	`community_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` enum('OWNER','MODERATOR','MEMBER') NOT NULL DEFAULT 'MEMBER',
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_members_community_id_user_id_pk` PRIMARY KEY(`community_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `community_post_comments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`post_id` bigint unsigned NOT NULL,
	`author_id` varchar(36) NOT NULL,
	`parent_comment_id` bigint unsigned,
	`body` text NOT NULL,
	`status` enum('PUBLISHED','REMOVED') NOT NULL DEFAULT 'PUBLISHED',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_post_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`community_id` varchar(36) NOT NULL,
	`author_id` varchar(36) NOT NULL,
	`body` text NOT NULL,
	`image_url` varchar(2048),
	`status` enum('PUBLISHED','REMOVED') NOT NULL DEFAULT 'PUBLISHED',
	`is_pinned` boolean NOT NULL DEFAULT false,
	`upvote_count` int NOT NULL DEFAULT 0,
	`comment_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_reactions` (
	`user_id` varchar(36) NOT NULL,
	`target_type` enum('POST','COMMENT') NOT NULL,
	`target_id` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_reactions_user_id_target_type_target_id_pk` PRIMARY KEY(`user_id`,`target_type`,`target_id`)
);
--> statement-breakpoint
ALTER TABLE `communities` ADD CONSTRAINT `communities_program_id_programs_id_fk` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communities` ADD CONSTRAINT `communities_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communities` ADD CONSTRAINT `communities_creator_user_id_users_id_fk` FOREIGN KEY (`creator_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_members` ADD CONSTRAINT `community_members_community_id_communities_id_fk` FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_members` ADD CONSTRAINT `community_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_post_comments` ADD CONSTRAINT `community_post_comments_post_id_community_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_post_comments` ADD CONSTRAINT `community_post_comments_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_posts` ADD CONSTRAINT `community_posts_community_id_communities_id_fk` FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_posts` ADD CONSTRAINT `community_posts_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_reactions` ADD CONSTRAINT `community_reactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;