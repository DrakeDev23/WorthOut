# Worthout – Database Design

## 1. Database Overview

Worthout uses a dual-layer database architecture to support local-first operation:

| Database | Platform | Purpose | Technology |
|---|---|---|---|
| **SQLite** | Mobile Client (Local) | Immediate offline persistence, low-latency UI queries | SQLite with Drizzle ORM |
| **PostgreSQL** | Cloud Backend (Remote) | Central data store, multi-device backup, analytics | PostgreSQL 16+ with SQLAlchemy & Alembic |

Both schemas share compatible core entity structures and UUID primary keys. However, each layer includes specialized metadata tailored to its synchronization role.

---

## 2. SQLite to PostgreSQL Data Type Mapping

SQLite is loosely typed, while PostgreSQL is strictly typed. The application code must maintain explicit mapping between SQLite and PostgreSQL types:

| Conceptual Type | PostgreSQL Type | SQLite Type (Drizzle) | Notes / Mapping Strategy |
|---|---|---|---|
| **UUID** | `UUID` | `TEXT` | Stored as canonical 36-character lowercase UUID strings (RFC 4122). Generated on the client using `uuidv4()`. |
| **Timestamp** | `TIMESTAMP WITH TIME ZONE` | `TEXT` | Stored as ISO 8601 UTC strings (`YYYY-MM-DDTHH:MM:SS.sssZ`) to preserve timezone awareness. |
| **Boolean** | `BOOLEAN` | `INTEGER` | Stored as `1` (true) or `0` (false) in SQLite; mapped to boolean in Drizzle. |
| **Floating/Decimal** | `NUMERIC(6, 2)` | `REAL` | Used for `weight_kg`. Rounded to 2 decimal places in application logic. |
| **Integer** | `INTEGER` | `INTEGER` | Standard signed 32/64-bit integer. |
| **Text** | `VARCHAR(N)` / `TEXT` | `TEXT` | UTF-8 encoded text. |
| **Structured JSON** | `JSONB` | `TEXT` | Stored as JSON strings in SQLite (`JSON.stringify` / `JSON.parse` handled by Drizzle). |

---

## 3. Synchronization Metadata Separation

To support bidirectional offline synchronization, specific metadata columns are designated for SQLite (local tracking) versus PostgreSQL (cloud tracking):

### 3.1 Local SQLite Sync Metadata (Mobile Only)
These columns exist on local SQLite tables for user-owned syncable entities (`workout_routines`, `routine_exercises`, `workout_sessions`, `workout_exercises`, `exercise_sets`):
- `sync_status` (`TEXT`): Current sync state:
  - `'synced'`: Matches cloud state.
  - `'pending_insert'`: Created locally while offline; pending upload.
  - `'pending_update'`: Modified locally; pending upload.
  - `'pending_delete'`: Marked for deletion locally; pending tombstone upload.
- `client_updated_at` (`TEXT`): Local device ISO 8601 timestamp of the latest edit.
- `last_synced_at` (`TEXT`, Nullable): ISO 8601 timestamp of the last successful sync with the backend.

### 3.2 Cloud PostgreSQL Sync Metadata (Backend Only)
These columns exist on PostgreSQL tables for user-owned syncable entities:
- `server_updated_at` (`TIMESTAMP WITH TIME ZONE`): Server-authoritative timestamp set on insert/update. Used for delta pulls (`GET /sync/pull?since=...`).
- `version` (`INTEGER`): Monotonically increasing revision counter per record to detect concurrent updates and conflict resolution.

### 3.3 Shared Tombstone Column (Both SQLite and PostgreSQL)
- `deleted_at` (`TIMESTAMP WITH TIME ZONE` / `TEXT`, Nullable): Soft deletion timestamp. Records are never hard-deleted during normal client synchronization so that deletions can propagate safely across multiple devices.

---

## 4. Database Entities

