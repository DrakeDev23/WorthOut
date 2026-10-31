# Worthout – System Architecture

## 1. Architecture Overview

Worthout uses a **local-first mobile architecture** with a cloud backend.

In this architecture, the local SQLite database on the mobile device is the authoritative source of truth for all local user interactions. The mobile application operates completely offline without network latency. The backend provides authentication verification, cloud backup, cross-device data validation, and synchronization.

```text
+-------------------------------------------------------------+
|                     Worthout Mobile App                     |
|                     React Native + Expo                     |
+-------------------------------------------------------------+
          │                                     │
          ▼                                     ▼
+---------------------+               +-----------------------+
|  Transient UI State |               | Persistent App State  |
|      (Zustand)      |               |     (Drizzle ORM)     |
| Active Timer Target |               | Local SQLite Database |
| Screen Transitions  |               |  Sessions, Sets, etc. |
+---------------------+               +-----------------------+
                                                │
                                                ▼
                                      +-----------------------+
                                      |     Sync Manager      |
                                      |   Pending Mutation Q  |
                                      |   NetInfo Connectivity|
                                      +-----------------------+
                                                │
                                            HTTPS API
                                        (Bearer Clerk JWT)
                                                │
                                                ▼
+-------------------------------------------------------------+
|                       FastAPI Backend                       |
|                                                             |
|   Routers  ──>  Services  ──>  SQLAlchemy  ──>  PostgreSQL  |
|      │                                                      |
|      └──> Clerk Auth Verifier (JWKS / Audience / Expiry)    |
+-------------------------------------------------------------+
```

---

## 2. Technology Stack

| Category | Technology | Version / Specification | Role |
|---|---|---|---|
| **Mobile Framework** | React Native | Expo SDK 51+ | Cross-platform native mobile runtime |
| **Mobile Navigation** | Expo Router | File-based routing | Screen transitions and deep linking |
| **Language** | TypeScript | Strict mode | Static typing across the mobile codebase |
| **Local Database** | SQLite | `expo-sqlite` (next) | Embedded on-device persistence |
| **Local ORM** | Drizzle ORM | SQLite dialect | Schema modeling, typed queries, migrations |
| **Transient Client State**| Zustand | Single-store slices | Active workout timer, UI flags |
| **Server State / Sync** | TanStack Query | Query caching | Remote query caching and mutation lifecycle |
| **Network Connectivity**| NetInfo | `@react-native-community/netinfo` | Online/offline connection detection |
| **Authentication** | Clerk | `@clerk/clerk-expo` | User sign-up, sign-in, and session management |
| **Backend Framework** | FastAPI | Python 3.11+ | High-performance asynchronous REST API |
| **Backend ORM** | SQLAlchemy | Async / 2.0 style | Object-relational mapping for PostgreSQL |
| **Database Migrations** | Alembic | Versioned Python scripts | Automated cloud schema migrations |
| **Cloud Database** | PostgreSQL | PostgreSQL 16+ | Central multi-tenant cloud storage |
| **Containerization** | Docker | Docker Compose | Local backend and database runtime environment |

---

## 3. Offline User Identity and Authentication Architecture

Worthout integrates **Clerk** for user authentication while ensuring full offline functionality.

### 3.1 Initial Online Authentication & Profile Bootstrapping
1. The user must be connected to the internet during initial registration or login.
2. Upon successful sign-in via the Clerk React Native SDK, the mobile app obtains the Clerk session token and the user's external ID (`clerk_user_id`).
3. The app invokes the backend user bootstrap endpoint:
   `GET /api/v1/users/me` (or `POST /api/v1/users/sync-profile`).
4. The backend verifies the Clerk JWT, provisions or retrieves the user record in PostgreSQL, and returns the canonical internal user profile:
   ```json
   {
     "id": "550e8400-e29b-41d4-a716-446655440000",
     "clerk_user_id": "user_2P3...",
     "email": "user@example.com",
     "display_name": "Alex"
   }
   ```
5. The mobile app persists this profile in the local SQLite `users` table and secure storage.

### 3.2 Offline Identity Resolution
- When the device is offline or the short-lived Clerk JWT expires:
  - The mobile app queries the local SQLite `users` table for the active user's internal `id` (`UUID`).
  - All local entity insertions (`workout_routines`, `workout_sessions`) use this cached `user_id` as their foreign key.
  - The user can seamlessly record workouts and manage routines without blocking for token refreshes.
- When internet connectivity returns, the Clerk SDK refreshes the JWT in the background, and the Sync Manager resumes cloud communication.

---

## 4. Default Exercise and Catalog Availability Offline

To enable immediate offline use upon first app launch:

1. **Pre-Bundled SQLite Catalog:**
   - A pre-populated SQLite asset file containing default exercises, muscle groups, and equipment categories is packaged directly within the mobile application bundle.
   - On the first app launch (or upon local database initialization), Drizzle runs an idempotent seeding script to populate the local tables if empty.
