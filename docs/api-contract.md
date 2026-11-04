# Worthout API Contract

## 1. Status and scope

This document is the finalized proposal for the contract between the Worthout mobile application and the FastAPI backend.

Implemented behavior is explicitly labelled **Verified**. API behavior described here is **Proposed** until implemented and covered by backend/mobile tests.

- API prefix: `/api/v1`
- Transport: HTTPS in deployed environments
- Authentication: Clerk session JWT in a Bearer header
- Cloud database: PostgreSQL
- Local source of truth: SQLite through Drizzle ORM
- Active workout recovery: local-only
- Cloud-synchronized workouts: completed workouts only
- User deletion: asynchronous

The current backend only implements `GET /healthz`. The API in this document is not yet implemented.

## 2. Verified current mobile behavior

The current mobile implementation uses local Drizzle repositories:

- `mobile/database/schema/routines.ts`
- `mobile/database/schema/workout-history.ts`
- `mobile/database/schema/active-session.ts`
- `mobile/repositories/routine.repository.ts`
- `mobile/repositories/history.repository.ts`
- `mobile/repositories/workout.repository.ts`

Current routine rows contain `id`, `name`, `description`, `category`, `created_at`, and `updated_at`. Routine-exercise rows contain `id`, `routine_id`, `exercise_id`, `position`, `sets`, `reps`, `duration_seconds`, `weight_kg`, and `rest_seconds`.

Current history rows contain a routine-name snapshot, date, duration in minutes, total sets, exercise-name snapshots, and set reps/weight/duration. The current local schema does not yet contain the full documented sync metadata or cloud entity tables.

The active workout is stored as one JSON payload and restored locally after launch. It includes timer and navigation state and is not uploaded under this contract.

Authentication is currently mock-only in `mobile/services/auth/` and `mobile/store/session.tsx`; Clerk integration is proposed, not verified.

## 3. Common conventions

### Authentication

Protected requests send:

```http
Authorization: Bearer <Clerk session JWT>
```

The backend verifies the signature through Clerk JWKS and validates expiration, issuer, and configured audience. It derives the Clerk identity only from the verified `sub` claim:

```text
verified JWT sub -> users.clerk_user_id -> users.id
```

Client-supplied `user_id` values are never accepted as authorization proof.

- Missing or invalid credentials: `401 Unauthorized`
- Authenticated but disallowed operation: `403 Forbidden`
- Resource belonging to another user: preferably `404 Not Found` to avoid existence disclosure

### Dates and IDs

- API timestamps are RFC 3339 UTC strings, for example `2026-11-04T09:30:00.000Z`.
- Client timestamps are informational only and never determine conflict winners.
- New syncable records use UUID v4.
- Existing mobile IDs must be migrated through a relationship-preserving local migration before sync is enabled. IDs must not be regenerated independently for parent and child rows.
- The server assigns `server_updated_at`, `change_sequence`, and `version`.

### Pagination

Collection endpoints use `limit` and opaque cursors. `limit` defaults to 50 and is capped at 100. Cursors are backed by a stable server-side change sequence or collection snapshot and must not be inspected or constructed by clients.

```json
{
  "items": [],
  "next_cursor": null
}
```

## 4. Endpoint inventory

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/v1/users/me` | Required | Provision or return the current user |
| DELETE | `/api/v1/users/me` | Required | Start asynchronous account deletion |
| GET | `/api/v1/exercises` | Required | Browse active exercise catalog |
| GET | `/api/v1/exercises/{exercise_id}` | Required | Read one exercise |
| GET | `/api/v1/routines` | Required | List owned routines |
| POST | `/api/v1/routines` | Required | Create a routine aggregate |
| GET | `/api/v1/routines/{routine_id}` | Required | Read one owned routine |
| PATCH | `/api/v1/routines/{routine_id}` | Required | Update one routine aggregate |
| DELETE | `/api/v1/routines/{routine_id}` | Required | Soft-delete a routine aggregate |
| GET | `/api/v1/workouts` | Required | List completed/cancelled history, if cancellation is retained |
| GET | `/api/v1/workouts/{workout_id}` | Required | Read one completed workout |
| POST | `/api/v1/workouts` | Required | Create a completed workout snapshot |
| POST | `/api/v1/sync/push` | Required | Apply idempotent offline mutations |
| GET | `/api/v1/sync/pull` | Required | Read changes from the server change log |

Ordinary CRUD and synchronization use the same Pydantic validation, service-layer business rules, ownership dependency, soft-delete behavior, and transaction rules. They are different transport paths over the same domain services.

## 5. User contract

### `GET /api/v1/users/me`

**Proposed.** No body. The backend provisions or retrieves the user mapped from the verified Clerk subject.

`200 OK`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clerk_user_id": "user_2P3abc",
  "display_name": "Alex",
  "email": "alex@example.com",
  "created_at": "2026-11-04T09:00:00.000Z",
  "updated_at": "2026-11-04T09:00:00.000Z"
}
```