### 4.1 users
Stores application user accounts mapped from Clerk authentication.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `id` | UUID | TEXT | PRIMARY KEY | Unique user identifier. |
| `clerk_user_id` | VARCHAR(255) | TEXT | UNIQUE, NOT NULL | External Clerk identity subject (`sub`). |
| `display_name` | VARCHAR(255) | TEXT | NULLABLE | User display name. |
| `email` | VARCHAR(255) | TEXT | NULLABLE | User primary email. |
| `created_at` | TIMESTAMPTZ | TEXT | NOT NULL | Record creation timestamp. |
| `updated_at` | TIMESTAMPTZ | TEXT | NOT NULL | Last update timestamp. |
| `deleted_at` | TIMESTAMPTZ | TEXT | NULLABLE | Soft deletion timestamp. |

> *Note: On the mobile client, the `users` table stores the cached profile of the currently signed-in user.*

### 4.2 exercises
Catalog of supported exercises. Sourced from initial application seed data and cloud synchronization.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `id` | UUID | TEXT | PRIMARY KEY | Unique exercise ID. |
| `name` | VARCHAR(255) | TEXT | NOT NULL | Exercise name (e.g., "Push-up"). |
| `description` | TEXT | TEXT | NULLABLE | Detailed description. |
| `instructions` | JSONB | TEXT | NULLABLE | Ordered list of instruction steps. |
| `difficulty` | VARCHAR(50) | TEXT | NOT NULL | `'beginner'`, `'intermediate'`, `'advanced'`. |
| `tracking_type` | VARCHAR(50) | TEXT | NOT NULL | `'reps'`, `'duration'`, `'weight_reps'`. |
| `is_active` | BOOLEAN | INTEGER | NOT NULL DEFAULT TRUE | Catalog active flag. |
| `created_at` | TIMESTAMPTZ | TEXT | NOT NULL | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | TEXT | NOT NULL | Update timestamp. |

### 4.3 equipment
Catalog of supported home gym equipment.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `id` | UUID | TEXT | PRIMARY KEY | Unique equipment ID. |
| `name` | VARCHAR(100) | TEXT | UNIQUE, NOT NULL | Equipment name (e.g., "Dumbbells"). |
| `description` | TEXT | TEXT | NULLABLE | Description. |
| `created_at` | TIMESTAMPTZ | TEXT | NOT NULL | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | TEXT | NOT NULL | Update timestamp. |

### 4.4 muscle_groups
Catalog of anatomical muscle group classifications.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `id` | UUID | TEXT | PRIMARY KEY | Unique muscle group ID. |
| `name` | VARCHAR(100) | TEXT | UNIQUE, NOT NULL | Muscle group name (e.g., "Chest", "Triceps"). |
| `description` | TEXT | TEXT | NULLABLE | Description. |
| `created_at` | TIMESTAMPTZ | TEXT | NOT NULL | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | TEXT | NOT NULL | Update timestamp. |

### 4.5 exercise_equipment
Associative table linking exercises to required or optional equipment.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `exercise_id` | UUID | TEXT | NOT NULL, FK -> `exercises(id)` ON DELETE CASCADE | Target exercise. |
| `equipment_id` | UUID | TEXT | NOT NULL, FK -> `equipment(id)` ON DELETE CASCADE | Associated equipment. |

- **Primary Key:** Composite `(exercise_id, equipment_id)`.

### 4.6 exercise_muscle_groups
Associative table linking exercises to targeted muscle groups.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `exercise_id` | UUID | TEXT | NOT NULL, FK -> `exercises(id)` ON DELETE CASCADE | Target exercise. |
| `muscle_group_id` | UUID | TEXT | NOT NULL, FK -> `muscle_groups(id)` ON DELETE CASCADE | Associated muscle group. |
| `is_primary` | BOOLEAN | INTEGER | NOT NULL DEFAULT TRUE | True for primary mover, False for secondary. |

- **Primary Key:** Composite `(exercise_id, muscle_group_id)`.

