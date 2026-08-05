CREATE TABLE `auth_accounts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`provider` varchar(50) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_accounts_provider_idx` UNIQUE(`provider`,`provider_account_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`image` varchar(2048),
	`role` enum('SUPER_ADMIN','ADMIN','TEACHER','STUDENT') NOT NULL DEFAULT 'STUDENT',
	`status` enum('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
	`onboarding_completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `org_memberships` (
	`user_id` varchar(36) NOT NULL,
	`org_id` varchar(36) NOT NULL,
	`org_role` enum('ORG_ADMIN','ORG_MEMBER') NOT NULL DEFAULT 'ORG_MEMBER',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_memberships_user_id_org_id_pk` PRIMARY KEY(`user_id`,`org_id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`status` enum('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `curriculum_edges` (
	`parent_node_id` varchar(36) NOT NULL,
	`child_node_id` varchar(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `curriculum_edges_parent_node_id_child_node_id_pk` PRIMARY KEY(`parent_node_id`,`child_node_id`)
);
--> statement-breakpoint
CREATE TABLE `curriculum_nodes` (
	`id` varchar(36) NOT NULL,
	`node_type` enum('SUBJECT','CHAPTER','TOPIC','SUBTOPIC') NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`description` text,
	`status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `curriculum_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_node_map` (
	`exam_id` varchar(36) NOT NULL,
	`node_id` varchar(36) NOT NULL,
	CONSTRAINT `exam_node_map_exam_id_node_id_pk` PRIMARY KEY(`exam_id`,`node_id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` varchar(36) NOT NULL,
	`program_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`description` text,
	`status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exams_id` PRIMARY KEY(`id`),
	CONSTRAINT `exams_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`description` text,
	`status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `programs_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` varchar(36) NOT NULL,
	`title` varchar(160) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`summary` text,
	`body` text NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`status` enum('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`visibility` enum('PUBLIC','PRIVATE','AUDIENCE_RESTRICTED') NOT NULL DEFAULT 'PRIVATE',
	`author_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `content_exam_map` (
	`id` varchar(36) NOT NULL,
	`content_type` enum('QUESTION','ARTICLE') NOT NULL,
	`content_id` varchar(36) NOT NULL,
	`exam_id` varchar(36) NOT NULL,
	`relation_type` enum('PRIMARY','SUPPLEMENTARY','PRACTICE') NOT NULL DEFAULT 'PRIMARY',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_exam_map_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_exam_map_unique_idx` UNIQUE(`content_type`,`content_id`,`exam_id`,`relation_type`)
);
--> statement-breakpoint
CREATE TABLE `content_node_map` (
	`id` varchar(36) NOT NULL,
	`content_type` enum('QUESTION','ARTICLE') NOT NULL,
	`content_id` varchar(36) NOT NULL,
	`node_id` varchar(36) NOT NULL,
	`relation_type` enum('PRIMARY','SUPPLEMENTARY','PRACTICE') NOT NULL DEFAULT 'PRIMARY',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_node_map_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_node_map_unique_idx` UNIQUE(`content_type`,`content_id`,`node_id`,`relation_type`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` varchar(36) NOT NULL,
	`question_type` enum('MCQ') NOT NULL DEFAULT 'MCQ',
	`stem` text NOT NULL,
	`options_json` json NOT NULL,
	`explanation` text,
	`difficulty` enum('EASY','MEDIUM','HARD','EXPERT') NOT NULL DEFAULT 'MEDIUM',
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`status` enum('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`visibility` enum('PUBLIC','PRIVATE','AUDIENCE_RESTRICTED') NOT NULL DEFAULT 'PRIVATE',
	`author_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audiences` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`code` varchar(100) NOT NULL,
	`status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audiences_id` PRIMARY KEY(`id`),
	CONSTRAINT `audiences_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `content_audience_map` (
	`content_type` enum('QUESTION','ARTICLE') NOT NULL,
	`content_id` varchar(36) NOT NULL,
	`audience_id` varchar(36) NOT NULL,
	CONSTRAINT `content_audience_map_content_type_content_id_audience_id_pk` PRIMARY KEY(`content_type`,`content_id`,`audience_id`)
);
--> statement-breakpoint
CREATE TABLE `user_audience_map` (
	`user_id` varchar(36) NOT NULL,
	`audience_id` varchar(36) NOT NULL,
	CONSTRAINT `user_audience_map_user_id_audience_id_pk` PRIMARY KEY(`user_id`,`audience_id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_access` (
	`id` varchar(36) NOT NULL,
	`assessment_id` varchar(36) NOT NULL,
	`access_type` enum('USER','AUDIENCE','PUBLIC','INVITE') NOT NULL,
	`user_id` varchar(36),
	`audience_id` varchar(36),
	`invite_code_hash` varchar(255),
	`available_from` timestamp,
	`available_until` timestamp,
	CONSTRAINT `assessment_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_attempts` (
	`id` varchar(36) NOT NULL,
	`assessment_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`attempt_number` int NOT NULL DEFAULT 1,
	`status` enum('IN_PROGRESS','SUBMITTED','EXPIRED','ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
	`score` decimal(8,2),
	`percentage` decimal(5,2),
	`time_spent_seconds` int,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`submitted_at` timestamp,
	CONSTRAINT `assessment_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_questions` (
	`assessment_id` varchar(36) NOT NULL,
	`question_id` varchar(36) NOT NULL,
	`position` int NOT NULL,
	`marks` decimal(6,2) NOT NULL DEFAULT '1',
	`negative_marks` decimal(6,2) NOT NULL DEFAULT '0',
	`question_snapshot` json NOT NULL,
	`is_optional` boolean NOT NULL DEFAULT false,
	CONSTRAINT `assessment_questions_assessment_id_question_id_position_pk` PRIMARY KEY(`assessment_id`,`question_id`,`position`)
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` varchar(36) NOT NULL,
	`type` enum('MOCK','TEST','CHALLENGE','OFFICIAL') NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text,
	`creator_user_id` varchar(36) NOT NULL,
	`visibility` enum('PRIVATE','UNLISTED','PUBLIC','RESTRICTED') NOT NULL DEFAULT 'PRIVATE',
	`status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`exam_id` varchar(36),
	`duration_seconds` int,
	`scoring_config` json,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`max_attempts` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attempt_responses` (
	`id` varchar(36) NOT NULL,
	`attempt_id` varchar(36) NOT NULL,
	`question_id` varchar(36) NOT NULL,
	`selected_option_keys` json,
	`is_correct` boolean,
	`marks_awarded` decimal(6,2),
	`time_spent_seconds` int,
	`answered_at` timestamp,
	CONSTRAINT `attempt_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `attempt_responses_attempt_question_idx` UNIQUE(`attempt_id`,`question_id`)
);
--> statement-breakpoint
CREATE TABLE `test_series` (
	`id` varchar(36) NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text,
	`creator_user_id` varchar(36) NOT NULL,
	`visibility` enum('PRIVATE','UNLISTED','PUBLIC','RESTRICTED') NOT NULL DEFAULT 'PRIVATE',
	`status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `test_series_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_series_items` (
	`series_id` varchar(36) NOT NULL,
	`assessment_id` varchar(36) NOT NULL,
	`position` int NOT NULL,
	`unlock_rule` json,
	`due_at` timestamp,
	CONSTRAINT `test_series_items_series_id_assessment_id_pk` PRIMARY KEY(`series_id`,`assessment_id`)
);
--> statement-breakpoint
ALTER TABLE `auth_accounts` ADD CONSTRAINT `auth_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_memberships` ADD CONSTRAINT `org_memberships_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_memberships` ADD CONSTRAINT `org_memberships_org_id_organizations_id_fk` FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `curriculum_edges` ADD CONSTRAINT `curriculum_edges_parent_node_id_curriculum_nodes_id_fk` FOREIGN KEY (`parent_node_id`) REFERENCES `curriculum_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `curriculum_edges` ADD CONSTRAINT `curriculum_edges_child_node_id_curriculum_nodes_id_fk` FOREIGN KEY (`child_node_id`) REFERENCES `curriculum_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_node_map` ADD CONSTRAINT `exam_node_map_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_node_map` ADD CONSTRAINT `exam_node_map_node_id_curriculum_nodes_id_fk` FOREIGN KEY (`node_id`) REFERENCES `curriculum_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exams` ADD CONSTRAINT `exams_program_id_programs_id_fk` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `articles` ADD CONSTRAINT `articles_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_exam_map` ADD CONSTRAINT `content_exam_map_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_node_map` ADD CONSTRAINT `content_node_map_node_id_curriculum_nodes_id_fk` FOREIGN KEY (`node_id`) REFERENCES `curriculum_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_audience_map` ADD CONSTRAINT `content_audience_map_audience_id_audiences_id_fk` FOREIGN KEY (`audience_id`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_audience_map` ADD CONSTRAINT `user_audience_map_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_audience_map` ADD CONSTRAINT `user_audience_map_audience_id_audiences_id_fk` FOREIGN KEY (`audience_id`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_access` ADD CONSTRAINT `assessment_access_assessment_id_assessments_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_access` ADD CONSTRAINT `assessment_access_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_access` ADD CONSTRAINT `assessment_access_audience_id_audiences_id_fk` FOREIGN KEY (`audience_id`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_attempts` ADD CONSTRAINT `assessment_attempts_assessment_id_assessments_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_attempts` ADD CONSTRAINT `assessment_attempts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_questions` ADD CONSTRAINT `assessment_questions_assessment_id_assessments_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_questions` ADD CONSTRAINT `assessment_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_creator_user_id_users_id_fk` FOREIGN KEY (`creator_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempt_responses` ADD CONSTRAINT `attempt_responses_attempt_id_assessment_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempt_responses` ADD CONSTRAINT `attempt_responses_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_series` ADD CONSTRAINT `test_series_creator_user_id_users_id_fk` FOREIGN KEY (`creator_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_series_items` ADD CONSTRAINT `test_series_items_series_id_test_series_id_fk` FOREIGN KEY (`series_id`) REFERENCES `test_series`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_series_items` ADD CONSTRAINT `test_series_items_assessment_id_assessments_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;