Only essential identity fields are included initially. Fitness goals, preferred equipment, bio, and weekly goals are deferred.

Errors: `401`, `503`.

### `DELETE /api/v1/users/me`

**Proposed.** Starts an asynchronous deletion job. PostgreSQL deletion and Clerk deletion are retried safely by the backend worker.

`202 Accepted`:

```json
{
  "deletion_id": "8d5f6d4e-0b6a-4a0c-8c73-ef0ccfbd0b1a",
  "status": "pending"
}
```

The deletion operation is idempotent for the authenticated account. The mobile client clears local account data after receiving acceptance and must not reuse the deleted account context.

Errors: `401`, `409` if a conflicting deletion state exists, `503` if the deletion queue is unavailable.

## 6. Exercise catalog

### `GET /api/v1/exercises`

**Proposed.** Requires authentication. Supports:

```text
q, difficulty, equipment, muscle_group, updated_since, limit, cursor
```

Only active exercises are returned unless an administrative contract later adds `include_inactive`.

`200 OK` item shape:

```json
{
  "id": "77778888-9999-0000-aaaa-bbbbccccdddd",
  "name": "Push-up",
  "description": "A bodyweight pressing exercise.",
  "instructions": ["Start in a high plank position.", "Lower your chest.", "Push back up."],
  "tips": [],
  "difficulty": "beginner",
  "tracking_type": "reps",
  "equipment": [{"id": "...", "name": "Bodyweight"}],
  "muscle_groups": [{"id": "...", "name": "Chest", "is_primary": true}],
  "default_sets": 3,
  "default_reps": 10,
  "default_rest_seconds": 60,
  "accent_color": "#BFF800",
  "is_active": true,
  "created_at": "2026-11-01T00:00:00.000Z",
  "updated_at": "2026-11-01T00:00:00.000Z"
}
```

The extra `tips`, defaults, and accent color fields are retained because the current mobile exercise model uses them. Their PostgreSQL columns or JSON representation must be included in the schema migration.

Errors: `401`, `422`, `429`.

### `GET /api/v1/exercises/{exercise_id}`

**Proposed.** Returns the same exercise object. Inactive or unknown exercises return `404`; malformed IDs return `422`.

## 7. Routine contract

Routines are owned by the authenticated user. `user_id` is never accepted in request bodies.

### Routine representation

```json
{
  "id": "e4b2d5f0-8c29-4d6d-8b01-382910abcdef",
  "name": "Upper Body Strength",
  "description": "Chest and back focus",
  "category": "Upper Body",
  "created_at": "2026-11-04T09:00:00.000Z",
  "updated_at": "2026-11-04T09:15:00.000Z",
  "deleted_at": null,
  "version": 3,
  "server_updated_at": "2026-11-04T09:15:02.000Z",
  "exercises": [
    {
      "id": "b3c1a2d3-1111-2222-3333-444455556666",
      "exercise_id": "77778888-9999-0000-aaaa-bbbbccccdddd",
      "position": 1,
      "target_sets": 3,
      "target_reps": 10,
      "target_duration_seconds": null,
      "weight_kg": null,
      "rest_seconds": 90,
      "deleted_at": null,
      "version": 1,
      "server_updated_at": "2026-11-04T09:15:02.000Z"
    }
  ]
}
```