### 4.7 workout_routines
User-created workout routine templates.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `id` | UUID | TEXT | PRIMARY KEY | Unique routine ID. |
| `user_id` | UUID | TEXT | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | Owning user ID. |
| `name` | VARCHAR(255) | TEXT | NOT NULL | Routine name (e.g., "Upper Body A"). |
| `description` | TEXT | TEXT | NULLABLE | Routine notes or description. |
| `created_at` | TIMESTAMPTZ | TEXT | NOT NULL | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | TEXT | NOT NULL | Last update timestamp. |
| `deleted_at` | TIMESTAMPTZ | TEXT | NULLABLE | Soft deletion tombstone. |

*Plus synchronization metadata columns (Section 3).*

### 4.8 routine_exercises
Individual exercises scheduled within a workout routine template.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `id` | UUID | TEXT | PRIMARY KEY | Unique routine exercise ID. |
| `routine_id` | UUID | TEXT | NOT NULL, FK -> `workout_routines(id)` ON DELETE CASCADE | Parent routine template. |
| `exercise_id` | UUID | TEXT | NOT NULL, FK -> `exercises(id)` ON DELETE RESTRICT | Catalog exercise. |
| `position` | INTEGER | INTEGER | NOT NULL | 1-based order in routine. |
| `target_sets` | INTEGER | INTEGER | NOT NULL | Planned number of sets. |
| `target_reps` | INTEGER | INTEGER | NULLABLE | Planned reps per set (for rep-based exercises). |
| `target_duration_seconds` | INTEGER | INTEGER | NULLABLE | Planned duration per set in seconds (for timed exercises). |
| `rest_seconds` | INTEGER | INTEGER | NOT NULL DEFAULT 60 | Rest timer target duration in seconds. |
| `created_at` | TIMESTAMPTZ | TEXT | NOT NULL | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | TEXT | NOT NULL | Last update timestamp. |
| `deleted_at` | TIMESTAMPTZ | TEXT | NULLABLE | Soft deletion tombstone. |

*Plus synchronization metadata columns (Section 3).*

- **Unique Constraint:** `UNIQUE (routine_id, position)` among non-deleted records.

### 4.9 workout_sessions
Instances of actual workouts (either guided from a routine or logged manually).

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `id` | UUID | TEXT | PRIMARY KEY | Unique workout session ID. |
| `user_id` | UUID | TEXT | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | Owning user ID. |
| `routine_id` | UUID | TEXT | NULLABLE, FK -> `workout_routines(id)` ON DELETE SET NULL | Source routine, or NULL if manual. |
| `name` | VARCHAR(255) | TEXT | NOT NULL | Session name (e.g., "Afternoon Workout"). |
| `started_at` | TIMESTAMPTZ | TEXT | NOT NULL | Session start timestamp. |
| `completed_at` | TIMESTAMPTZ | TEXT | NULLABLE | Session completion timestamp. |
| `duration_seconds` | INTEGER | INTEGER | NULLABLE | Total active workout time in seconds. |
| `status` | VARCHAR(50) | TEXT | NOT NULL | `'in_progress'`, `'completed'`, `'cancelled'`. |
| `notes` | TEXT | TEXT | NULLABLE | User workout notes. |
| `created_at` | TIMESTAMPTZ | TEXT | NOT NULL | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | TEXT | NOT NULL | Last update timestamp. |
| `deleted_at` | TIMESTAMPTZ | TEXT | NULLABLE | Soft deletion tombstone. |

*Plus synchronization metadata columns (Section 3).*

### 4.10 workout_exercises
Exercises executed within an active or completed workout session.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `id` | UUID | TEXT | PRIMARY KEY | Unique workout exercise ID. |
| `session_id` | UUID | TEXT | NOT NULL, FK -> `workout_sessions(id)` ON DELETE CASCADE | Parent workout session. |
| `exercise_id` | UUID | TEXT | NOT NULL, FK -> `exercises(id)` ON DELETE RESTRICT | Executed exercise. |
| `position` | INTEGER | INTEGER | NOT NULL | 1-based order in session. |
| `notes` | TEXT | TEXT | NULLABLE | Exercise-specific session notes. |
| `created_at` | TIMESTAMPTZ | TEXT | NOT NULL | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | TEXT | NOT NULL | Last update timestamp. |
| `deleted_at` | TIMESTAMPTZ | TEXT | NULLABLE | Soft deletion tombstone. |

