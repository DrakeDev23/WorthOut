# Worthout – Software Requirements Specification

## 1. Project Overview

Worthout is a home workout tracking application that allows users to plan, perform, and monitor their exercise routines.

The application supports both manual workout logging and guided workout sessions. It is designed around a **local-first** approach, ensuring users can track workouts without an internet connection and synchronize their records with the cloud when connectivity becomes available.

---

## 2. Project Objectives

- Provide an organized, offline-ready exercise library.
- Allow users to create and manage workout routines with target sets, reps, and durations.
- Support guided workout sessions with background-resilient rest timers.
- Allow manual workout tracking without prior routine setup.
- Persist workout records locally before synchronizing with cloud storage.
- Guarantee crash recovery so active workouts are never silently discarded.
- Provide reliable multi-device cloud synchronization.
- Enforce strict user data isolation and privacy.

---

## 3. Target Users

Worthout initially targets individuals who exercise at home using bodyweight or home gym equipment. The application supports multi-user accounts on the backend so individual user data remains isolated and securely synchronized.

---

## 4. Functional Requirements

### FR-001: User Authentication & Session Persistence
- **FR-001.1:** Initial user registration and sign-in SHALL require an active internet connection to authenticate via Clerk.
- **FR-001.2:** Upon successful authentication, the application SHALL securely cache the user's session profile (internal UUID, Clerk ID, email, display name) in local SQLite storage.
- **FR-001.3:** Subsequent application launches SHALL allow full application access in offline mode using cached credentials without blocking on expired tokens.
- **FR-001.4:** Users SHALL be able to sign out, which clears cached session tokens and resets the active local user context.

### FR-002: Exercise Library Availability
- **FR-002.1:** The complete default exercise library SHALL be pre-bundled into the local SQLite database and available immediately upon first app launch without internet access.
- **FR-002.2:** Users SHALL be able to browse exercises, view descriptions, and read instructions offline.
- **FR-002.3:** Users SHALL be able to filter exercises by muscle group, equipment, and difficulty level offline.
- **FR-002.4:** The local exercise catalog SHALL receive non-destructive incremental updates from the backend when the app is online.

### FR-003: Equipment Support
The application SHALL categorize exercises by required equipment:
- Bodyweight
- Dumbbells
- Resistance bands
- Kettlebells
- Pull-up bars
- Weight plates
- Workout benches
- Exercise mats

The database schema SHALL support adding new equipment categories without client breaking changes.

### FR-004: Workout Routine Management
- **FR-004.1:** Users SHALL be able to create, edit, and soft-delete workout routines locally.
- **FR-004.2:** Users SHALL be able to add, reorder, and remove exercises in a routine.
- **FR-004.3:** Users SHALL be able to configure target sets, target repetitions (for rep-based exercises), target duration in seconds (for timed exercises), and target rest duration in seconds.
- **FR-004.4:** All routine modifications SHALL persist to local SQLite immediately and be marked for synchronization.

### FR-005: Guided Workout Sessions & Crash Recovery
- **FR-005.1:** Users SHALL be able to launch a guided session directly from a saved routine.
- **FR-005.2:** The application SHALL immediately persist the active session to SQLite with `status = 'in_progress'` upon start.
- **FR-005.3:** Each set completed, modified, or skipped SHALL be persisted to SQLite within 100 milliseconds of user input.
- **FR-005.4:** Rest timers SHALL calculate remaining duration using target epoch timestamps (`Date.now() + duration`), ensuring timers remain accurate if the app is backgrounded or the screen turns off.
- **FR-005.5:** If the application terminates unexpectedly (crash, power loss, OS memory kill) during an active workout, the application SHALL detect the `in_progress` session on the next launch and prompt the user to resume or discard it.
- **FR-005.6:** Users SHALL be able to pause, resume, skip exercises, and mark the session completed.

### FR-006: Manual Workout Tracking
- **FR-006.1:** Users SHALL be able to log ad-hoc workout sessions without selecting a pre-existing routine.
- **FR-006.2:** Users SHALL be able to add exercises dynamically during the workout.
- **FR-006.3:** Users SHALL be able to record completed repetitions, weight (in kg, up to 2 decimal places), and duration (in seconds).
- **FR-006.4:** Completed manual workouts SHALL be saved locally with `status = 'completed'` and queued for sync.

### FR-007: Workout History
- **FR-007.1:** Users SHALL be able to view a chronological log of all completed and cancelled workout sessions stored in local SQLite.
- **FR-007.2:** Users SHALL be able to view detailed exercise breakdowns, sets, weights, reps, and durations for any historical workout.

### FR-008: Progress Monitoring
- **FR-008.1:** Users SHALL be able to view aggregate workout statistics (total workouts completed, total workout time).
- **FR-008.2:** Users SHALL be able to view exercise-specific progress over time (e.g., maximum weight lifted or total reps per exercise across historical sessions).

### FR-009: Offline Functionality
- **FR-009.1:** All core workout operations (browsing exercises, creating routines, executing guided workouts, running timers, logging manual workouts, viewing history) SHALL function with zero network connectivity.
- **FR-009.2:** All local mutations SHALL be assigned a UUID v4 primary key on creation and stored in SQLite with an appropriate `sync_status` (`pending_insert`, `pending_update`, `pending_delete`).