`category` and `weight_kg` are approved PostgreSQL fields. `estimatedMinutes` and `focus` remain derived mobile presentation values unless a later decision makes them persisted API fields.

### `GET /api/v1/routines`

**Proposed.** Supports `include_deleted`, `updated_since`, `limit`, and `cursor`. Default results exclude tombstones and are ordered by `updated_at DESC, id DESC`.

Errors: `401`, `422`.

### `POST /api/v1/routines`

**Proposed.** Creates a routine and its child routine exercises atomically.

```json
{
  "id": "e4b2d5f0-8c29-4d6d-8b01-382910abcdef",
  "name": "Upper Body Strength",
  "description": "Chest and back focus",
  "category": "Upper Body",
  "exercises": [
    {
      "id": "b3c1a2d3-1111-2222-3333-444455556666",
      "exercise_id": "77778888-9999-0000-aaaa-bbbbccccdddd",
      "position": 1,
      "target_sets": 3,
      "target_reps": 10,
      "target_duration_seconds": null,
      "weight_kg": null,
      "rest_seconds": 90
    }
  ]
}
```

`id` is required for sync-originated creation and optional for ordinary online creation. If absent, the server generates UUID v4. Child IDs follow the same rule. The response is `201 Created` with the full representation.

Validation:

- Name: trimmed, 1–255 characters.
- Description: nullable, maximum 10,000 characters.
- Category: approved category or null.
- Positions: positive, contiguous, unique 1-based integers.
- Target sets: positive integer.
- Reps, duration, weight, and rest: non-negative; weight has at most two decimal places.
- At least one of target reps or target duration must be present according to the exercise tracking type.
- Every referenced exercise must exist and be active.

Errors: `401`, `404`, `409`, `422`.

### `GET /api/v1/routines/{routine_id}`

**Proposed.** Returns the complete owned aggregate. An inaccessible, deleted, or unknown routine returns `404`.

### `PATCH /api/v1/routines/{routine_id}`

**Proposed.** Uses optimistic concurrency.

```json
{
  "base_version": 3,
  "name": "Upper Body Strength v2",
  "description": "Updated session",
  "category": "Upper Body",
  "exercises": [
    {
      "id": "b3c1a2d3-1111-2222-3333-444455556666",
      "exercise_id": "77778888-9999-0000-aaaa-bbbbccccdddd",
      "position": 1,
      "target_sets": 4,
      "target_reps": 10,
      "target_duration_seconds": null,
      "weight_kg": null,
      "rest_seconds": 90
    }
  ]
}
```

If `exercises` is present, it replaces the complete child collection atomically. Existing child IDs are updated, new UUIDs are inserted, omitted children receive tombstones, and positions are revalidated. If `exercises` is absent, only supplied routine fields change.

The server accepts the update only when `base_version` equals the current aggregate version. It then increments the aggregate version and assigns server timestamps. A stale version returns `409 Conflict` with the current aggregate; the client must rebase and retry.

Errors: `401`, `404`, `409`, `422`.

### `DELETE /api/v1/routines/{routine_id}`

**Proposed.** Requires the current aggregate version when the client has one, soft-deletes the routine and all currently visible children in one transaction, increments versions, and appends change-log entries.

Response: `204 No Content`.

Repeated deletion is idempotent. Tombstones remain available to the sync pull process.

## 8. Completed workout history

Active and paused workouts are local-only. This API accepts completed workouts. Cancelled workouts are retained only if the product enables cancelled-history display; the initial synchronization scope is completed workouts.

### Workout representation

```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "routine_id": "e4b2d5f0-8c29-4d6d-8b01-382910abcdef",
  "name": "Upper Body Strength",
  "routine_name_snapshot": "Upper Body Strength",
  "started_at": "2026-11-04T09:30:00.000Z",
  "completed_at": "2026-11-04T10:10:00.000Z",
  "duration_seconds": 2400,
  "status": "completed",
  "notes": null,
  "exercises": [
    {
      "id": "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
      "exercise_id": "77778888-9999-0000-aaaa-bbbbccccdddd",
      "exercise_name_snapshot": "Push-up",
      "position": 1,
      "notes": null,
      "sets": [
        {
          "id": "99998888-7777-6666-5555-444433332222",
          "set_number": 1,
          "repetitions": 10,
          "weight_kg": null,
          "duration_seconds": null,
          "is_completed": true
        }
      ]
    }
  ],
  "version": 1,
  "server_updated_at": "2026-11-04T10:10:02.000Z"
}
```