*Plus synchronization metadata columns (Section 3).*

- **Unique Constraint:** `UNIQUE (session_id, position)` among non-deleted records.

### 4.11 exercise_sets
Individual sets performed for a workout exercise.

| Column | PostgreSQL Type | SQLite Type | Constraints | Description |
|---|---|---|---|---|
| `id` | UUID | TEXT | PRIMARY KEY | Unique exercise set ID. |
| `workout_exercise_id` | UUID | TEXT | NOT NULL, FK -> `workout_exercises(id)` ON DELETE CASCADE | Parent workout exercise. |
| `set_number` | INTEGER | INTEGER | NOT NULL | 1-based set sequence number. |
| `repetitions` | INTEGER | INTEGER | NULLABLE | Actual repetitions completed. |
| `weight_kg` | NUMERIC(6,2) | REAL | NULLABLE | Weight used in kilograms. |
| `duration_seconds` | INTEGER | INTEGER | NULLABLE | Actual duration completed in seconds. |
| `is_completed` | BOOLEAN | INTEGER | NOT NULL DEFAULT FALSE | Whether the set was finished. |
| `created_at` | TIMESTAMPTZ | TEXT | NOT NULL | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | TEXT | NOT NULL | Last update timestamp. |
| `deleted_at` | TIMESTAMPTZ | TEXT | NULLABLE | Soft deletion tombstone. |

*Plus synchronization metadata columns (Section 3).*

- **Unique Constraint:** `UNIQUE (workout_exercise_id, set_number)` among non-deleted records.

---

## 5. Entity Relationships and Cascade Actions

```text
users
  │
  ├── 1:N (ON DELETE CASCADE) ──> workout_routines
  │                                     │
  │                                     └── 1:N (ON DELETE CASCADE) ──> routine_exercises
  │                                                                            │
  │                                                                            └── N:1 (ON DELETE RESTRICT) ──> exercises
  │
  └── 1:N (ON DELETE CASCADE) ──> workout_sessions
                                        │
                                        ├── N:1 (ON DELETE SET NULL) ──> workout_routines
                                        │
                                        └── 1:N (ON DELETE CASCADE) ──> workout_exercises
                                                                              │
                                                                              ├── N:1 (ON DELETE RESTRICT) ──> exercises
                                                                              │
                                                                              └── 1:N (ON DELETE CASCADE) ──> exercise_sets
exercises
  ├── N:M (ON DELETE CASCADE) ──> equipment (via exercise_equipment)
  └── N:M (ON DELETE CASCADE) ──> muscle_groups (via exercise_muscle_groups)
```

### Cascade Rules Summary:
1. Deleting a `user` cascades and deletes all owned `workout_routines` and `workout_sessions`.
2. Deleting a `workout_routine` cascades and deletes its `routine_exercises`. Existing `workout_sessions` that referenced this routine have their `routine_id` set to `NULL` (`ON DELETE SET NULL`).
3. Deleting a `workout_session` cascades and deletes its `workout_exercises` and associated `exercise_sets`.
4. Deleting an `exercise` from the catalog is restricted (`ON DELETE RESTRICT`) if referenced by routine exercises or workout exercises to prevent orphaned references.

### Ownership enforcement boundary

The database enforces ownership of top-level `workout_routines` and `workout_sessions` through their required `user_id` foreign keys. A `workout_session.routine_id` foreign key guarantees that the routine exists, but the approved `ON DELETE SET NULL` behavior does not permit a composite `(user_id, routine_id)` foreign key without making the session owner nullable or changing the approved cascade behavior. Therefore, every service-layer operation that accepts both a user and a routine/session reference must use an ownership-scoped query before writing. The reusable backend guard is implemented in `backend/app/services/ownership.py`; API and synchronization services must call it before creating or updating aggregates.

