# Worthout – Technical Documentation

This document describes Worthout's technology stack, system architecture, data synchronization approach, and project structure.

## Documentation Index

- [Technology Stack and Architecture Overview](README.md) (this document)
- [Software Requirements Specification](requirements.md)
- [System Architecture](architecture.md)
- [Database Design](database-design.md)
- [Implementation Plan](implementation-plan.md)

---

## Technology Stack

| Category | Technology |
|---|---|
| Mobile | React Native, Expo |
| Language | TypeScript |
| Navigation | Expo Router |
| Local Database | SQLite |
| Local ORM | Drizzle ORM |
| Backend | FastAPI |
| Backend Language | Python |
| API Validation | Pydantic |
| Backend ORM | SQLAlchemy |
| Database | PostgreSQL |
| Migrations | Alembic |
| Authentication | Clerk |
| Server State | TanStack Query |
| Client State | Zustand |
| Connectivity | NetInfo |
| Containerization | Docker |

## System Architecture

Worthout follows a **local-first architecture**. The mobile application stores workout data locally before synchronizing it with the backend.

```text
          Worthout Mobile App
          React Native + Expo
                  |
          Application Logic
                  |
          Local SQLite Database
                  |
             Sync Manager
                  |
             FastAPI Backend
                  |
             PostgreSQL
```

### Architecture Components

**1. Mobile Application**

Built with React Native, Expo, and TypeScript. It provides the user interface for exercise browsing, workout planning, guided sessions, and manual workout tracking.

**2. Local Database**

SQLite stores workout records and other essential application data locally. Drizzle ORM provides structured database queries and schema management.

**3. Backend API**

FastAPI handles API requests, authentication verification, business logic, and communication with the PostgreSQL database.

**4. Cloud Database**

PostgreSQL stores synchronized user data, workout records, routines, and other persistent application information.

**5. Authentication**

Clerk handles user authentication and identity management.

## Data Synchronization

Worthout uses a local-first synchronization approach:

1. Users create or update workout records.
2. Changes are saved immediately to the local SQLite database.
3. The Sync Manager queues pending mutations (`pending_insert`, `pending_update`, `pending_delete`).
4. When internet connectivity is detected via NetInfo, the app pushes batches to `POST /api/v1/sync/push`.
5. The backend validates and upserts the data into PostgreSQL using Last-Write-Wins (LWW) resolution.
6. The app pulls cloud deltas from `GET /api/v1/sync/pull` and updates local SQLite.

This allows users to continue tracking workouts without depending on a constant internet connection.

### Synchronization Principles

- Local data persistence takes priority.
- Workout sessions must remain usable offline.
- Pending changes synchronize automatically when connectivity returns.
- Idempotent upserts prevent duplicate records.
- Soft-delete tombstones propagate deletions safely across devices.
- Strict row-level isolation guarantees each user's data remains private.

## Project Structure

```text
worthout/
├── mobile/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── database/
│   ├── store/
│   ├── types/
│   └── assets/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── dependencies/
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/
│   ├── README.md
│   ├── requirements.md
│   ├── architecture.md
│   ├── database-design.md
│   └── implementation-plan.md
│
└── README.md
```

## Development Principles

- Maintain a clear separation between frontend and backend responsibilities.
- Follow a strict local-first development progression (local SQLite & UI features before cloud sync).
- Use modular and maintainable code.
- Follow database migration practices using Alembic (cloud) and Drizzle (local).
- Validate incoming API requests using Pydantic.
- Protect user data through authenticated and authorized endpoints.
- Prioritize offline functionality and reliable synchronization.
- Write tests for important business logic and application behavior.

## Future Considerations

Potential future improvements include:
- Advanced workout analytics.
- More detailed exercise tracking.
- Additional synchronization improvements.
- AI-assisted workout insights.

These are future considerations and are not part of the initial MVP.