Routine and exercise names are immutable snapshots. They remain readable if their source routine or catalog record is later renamed, deactivated, or deleted.

### `GET /api/v1/workouts`

**Proposed.** Lists only the authenticated user's completed workouts, ordered by `started_at DESC, id DESC`. Supports `from`, `to`, `limit`, and `cursor`. Deleted records are excluded except through sync.

### `GET /api/v1/workouts/{workout_id}`

**Proposed.** Returns the full immutable history aggregate. Unknown or inaccessible IDs return `404`.

### `POST /api/v1/workouts`

**Proposed.** Creates a completed workout atomically. `status` must be `completed`; `in_progress` is rejected because active recovery is local-only. `routine_id` is nullable for manual workouts.

The endpoint is idempotent by stable workout ID. Repeating the same payload returns the existing representation. Reusing an ID with different content returns `409`.

Errors: `401`, `404`, `409`, `422`.

## 9. Synchronization protocol

### Server change log

Every syncable insert, update, or tombstone creates an append-only change-log entry containing:

- Authenticated internal user ID
- Entity type and record ID
- Operation: `upsert` or `delete`
- Record version
- Server-assigned `change_sequence`
- Server-assigned `server_updated_at`
- A record snapshot or tombstone payload

`change_sequence` is monotonically increasing and is the only synchronization ordering primitive. It is independent of client clocks.

### `POST /api/v1/sync/push`

**Proposed.** Applies mutations through the same domain services used by CRUD.

```json
{
  "mutations": [
    {
      "mutation_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "entity": "routine",
      "operation": "upsert",
      "record_id": "e4b2d5f0-8c29-4d6d-8b01-382910abcdef",
      "base_version": 3,
      "client_updated_at": "2026-11-04T09:15:00.000Z",
      "record": {
        "id": "e4b2d5f0-8c29-4d6d-8b01-382910abcdef",
        "name": "Upper Body Strength",
        "description": "Chest and back focus",
        "category": "Upper Body",
        "deleted_at": null,
        "exercises": []
      }
    }
  ]
}
```

Rules:

- `mutation_id` is the idempotency key and is stored with its result.
- Retrying the same mutation returns the original result without applying it twice.
- `record_id` is stable UUID v4.
- `client_updated_at` is diagnostic metadata only.
- Ownership comes only from the authenticated token.
- Parent mutations are applied before child mutations.
- A child cannot be accepted if its parent is absent or owned by another user.
- A stale `base_version` returns a conflict for that mutation, not a silent overwrite.
- A batch is transactional per accepted aggregate; one invalid aggregate does not corrupt another.

Response:

```json
{
  "server_sequence": 812,
  "accepted": [
    {
      "mutation_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "entity": "routine",
      "record_id": "e4b2d5f0-8c29-4d6d-8b01-382910abcdef",
      "version": 4,
      "change_sequence": 812,
      "server_updated_at": "2026-11-04T09:16:02.000Z"
    }
  ],
  "conflicts": [],
  "rejected": []
}
```

### `GET /api/v1/sync/pull`

**Proposed.** Reads user-scoped change-log entries after an opaque cursor.

```text
GET /api/v1/sync/pull?cursor=<opaque-cursor>&limit=100
```

The initial request omits `cursor`. The server returns changes ordered by `change_sequence`.

```json
{
  "next_cursor": "opaque-cursor-value",
  "has_more": true,
  "server_sequence": 813,
  "changes": [
    {
      "change_sequence": 813,
      "entity": "routine",
      "record_id": "old-routine-id",
      "operation": "delete",
      "version": 7,
      "server_updated_at": "2026-11-04T09:19:00.000Z",
      "record": {
        "id": "old-routine-id",
        "deleted_at": "2026-11-04T09:19:00.000Z"
      }
    }
  ]
}
```