---

## 6. Constraints and Validation Rules

- **Set Numbers:** `set_number > 0`.
- **Positions:** `position > 0` for all sequence columns.
- **Repetitions:** `repetitions IS NULL OR repetitions >= 0`.
- **Weights:** `weight_kg IS NULL OR weight_kg >= 0`.
- **Durations:** `duration_seconds IS NULL OR duration_seconds >= 0`, `target_duration_seconds IS NULL OR target_duration_seconds >= 0`.
- **Rest Seconds:** `rest_seconds >= 0`.
- **Session Status:** `status IN ('in_progress', 'completed', 'cancelled')`.
- **Exercise Difficulty:** `difficulty IN ('beginner', 'intermediate', 'advanced')`.
- **Exercise Tracking Type:** `tracking_type IN ('reps', 'duration', 'weight_reps')`.
- **Local Sync Status (SQLite):** `sync_status IN ('synced', 'pending_insert', 'pending_update', 'pending_delete')`.

---

## 7. Indexing Strategy

To support fast offline UI queries, historical aggregations, and delta synchronization queries, the following indexes must be maintained:

### 7.1 PostgreSQL Indexes
- `users`: `CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);`
- `exercises`: `CREATE INDEX idx_exercises_active_diff ON exercises(is_active, difficulty);`
- `workout_routines`:
  - `CREATE INDEX idx_routines_user_deleted ON workout_routines(user_id, deleted_at);`
  - `CREATE INDEX idx_routines_server_sync ON workout_routines(user_id, server_updated_at);`
- `routine_exercises`:
  - `CREATE INDEX idx_routine_ex_routine ON routine_exercises(routine_id, deleted_at);`
  - `CREATE INDEX idx_routine_ex_server_sync ON routine_exercises(server_updated_at);`
- `workout_sessions`:
  - `CREATE INDEX idx_sessions_user_started ON workout_sessions(user_id, started_at DESC);`
  - `CREATE INDEX idx_sessions_user_status ON workout_sessions(user_id, status);`
  - `CREATE INDEX idx_sessions_server_sync ON workout_sessions(user_id, server_updated_at);`
- `workout_exercises`:
  - `CREATE INDEX idx_workout_ex_session ON workout_exercises(session_id, deleted_at);`
  - `CREATE INDEX idx_workout_ex_server_sync ON workout_exercises(server_updated_at);`
- `exercise_sets`:
  - `CREATE INDEX idx_sets_workout_ex ON exercise_sets(workout_exercise_id, set_number);`
  - `CREATE INDEX idx_sets_server_sync ON exercise_sets(server_updated_at);`

### 7.2 Local SQLite Indexes (Mobile)
- `workout_routines`: `CREATE INDEX idx_local_routines_sync ON workout_routines(sync_status);`
- `routine_exercises`: `CREATE INDEX idx_local_routine_ex_routine ON routine_exercises(routine_id);`
- `workout_sessions`:
  - `CREATE INDEX idx_local_sessions_started ON workout_sessions(started_at DESC);`
  - `CREATE INDEX idx_local_sessions_sync ON workout_sessions(sync_status);`
- `workout_exercises`: `CREATE INDEX idx_local_workout_ex_session ON workout_exercises(session_id);`
- `exercise_sets`: `CREATE INDEX idx_local_sets_workout_ex ON exercise_sets(workout_exercise_id);`

---

## 8. Mobile schema reconciliation (Stage 9.3)

This section records the finalized mobile-side reconciliation with `docs/api-contract.md`.

### 8.1 Current implementation versus target

**Verified current implementation:** Drizzle currently persists routine aggregates, completed-workout snapshots, and one local active-workout JSON payload. The active payload is recovery state, not cloud history. The current tables do not yet contain account ownership or synchronization metadata.

**Target mobile implementation:** SQLite remains the local source of truth. User-owned rows receive `account_id`, syncable rows receive local/server synchronization metadata, and repository reads/writes are always scoped to the active local account.

