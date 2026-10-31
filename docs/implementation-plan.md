# Worthout – Implementation Plan

## 1. Development Strategy

Worthout is implemented following a **strict local-first development progression**.

Because the mobile application's core functionality operates directly against the local SQLite database, the local persistence layer and mobile features (exercise library, routine planning, guided workouts, crash recovery, manual tracking, history) are established and validated before implementing the remote cloud database and synchronization engine.

Each development phase includes measurable, verifiable tasks and automated acceptance criteria. Progression to subsequent phases requires meeting all criteria of the current phase.

The implementation strictly adheres to:
- `docs/requirements.md`
- `docs/architecture.md`
- `docs/database-design.md`

---

## 2. Development Phases

### Phase 1: Project Foundation & Tooling Setup
**Objective:** Initialize the mobile application, backend service, and development environments.

**Tasks:**
- [x] Initialize Git repository with proper `.gitignore` for React Native, Python, and SQLite assets.
- [x] Initialize Expo mobile application using TypeScript and Expo Router.
- [x] Initialize FastAPI backend application structure with Python 3.11+.
- [x] Configure Docker and Docker Compose for local PostgreSQL 16+.
- [x] Configure environment variable management (`.env.example`) for mobile and backend.
- [x] Set up linting, code formatting (Prettier, ESLint, Ruff), and test runners (Jest, Pytest).
- [x] Create backend health-check endpoint (`GET /healthz`).

**Acceptance Criteria:**
- `npx expo start` boots the mobile application without errors.
- `docker compose up` starts PostgreSQL and FastAPI successfully.
- `GET http://localhost:8000/healthz` returns `{"status": "ok"}` with HTTP 200 within 50ms.
- Linters and typecheckers pass with zero errors across frontend and backend.

---

### Phase 2: Authentication & Local User Profile
**Objective:** Implement Clerk authentication and local identity caching to enable offline session persistence.

**Tasks:**
- [ ] Integrate `@clerk/clerk-expo` into the mobile application with secure token storage.
- [ ] Build mobile Sign-In, Sign-Up, and Sign-Out screens.
- [ ] Configure FastAPI backend Clerk JWT verification dependency (JWKS, issuer, audience validation).
- [ ] Implement backend user profile provisioning endpoint (`GET /api/v1/users/me`).
- [ ] Implement secure caching of the authenticated user's internal UUID profile on the mobile device.

**Acceptance Criteria:**
- A user can register and sign in through Clerk on the mobile app.
- Protected FastAPI endpoints return HTTP 401 Unauthorized when invoked without a valid Clerk Bearer token.
- `GET /api/v1/users/me` provisions or retrieves the user record in PostgreSQL and returns their canonical UUID.
- After logging in once, launching the app in airplane mode successfully loads the authenticated user's cached identity without blocking on network requests.

---

### Phase 3: Local SQLite Database & Pre-bundled Exercise Catalog
**Objective:** Establish the local persistence layer using SQLite and Drizzle ORM with an offline exercise library.

**Tasks:**
- [ ] Integrate `expo-sqlite` and configure Drizzle ORM in the mobile project.
- [ ] Define local SQLite Drizzle schemas for all entities matching `docs/database-design.md`.
- [ ] Create pre-bundled database seeding script containing default exercises, muscle groups, and equipment.
- [ ] Implement local database initialization on app startup with idempotent migration execution.
- [ ] Build Exercise Library screen with local search and multi-attribute filtering (muscle group, equipment, difficulty).
- [ ] Build Exercise Detail screen displaying description and step-by-step instructions.

**Acceptance Criteria:**
- On a fresh app install in airplane mode, the local SQLite database initializes with all seed exercises populated.
- Browsing and filtering the exercise library functions completely offline with search query response times under 50ms.
- Exercise details and instructions render correctly offline.

---

### Phase 4: Local Routine Management (Workout Planner)
**Objective:** Enable users to create, customize, and manage workout routines locally.

**Tasks:**
- [ ] Implement local SQLite CRUD data access functions for `workout_routines` and `routine_exercises`.
- [ ] Build Routine List screen displaying user routines.
- [ ] Build Routine Builder/Editor screen:
  - Add exercises from the catalog.
  - Configure target sets, target reps, target duration (seconds), and rest duration (seconds).
  - Reorder exercise positions with immediate visual feedback.
  - Remove exercises from the routine.
- [ ] Implement soft deletion (`deleted_at`) for routines and routine exercises.
- [ ] Add unique position constraints and input validation (e.g., positive set count, non-negative reps/rest).

**Acceptance Criteria:**
- A user can create a routine with 3 exercises, save it, restart the app, and see the routine intact.
- Reordering exercises updates their `position` attributes contiguously without gaps.
- Soft-deleting a routine removes it from the UI list while marking `deleted_at` and `sync_status = 'pending_delete'` in SQLite.

---

### Phase 5: Guided Workouts, Active State & Crash Recovery
**Objective:** Implement guided workout execution with background-resilient timers and crash recovery.

**Tasks:**
- [ ] Implement local data access for `workout_sessions`, `workout_exercises`, and `exercise_sets`.
- [ ] Build Active Guided Workout screen initiated from a routine.
- [ ] Persist workout session immediately to SQLite upon start with `status = 'in_progress'`.
- [ ] Implement set completion logging with immediate SQLite persistence (< 100ms).
- [ ] Implement timestamp-based rest timer using target epoch timestamps (`target_end_at`).
- [ ] Schedule local notifications when the rest timer expires.
- [ ] Implement pause, resume, and exercise skipping.
- [ ] Implement app launch crash detection:
  - Query SQLite for existing `status = 'in_progress'` sessions.
  - Present user recovery prompt ("Resume active workout or discard?").
  - Restore active workout state into Zustand upon confirmation.