2. **Catalog Updates via Sync:**
   - New or updated exercises created by system administrators on the cloud backend include an `updated_at` timestamp.
   - When the device is online, the Sync Manager fetches catalog deltas (`GET /api/v1/exercises?since=...`) and updates the local SQLite catalog without disrupting ongoing user sessions.

---

## 5. Active Workout Session Lifecycle and Crash Recovery

Workout tracking is resilient to app crashes, operating system memory termination, and device battery loss.

### 5.1 Immediate Local Persistence
- When a user starts a workout (guided or manual), a `workout_sessions` record is immediately written to local SQLite with `status = 'in_progress'` and `started_at = UTC timestamp`.
- Each time a user completes or updates a set, the change is written directly to SQLite (`exercise_sets`) before updating the UI state.
- **No in-progress workout data is kept exclusively in transient RAM.**

### 5.2 Crash Recovery Workflow
```text
App Launch / Restart
       │
       ▼
Check Local SQLite: SELECT * FROM workout_sessions WHERE status = 'in_progress'
       │
       ├── Found active session?
       │         │
       │         ├── Yes: Restore session into Zustand activeWorkoutStore
       │         │        Prompt user: "Resume active workout or discard?"
       │         │        - If Resume: Navigate directly to Active Workout screen
       │         │        - If Discard: Set status = 'cancelled', persist to SQLite
       │         │
       │         └── No: Navigate to default Home screen
```

### 5.3 Timestamp-Based Timers (Background Immunity)
- Mobile operating systems (iOS and Android) suspend JavaScript intervals (`setInterval`) when an app is minimized or the screen turns off.
- **Timestamp Design:**
  - Active rest timers do **not** decrement a tick counter in RAM.
  - When a rest timer starts, the app stores a target completion epoch timestamp:
    `target_end_at = Date.now() + (rest_seconds * 1000)`.
  - The UI calculates remaining seconds on each render:
    `remaining = Math.max(0, Math.ceil((target_end_at - Date.now()) / 1000))`.
  - When the user reopens or unlocks the device, the UI recalculates elapsed time accurately without time loss or drift.
  - Local push notifications are scheduled at `target_end_at` so the user receives a timer alert even if the app remains in the background.

---

## 6. Local-First Synchronization Architecture

Worthout implements a robust, two-way delta synchronization model between the mobile SQLite database and cloud PostgreSQL.

```text
           MOBILE APP (SQLite)                         CLOUD BACKEND (PostgreSQL)
  ┌────────────────────────────────────┐            ┌───────────────────────────────┐
  │  Local DB Changes                  │            │                               │
  │  (sync_status = 'pending_*')       │            │                               │
  │                 │                  │            │                               │
  │                 ▼                  │            │                               │
  │       POST /api/v1/sync/push       │───────────>│  Verify JWT & User ID         │
  │  (Batched mutations with UUIDs)    │            │  Upsert records in transaction│
  │                                    │<───────────│  Return { accepted, rejected }│
  │  Mark local records as 'synced'    │            │                               │
  │                 │                  │            │                               │
  │                 ▼                  │            │                               │
  │       GET /api/v1/sync/pull        │───────────>│  Query changes WHERE          │
  │       (?since=last_sync_timestamp) │            │  server_updated_at > since    │
  │                                    │<───────────│  Return server delta changes  │
  │  Upsert server delta into SQLite   │            │                               │
  └────────────────────────────────────┘            └───────────────────────────────┘
```

### 6.1 Synchronization Principles
1. **Client-Generated UUIDs:** All IDs are generated as UUID v4 on the mobile device upon creation. This eliminates ID translation and key collisions when syncing offline records.
2. **Idempotency:** All push mutations are idempotent upserts (`ON CONFLICT (id) DO UPDATE ...`). Resending the same payload produces the same database state.
3. **Soft Deletions (Tombstones):** Deletions set `deleted_at = UTC timestamp` with `sync_status = 'pending_delete'`. Deletions replicate to the backend and other devices as tombstones before local archival.
4. **Hierarchical Ordering:** Push mutations are sent in relational order:
   `workout_routines` ➔ `routine_exercises` ➔ `workout_sessions` ➔ `workout_exercises` ➔ `exercise_sets`.