The current normalized cloud entities are intentionally not introduced as a replacement for the existing history snapshot tables. Existing workout history remains a local snapshot and will map to the cloud `workout_sessions`, `workout_exercises`, and `exercise_sets` aggregate during a later sync implementation.

### 8.2 Local account table

The mobile database uses `local_accounts` as the account boundary:

| Column | SQLite type | Rules |
|---|---|---|
| `id` | TEXT | UUID v4 primary key |
| `clerk_user_id` | TEXT | Nullable until Clerk integration; unique when present |
| `display_name` | TEXT | Nullable cached identity field |
| `email` | TEXT | Nullable cached identity field |
| `is_active` | INTEGER | One active local account at a time |
| `created_at` | TEXT | RFC 3339 UTC |
| `updated_at` | TEXT | RFC 3339 UTC |

Migration `0001_account_sync_metadata` creates a legacy local account and assigns existing rows to it. This is deliberately non-destructive. A later account-bootstrap decision may claim or export legacy data; the migration does not silently associate it with a Clerk identity.

### 8.3 Account ownership

The following tables contain `account_id`:

- `routines`
- `routine_exercises`
- `workout_history`
- `workout_history_exercises`
- `workout_history_sets`
- `active_session`

Repositories scope all reads, updates, deletes, and active-session recovery by `account_id`. The active session key is account-scoped as `<account_id>:current`; active recovery remains local-only and is never placed in the sync queue.

### 8.4 Local synchronization metadata

Each syncable local table contains:

| Column | Meaning |
|---|---|
| `sync_status` | `synced`, `pending_insert`, `pending_update`, or `pending_delete` |
| `client_updated_at` | Client event time for diagnostics and upload metadata only |
| `last_synced_at` | Last successful server acknowledgement |
| `server_version` | Last server version known locally; default `0` |
| `server_updated_at` | Last server timestamp returned by the backend |
| `deleted_at` | Local tombstone timestamp; nullable |

Client timestamps never determine conflict winners. The future sync layer will use the server `version` and opaque change cursor defined in `docs/api-contract.md`.

### 8.5 UUID v4 policy

New routine IDs, routine-exercise IDs, workout IDs, and generated history child IDs use UUID v4. IDs are generated once and retained through retries and synchronization. The mobile helper is `mobile/database/ids.ts`.

Existing seeded/demo IDs and persisted legacy IDs are not rewritten in place by the additive migration. Existing relationships therefore remain intact. Before enabling cloud synchronization for those records, a dedicated relationship-preserving migration must create a UUID mapping for each parent and child, update every foreign-key reference in one transaction, and retain the mapping for retry safety.

### 8.6 Tombstones and repository behavior

Normal routine deletion now marks the routine and its children with `deleted_at` and `sync_status = 'pending_delete'`. Ordinary repository reads exclude tombstones. The physical rows remain available for future synchronization.

Routine exercise replacement marks omitted children as tombstones and upserts retained/new children in one local transaction. Completed workout snapshots remain independent of routine deletion and continue to expose their stored routine and exercise names.

### 8.7 Migration safety

Migration `0001_account_sync_metadata.sql` is additive:

1. Creates `local_accounts`.
2. Inserts a deterministic legacy account.
3. Adds ownership and metadata columns with compatibility defaults.
4. Backfills client timestamps from existing row timestamps.
5. Converts the existing active-session key to the legacy account-scoped key.
6. Adds account/sync indexes.

It does not drop tables, delete rows, rewrite routine/history IDs, or remove completed snapshots. The migration must be followed by tests against both an empty database and a database populated using migration `0000`.

### 8.8 Remaining implementation decisions

- The first Clerk user who encounters legacy local data must either claim it explicitly or start with a clean account; automatic claiming is not approved.
- Full local multi-account switching requires an account-context provider and a local-data retention policy.
- A later migration must add normalized local workout session tables only if the sync implementation needs field-level mutations; the current snapshot tables remain the compatibility source for completed history.
