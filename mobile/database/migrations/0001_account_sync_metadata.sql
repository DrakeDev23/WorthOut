CREATE TABLE `local_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`clerk_user_id` text,
	`display_name` text,
	`email` text,
	`is_active` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `local_accounts_clerk_user_id_unique` ON `local_accounts` (`clerk_user_id`);
--> statement-breakpoint
INSERT INTO `local_accounts` (`id`, `is_active`, `created_at`, `updated_at`)
VALUES ('00000000-0000-4000-8000-000000000001', 1, '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z');
--> statement-breakpoint
ALTER TABLE `routines` ADD COLUMN `account_id` text NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
--> statement-breakpoint
ALTER TABLE `routines` ADD COLUMN `sync_status` text NOT NULL DEFAULT 'synced';
--> statement-breakpoint
ALTER TABLE `routines` ADD COLUMN `client_updated_at` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `routines` ADD COLUMN `last_synced_at` text;
--> statement-breakpoint
ALTER TABLE `routines` ADD COLUMN `server_version` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `routines` ADD COLUMN `server_updated_at` text;
--> statement-breakpoint
ALTER TABLE `routines` ADD COLUMN `deleted_at` text;
--> statement-breakpoint
UPDATE `routines` SET `client_updated_at` = `updated_at` WHERE `client_updated_at` = '';
--> statement-breakpoint
ALTER TABLE `routine_exercises` ADD COLUMN `account_id` text NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
--> statement-breakpoint
ALTER TABLE `routine_exercises` ADD COLUMN `sync_status` text NOT NULL DEFAULT 'synced';
--> statement-breakpoint
ALTER TABLE `routine_exercises` ADD COLUMN `client_updated_at` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `routine_exercises` ADD COLUMN `last_synced_at` text;
--> statement-breakpoint
ALTER TABLE `routine_exercises` ADD COLUMN `server_version` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `routine_exercises` ADD COLUMN `server_updated_at` text;
--> statement-breakpoint
ALTER TABLE `routine_exercises` ADD COLUMN `deleted_at` text;
--> statement-breakpoint
UPDATE `routine_exercises` SET `client_updated_at` = (SELECT `updated_at` FROM `routines` WHERE `routines`.`id` = `routine_exercises`.`routine_id`) WHERE `client_updated_at` = '';
--> statement-breakpoint
ALTER TABLE `workout_history` ADD COLUMN `account_id` text NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
--> statement-breakpoint
ALTER TABLE `workout_history` ADD COLUMN `sync_status` text NOT NULL DEFAULT 'synced';
--> statement-breakpoint
ALTER TABLE `workout_history` ADD COLUMN `client_updated_at` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `workout_history` ADD COLUMN `last_synced_at` text;
--> statement-breakpoint
ALTER TABLE `workout_history` ADD COLUMN `server_version` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `workout_history` ADD COLUMN `server_updated_at` text;
--> statement-breakpoint
ALTER TABLE `workout_history` ADD COLUMN `deleted_at` text;
--> statement-breakpoint
UPDATE `workout_history` SET `client_updated_at` = `date` WHERE `client_updated_at` = '';
--> statement-breakpoint
ALTER TABLE `workout_history_exercises` ADD COLUMN `account_id` text NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
--> statement-breakpoint
ALTER TABLE `workout_history_exercises` ADD COLUMN `sync_status` text NOT NULL DEFAULT 'synced';
--> statement-breakpoint
ALTER TABLE `workout_history_exercises` ADD COLUMN `client_updated_at` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `workout_history_exercises` ADD COLUMN `last_synced_at` text;
--> statement-breakpoint
ALTER TABLE `workout_history_exercises` ADD COLUMN `server_version` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `workout_history_exercises` ADD COLUMN `server_updated_at` text;
--> statement-breakpoint
ALTER TABLE `workout_history_exercises` ADD COLUMN `deleted_at` text;
--> statement-breakpoint
UPDATE `workout_history_exercises` SET `client_updated_at` = (SELECT `date` FROM `workout_history` WHERE `workout_history`.`id` = `workout_history_exercises`.`session_id`) WHERE `client_updated_at` = '';
--> statement-breakpoint
ALTER TABLE `workout_history_sets` ADD COLUMN `account_id` text NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
--> statement-breakpoint
ALTER TABLE `workout_history_sets` ADD COLUMN `sync_status` text NOT NULL DEFAULT 'synced';
--> statement-breakpoint
ALTER TABLE `workout_history_sets` ADD COLUMN `client_updated_at` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `workout_history_sets` ADD COLUMN `last_synced_at` text;
--> statement-breakpoint
ALTER TABLE `workout_history_sets` ADD COLUMN `server_version` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `workout_history_sets` ADD COLUMN `server_updated_at` text;
--> statement-breakpoint
ALTER TABLE `workout_history_sets` ADD COLUMN `deleted_at` text;
--> statement-breakpoint
UPDATE `workout_history_sets` SET `client_updated_at` = (SELECT `date` FROM `workout_history` JOIN `workout_history_exercises` ON `workout_history_exercises`.`session_id` = `workout_history`.`id` WHERE `workout_history_exercises`.`id` = `workout_history_sets`.`exercise_ref`) WHERE `client_updated_at` = '';
--> statement-breakpoint
ALTER TABLE `active_session` ADD COLUMN `account_id` text NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
--> statement-breakpoint
UPDATE `active_session` SET `id` = '00000000-0000-4000-8000-000000000001:current' WHERE `id` = 'current';
--> statement-breakpoint
CREATE INDEX `routines_account_sync_idx` ON `routines` (`account_id`,`sync_status`);
--> statement-breakpoint
CREATE INDEX `routine_exercises_account_sync_idx` ON `routine_exercises` (`account_id`,`sync_status`);
--> statement-breakpoint
CREATE INDEX `workout_history_account_sync_idx` ON `workout_history` (`account_id`,`sync_status`);
--> statement-breakpoint
CREATE INDEX `workout_history_exercises_account_sync_idx` ON `workout_history_exercises` (`account_id`,`sync_status`);
--> statement-breakpoint
CREATE INDEX `workout_history_sets_account_sync_idx` ON `workout_history_sets` (`account_id`,`sync_status`);