### 6.2 Push Endpoint Contract
- **Endpoint:** `POST /api/v1/sync/push`
- **Headers:** `Authorization: Bearer <Clerk_JWT>`
- **Request Body:**
  ```json
  {
    "client_timestamp": "2026-11-01T01:30:00.000Z",
    "routines": [
      {
        "id": "e4b2d5f0-8c29-4d6d-8b01-382910abcdef",
        "name": "Upper Body Strength",
        "description": "Chest and back focus",
        "created_at": "2026-11-01T01:00:00.000Z",
        "updated_at": "2026-11-01T01:25:00.000Z",
        "deleted_at": null,
        "exercises": [
          {
            "id": "b3c1a2d3-1111-2222-3333-444455556666",
            "exercise_id": "77778888-9999-0000-aaaa-bbbbccccdddd",
            "position": 1,
            "target_sets": 3,
            "target_reps": 10,
            "target_duration_seconds": null,
            "rest_seconds": 90,
            "updated_at": "2026-11-01T01:25:00.000Z",
            "deleted_at": null
          }
        ]
      }
    ],
    "sessions": [
      {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "routine_id": "e4b2d5f0-8c29-4d6d-8b01-382910abcdef",
        "name": "Upper Body Strength",
        "started_at": "2026-11-01T01:05:00.000Z",
        "completed_at": "2026-11-01T01:45:00.000Z",
        "duration_seconds": 2400,
        "status": "completed",
        "notes": "Good pump",
        "updated_at": "2026-11-01T01:45:00.000Z",
        "deleted_at": null,
        "exercises": [
          {
            "id": "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
            "exercise_id": "77778888-9999-0000-aaaa-bbbbccccdddd",
            "position": 1,
            "notes": null,
            "updated_at": "2026-11-01T01:45:00.000Z",
            "deleted_at": null,
            "sets": [
              {
                "id": "99998888-7777-6666-5555-444433332222",
                "set_number": 1,
                "repetitions": 10,
                "weight_kg": 20.0,
                "duration_seconds": null,
                "is_completed": true,
                "updated_at": "2026-11-01T01:15:00.000Z",
                "deleted_at": null
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Response Body (`200 OK`):**
  ```json
  {
    "server_timestamp": "2026-11-01T01:30:05.123Z",
    "processed_ids": [
      "e4b2d5f0-8c29-4d6d-8b01-382910abcdef",
      "b3c1a2d3-1111-2222-3333-444455556666",
      "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
      "99998888-7777-6666-5555-444433332222"
    ],
    "conflicts": []
  }
  ```

### 6.3 Pull Endpoint Contract
- **Endpoint:** `GET /api/v1/sync/pull?since=2026-11-01T00:00:00.000Z`
- **Headers:** `Authorization: Bearer <Clerk_JWT>`
- **Response Body (`200 OK`):**
  ```json
  {
    "server_timestamp": "2026-11-01T01:30:05.123Z",
    "has_more": false,
    "changes": {
      "routines": [...],
      "routine_exercises": [...],
      "sessions": [...],
      "workout_exercises": [...],
      "exercise_sets": [...]
    }
  }
  ```
- The mobile app saves the returned records to local SQLite and records `last_synced_at = server_timestamp`.

### 6.4 Conflict Resolution: Last-Write-Wins (LWW)
- Because workout tracking is predominantly single-user on a single primary mobile device, conflicts are infrequent.
- For concurrent updates across devices, Worthout applies **Last-Write-Wins (LWW)** based on the latest UTC `updated_at` timestamp.
- If a server record has a higher `version` and newer `server_updated_at` than the client's local record, the server state takes precedence during pull.

---

## 7. Backend Architecture

The backend is built with FastAPI, adhering to clean architecture principles:

- **Routers (`app/routers/`):** Define HTTP routes, query parameters, request validation, and status codes.
- **Dependencies (`app/dependencies/`):** Verify Clerk JWTs, extract authenticated user models, and yield SQLAlchemy async database sessions.
- **Services (`app/services/`):** Encapsulate business logic (e.g., `SyncService`, `RoutineService`, `WorkoutService`).
- **Schemas (`app/schemas/`):** Define Pydantic models for request/response validation and serialization.
- **Models (`app/models/`):** Define SQLAlchemy ORM mapped entities corresponding to the PostgreSQL database schema.
- **Alembic (`alembic/`):** Manages reproducible, version-controlled PostgreSQL schema migrations.

---

## 8. Security Architecture

1. **Token Verification:**
   - FastAPI middleware validates Clerk JWT tokens via JWKS (JSON Web Key Sets) provided by Clerk's public endpoint.
   - Tokens are validated for valid signature, unexpired validity window, and matching audience (`aud`) and issuer (`iss`).
2. **Zero-Trust User ID:**
   - The user ID is strictly extracted from the verified JWT claims (`sub` -> `clerk_user_id` -> internal `user_id`).
   - Clients are never permitted to supply a `user_id` in request payloads to access or modify records.
3. **Row-Level Tenant Isolation:**
   - Every database query for user-owned records enforces an explicit filter: `WHERE user_id = :current_user_id`.
4. **Transport Security:**
   - HTTPS is strictly enforced in production environments.
5. **No Token Leakage:**
   - Sensitive authorization headers and user PII are scrubbed from server logs.