The client advances the cursor only after applying the complete page successfully. A failed page application retries with the same cursor. Tombstones are retained for an approved retention period before archival.

## 10. Parent-child aggregate rules

- Routine creation and its routine exercises are one atomic aggregate operation.
- Routine update with an `exercises` field is an atomic full child-collection replacement.
- Omitted child IDs in an accepted replacement become tombstones, not hard deletes.
- Workout creation and all workout exercises/sets are one atomic immutable history write.
- Parent ownership is checked before every child operation.
- Child references to inactive exercises are rejected for new routines, but historical workout snapshots remain valid.
- Partial child updates must use the same `base_version` and aggregate service as ordinary CRUD.

## 11. Error contract

All errors use:

```json
{
  "error": {
    "code": "machine_readable_code",
    "message": "Human-readable message.",
    "request_id": "req_01HXYZ",
    "details": {}
  }
}
```

Required mappings:

- `400`: malformed aggregate or unsupported operation
- `401`: missing/invalid Clerk token
- `403`: authenticated but not permitted
- `404`: missing or inaccessible resource
- `409`: duplicate ID, stale version, or incompatible state
- `422`: field validation failure
- `429`: rate limit exceeded, with `Retry-After`
- `500`: internal failure without stack traces or secrets
- `503`: temporary dependency/database unavailability

Validation errors include field paths. Error responses never include tokens, SQL, stack traces, or secret values.

## 12. Local account isolation

The mobile database must isolate local records by account before multi-account Clerk support is enabled.

Required behavior:

- Store the active internal user ID in secure session state and the local user profile table.
- Add `user_id` to every user-owned local entity or enforce equivalent per-account partitioning.
- Scope every local query and mutation to the active account.
- Clear or archive the previous account's local data on sign-out according to the approved retention policy.
- Never hydrate another account's routine, history, or active session after account switching.
- Keep the active workout row account-scoped even though it remains local-only.

This is a proposed mobile/database requirement; the current schema does not yet implement it.

## 13. Known implementation gaps

The following are verified mismatches that must be resolved before implementation:

- Current mobile schemas lack full sync metadata and cloud entity tables.
- Current routine deletion is hard deletion, while this contract requires tombstones.
- Current generated child/history IDs are not consistently UUID v4.
- Current `WorkoutSession` lacks explicit `started_at`, `completed_at`, and `status` fields.
- Current mobile duration is minutes while PostgreSQL uses seconds.
- Current mobile `routine_id` is non-nullable even though manual workouts require null.
- Current mobile catalog data is static application data.
- Current authentication is mock-only.
- The documented database design must be extended for approved routine `category`, routine-exercise `weight_kg`, and mobile-required exercise presentation fields.

## 14. Implementation sequence

1. Approve this contract and the listed mobile schema migrations.
2. Add UUID v4 generation and relationship-preserving migration for existing local IDs.
3. Add account-scoped local records and sync metadata.
4. Implement SQLAlchemy models, database sessions, and Alembic migrations.
5. Implement Clerk verification and authenticated-user dependencies.
6. Implement shared validation, ownership, aggregate, tombstone, and idempotency services.
7. Implement user, catalog, routine, and completed-workout endpoints.
8. Implement the append-only server change log.
9. Implement cursor-based push/pull synchronization.
10. Add tests for retries, duplicate mutations, stale versions, tombstones, parent-child ordering, and cross-account access.

## 15. Final decisions recorded

- Routine `category` is stored in PostgreSQL.
- Routine-exercise `weight_kg` is stored in PostgreSQL.
- Only essential user identity fields are stored initially.
- Completed workouts are synchronized; active recovery is local-only.
- Local data is account-isolated.
- Concurrency uses server-authoritative optimistic locking with `base_version`.
- New syncable IDs are UUID v4; existing IDs are migrated without breaking relationships.
- Deletes use soft-delete tombstones.
- Account deletion is asynchronous and retryable.
- Synchronization uses opaque cursors backed by a stable server-side change sequence.
- CRUD and sync share validation, business rules, authorization, idempotency, and transaction behavior.
- Client timestamps never determine conflict resolution.
