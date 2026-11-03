CREATE TABLE `routine_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`sets` integer NOT NULL,
	`reps` integer NOT NULL,
	`duration_seconds` integer,
	`weight_kg` real,
	`rest_seconds` integer NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `routine_exercises_routine_position_idx` ON `routine_exercises` (`routine_id`,`position`);--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout_history` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text,
	`routine_name_snapshot` text NOT NULL,
	`date` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`total_sets` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workout_history_date_idx` ON `workout_history` (`date`);--> statement-breakpoint
CREATE TABLE `workout_history_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `workout_history`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_history_exercises_session_position_idx` ON `workout_history_exercises` (`session_id`,`position`);--> statement-breakpoint
CREATE TABLE `workout_history_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_ref` text NOT NULL,
	`position` integer NOT NULL,
	`reps` integer NOT NULL,
	`weight_kg` real,
	`duration_seconds` integer,
	FOREIGN KEY (`exercise_ref`) REFERENCES `workout_history_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_history_sets_exercise_position_idx` ON `workout_history_sets` (`exercise_ref`,`position`);--> statement-breakpoint
CREATE TABLE `active_session` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL
);