### FR-010: Cloud Synchronization
- **FR-010.1:** The application SHALL monitor network status using NetInfo and trigger synchronization when network connectivity is restored.
- **FR-010.2:** The synchronization manager SHALL send local pending mutations to `POST /api/v1/sync/push` and mark successfully acknowledged records as `synced`.
- **FR-010.3:** The synchronization manager SHALL pull remote updates from `GET /api/v1/sync/pull?since=<timestamp>` and update the local SQLite database.
- **FR-010.4:** The synchronization engine SHALL resolve concurrent update conflicts using Last-Write-Wins (LWW) based on UTC `updated_at` timestamps.
- **FR-010.5:** Deletions SHALL be propagated using soft-delete tombstones (`deleted_at`), ensuring deletions synchronize across devices without data resurrection.

### FR-011: Data Security & Tenant Isolation
- **FR-011.1:** The backend SHALL verify Clerk JWTs on all protected endpoints, validating signature, expiration, issuer, and audience.
- **FR-011.2:** The backend SHALL derive the user identity strictly from verified token claims. Request payloads supplying explicit user IDs for authorization SHALL be rejected.
- **FR-011.3:** All cloud database queries for user records SHALL enforce row-level ownership filtering (`WHERE user_id = :current_user_id`).
- **FR-011.4:** Sensitive credentials and access tokens SHALL never be logged in application or server log streams.

### FR-012: Account Management & Deletion
- **FR-012.1:** Users SHALL be able to view their profile information (email, display name).
- **FR-012.2:** Users SHALL be able to request permanent account deletion from within the application.
- **FR-012.3:** Upon account deletion request:
  - The backend SHALL delete the user's records from PostgreSQL (cascading to routines, sessions, and sets).
  - The backend SHALL initiate deletion of the user identity in Clerk.
  - The mobile client SHALL clear all user data from the local SQLite database and secure storage, returning to the login screen.

---

## 5. Non-Functional Requirements

### Performance
- **NFR-P1 (Local Query Latency):** Local SQLite read queries for routine lists and workout history SHALL execute in under 50 milliseconds on modern mobile devices.
- **NFR-P2 (Set Logging Latency):** Persisting a completed set to local SQLite SHALL take less than 100 milliseconds without UI stutter or frame drops.
- **NFR-P3 (API Sync Response):** Backend sync push and pull endpoints SHALL respond within 1,000 milliseconds under normal network conditions for typical batch sizes (< 50 records).

### Reliability & Data Integrity
- **NFR-R1 (Zero Data Loss on Crash):** In-progress workouts SHALL be restorable upon app relaunch with 100% of recorded sets intact up to the last completed set.
- **NFR-R2 (Offline Autonomy):** The mobile application SHALL function indefinitely without network connectivity for existing local users.
- **NFR-R3 (Sync Idempotency):** Duplicate delivery of push payloads due to network timeouts SHALL produce no duplicate records or state corruption.

### Security
- **NFR-S1 (Transport Encryption):** All client-server communication SHALL strictly use TLS 1.3 / HTTPS.
- **NFR-S2 (Zero Trust Client ID):** Any API request attempting to modify or query records outside the authenticated user's scope SHALL receive an HTTP 403 Forbidden or 404 Not Found.

### Maintainability
- **NFR-M1 (Schema Migrations):** All PostgreSQL schema changes SHALL be managed via version-controlled Alembic migrations.
- **NFR-M2 (Local Schema Migrations):** Local SQLite migrations SHALL be managed via Drizzle ORM migrations.

---

## 6. MVP Scope

The initial release contains:
- Clerk authentication with offline session caching.
- Pre-bundled exercise library with search and multi-attribute filtering.
- Workout routine creation, editing, reordering, and deletion.
- Guided workout execution with timestamp-based rest timer.
- Active workout state persistence and crash recovery.
- Manual workout tracking.
- Local SQLite database with Drizzle ORM.
- Two-way delta synchronization engine with FastAPI and PostgreSQL.
- Workout history list and basic progress statistics.
- Account profile viewing and complete account deletion.

---

## 7. Out of Scope (Post-MVP)

The following features are explicitly deferred:
- GPS tracking for outdoor running/cycling.
- Social feeds, activity sharing, and community leaderboards.
- Nutrition tracking and calorie counting.
- Live personal trainer audio or video feeds.
- AI-generated workout routines and machine learning recommendations.
- Wearable device integrations (Apple Watch, Wear OS, heart rate straps).

---

## 8. Testable Acceptance Criteria

The MVP is ready for release when all of the following criteria are validated through automated or manual verification:

1. **Authentication:** A new user can register via Clerk; signing out clears local session data and prevents access to protected screens.
2. **Offline Launch:** After initial login, terminating the app and relaunching in airplane mode loads the home screen and exercise library with zero network errors.
3. **Exercise Browsing:** Exercises filter accurately by equipment, muscle group, and difficulty in under 100ms.
4. **Routine Management:** A user can create a routine with 3 exercises, reorder them, set rest timers, and restart the app; all routine details remain identical.
5. **Crash Recovery:** If the app process is killed during a guided workout after completing Set 1 of Exercise 1, relaunching the app displays the active workout recovery dialog and restores Set 1 as completed.
6. **Background Timer Accuracy:** Minimizing the app for 60 seconds during a rest timer and reopening displays the correct remaining time without lag or pause.
7. **Manual Workout Logging:** A user can log an ad-hoc session with weights, reps, and duration, and the session appears in the workout history list.
8. **Cloud Sync (Push):** Workouts created offline sync to PostgreSQL within 10 seconds of reconnecting to Wi-Fi/cellular network.
9. **Cloud Sync (Pull):** Logging into a second device with the same account pulls all synchronized routines and completed workout history.
10. **Tenant Isolation:** Direct API requests to fetch or modify another user's workout session return HTTP 404/403.
11. **Account Deletion:** Requesting account deletion purges the user's data from PostgreSQL, deletes the Clerk account, and resets the local mobile database.