- [ ] Implement session completion and cancellation with duration calculation.

**Acceptance Criteria:**
- Starting a routine creates a `workout_sessions` row in SQLite with `status = 'in_progress'`.
- Marking a set as completed writes directly to SQLite before UI feedback; force-killing the app process and relaunching restores the completed set without data loss.
- Backgrounding the app during a 90-second rest timer and foregrounding after 60 seconds displays exactly 30 seconds remaining.
- Completing a workout sets `status = 'completed'`, records total duration, and marks the session for synchronization.

---

### Phase 6: Manual Workout Tracking
**Objective:** Allow ad-hoc workout creation without selecting a predefined routine.

**Tasks:**
- [ ] Build Manual Workout screen allowing on-the-fly exercise selection.
- [ ] Allow dynamic addition and removal of sets with weight (kg), reps, and duration inputs.
- [ ] Persist manual sessions directly to local SQLite with `routine_id = NULL`.
- [ ] Implement manual workout completion and cancellation logic.

**Acceptance Criteria:**
- Users can start an empty workout, select exercises, record sets with weights and reps, and save the session offline.
- The completed manual session appears in local SQLite with valid UUIDs and `status = 'completed'`.

---

### Phase 7: Workout History & Progress Monitoring
**Objective:** Provide users with full visibility into past workouts and basic exercise performance trends.

**Tasks:**
- [ ] Build Workout History screen displaying completed sessions ordered chronologically (`started_at DESC`).
- [ ] Build Workout Detail screen displaying the complete breakdown of exercises, sets, weights, and reps.
- [ ] Build Progress Monitoring screen:
  - Aggregate statistics: total completed workouts, total workout time.
  - Exercise performance history: highest weight lifted and total volume per exercise over time.
- [ ] Implement efficient SQLite aggregation queries using indexed timestamps.

**Acceptance Criteria:**
- History screen renders all past workouts completely offline with list scroll performance at 60 FPS.
- History detail accurately reflects the exact weights, reps, and durations recorded during the workout.
- Aggregation queries for total workouts and personal records execute in under 50ms for 500+ stored sets.

---

### Phase 8: Backend PostgreSQL Cloud Models & Alembic Migrations
**Objective:** Build the cloud database schema and backend models to support synchronization and account management.

**Tasks:**
- [ ] Define SQLAlchemy 2.0 async models for all entities matching `docs/database-design.md`.
- [ ] Set up Alembic migration environment and generate initial PostgreSQL schema migrations.
- [ ] Implement database seed scripts for cloud exercise catalog.
- [ ] Implement Account Deletion endpoint (`DELETE /api/v1/users/me`):
  - Cascades deletion of all user routines, sessions, and sets in PostgreSQL.
  - Initiates user account deletion via Clerk Backend API.
- [ ] Write automated backend unit and integration tests for schema models, relationships, and cascades.

**Acceptance Criteria:**
- `alembic upgrade head` creates the complete PostgreSQL schema with all constraints, cascades, and indexes.
- All foreign key delete cascades function as specified (e.g., deleting a session cascades to its sets).
- Calling `DELETE /api/v1/users/me` completely purges user data from PostgreSQL and returns HTTP 204 No Content.

---

### Phase 9: Cloud Synchronization Engine
**Objective:** Implement reliable, two-way local-first delta synchronization between SQLite and PostgreSQL.

**Tasks:**
- [ ] Integrate `@react-native-community/netinfo` to monitor device network status.
- [ ] Implement Backend Push endpoint (`POST /api/v1/sync/push`):
  - Validates Clerk JWT and extracts authenticated user ID.
  - Executes batch transactional upsert with client UUIDs.
  - Enforces Last-Write-Wins (LWW) conflict resolution using UTC `updated_at`.
- [ ] Implement Backend Pull endpoint (`GET /api/v1/sync/pull?since=<timestamp>`):
  - Returns delta changes where `server_updated_at > since` for the authenticated user.
- [ ] Implement Mobile Sync Manager:
  - Collects local records with `sync_status IN ('pending_insert', 'pending_update', 'pending_delete')`.
  - Pushes pending batches to backend upon network connection.
  - Updates local `sync_status = 'synced'` and `last_synced_at` upon successful acknowledgment.
  - Pulls remote deltas and upserts into local SQLite.
  - Handles soft-deleted tombstones.

**Acceptance Criteria:**
- Workouts logged offline are pushed to PostgreSQL within 10 seconds of reconnecting to the internet.
- Signing in with the same account on a second device pulls all routines and historical workouts.
- Resending the same push payload due to network interruption is idempotent and does not create duplicate rows.
- Editing a routine offline on two devices resolves deterministically using Last-Write-Wins without server crashes.

---

### Phase 10: System Integration, Security Verification & Release Hardening
**Objective:** Conduct end-to-end integration testing, security audit, and production packaging.

**Tasks:**
- [ ] Write end-to-end integration tests covering the complete offline-to-online lifecycle.
- [ ] Perform security audit verifying tenant isolation (cross-user data access attempts return HTTP 403/404).
- [ ] Test account deletion end-to-end: verifies mobile local data wipe and cloud record eradication.
- [ ] Optimize Dockerfile for FastAPI backend for production deployment.
- [ ] Prepare Expo production build configuration.

**Acceptance Criteria:**
- 100% of automated test suites pass (Jest for mobile, Pytest for backend).
- Penetration tests confirm zero tenant leaks across isolated user accounts.
- Account deletion cleans up 100% of local SQLite records and cloud database records.
- Production Docker container builds cleanly and passes health checks.
