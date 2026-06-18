# Backend Database Implementation

Date: 2026-05-15

This document records the current backend/database landing path after the Phase 1-4 API stubs.

## Current State

The Express API routes are complete enough for frontend integration, smoke tests, and offline development.

Auth and User routes now support dual mode:

- Without `DATABASE_URL`: use in-memory mock stores for fast local smoke tests.
- With `DATABASE_URL`: use PostgreSQL repositories for register/login/refresh/logout and `/users/me` profile flows.

The remaining routes still use in-memory stores:

- `backend/src/data/mockStore.ts`: auth users, questions, mastery, favorites, votes, AI sessions
- `backend/src/data/phase2Mock.ts`: universities, professors, forum threads, groups
- `backend/src/data/phase3Mock.ts`: reference books, notifications, IAP records, upload records

The database schema is ahead of most route persistence. This is intentional: frontend/API contract work can continue while persistence is introduced behind repository boundaries.

## Database Files

Migrations:

- `database/migrations/V1__initial_schema.sql`: base PostgreSQL schema for auth, billing, universities, questions, study state, AI, forum, notifications, and content contributions
- `database/migrations/V2__phase4_performance_indexes.sql`: additive performance indexes for question, forum, notification, and content query paths
- `database/migrations/V3__schema_hardening_and_operational_tables.sql`: operational hardening

Seeds:

- `database/seeds/00_demo_user.sql`
- `database/seeds/01_universities.sql`
- `database/seeds/02_grad_schools.sql`
- `database/seeds/03_university_majors.sql`
- `database/seeds/04_reference_books.sql`
- `database/seeds/05_sample_questions.sql`
- `database/seeds/06_forum_seed_threads.sql`

## V3 Additions

V3 closes gaps found while connecting frontend and backend:

- Adds `questions.crowd_votes_very_hard`, matching the API vote contract.
- Adds check constraints for difficulty votes, mastery state, forum thread type, content contribution status, upload kind, and upload status.
- Adds `set_updated_at()` triggers for tables that expose `updated_at`.
- Adds `iap_transactions` for receipt verification idempotency.
- Adds `app_store_notification_events` for App Store server notification audit.
- Adds `content_uploads` for presigned upload tracking and confirmed asset reads.

## Backend DB Boundary

Backend DB structure:

- `backend/src/db/types.ts`: minimal `Queryable`, `DatabaseDriver`, and transaction interfaces
- `backend/src/db/connection.ts`: `configureDatabase`, `getDatabase`, `query`, and `withTransaction`
- `backend/src/db/postgres.ts`: PostgreSQL Pool driver configured from `DATABASE_URL`
- `backend/src/db/errors.ts`: maps PostgreSQL-style errors into repository errors
- `backend/src/db/repositories/`: first repository layer for auth, users, questions, and universities

Route switching status:

- Auth: dual mode complete
- Users/profile/target schools: dual mode complete
- Universities: repository exists, route still mock-backed
- Questions: repository exists, route still mock-backed
- Forum/Billing/Notifications/Content: still mock-backed

The next safe step is to replace the remaining routes module by module:

1. Universities read endpoints
2. Questions list/detail/mastery/favorite/vote
3. Forum threads/replies/groups
4. Billing/IAP and notifications
5. Content uploads and contribution review

## Scripts

Run schema validation without a live database:

```bash
cd backend
npm run db:validate
```

Apply migrations to a PostgreSQL database with `psql` installed:

```bash
cd backend
DATABASE_URL=postgres://postgres:postgres@localhost:5432/kairos_kakomon npm run db:migrate
```

Apply seeds:

```bash
cd backend
DATABASE_URL=postgres://postgres:postgres@localhost:5432/kairos_kakomon npm run db:seed
```

Apply both migrations and seeds:

```bash
cd backend
DATABASE_URL=postgres://postgres:postgres@localhost:5432/kairos_kakomon npm run db:setup
```

Run DB-backed Auth/User smoke test:

```bash
cd backend
DATABASE_URL=postgres://postgres:postgres@localhost:5432/kairos_kakomon npm run db:smoke
```

Without `DATABASE_URL`, `db:smoke` prints a skip message and exits successfully so regular CI can still run without a database service.

## Production Notes

Before production cutover, finish replacing mock-backed routes with repositories. Keep route code dependent on services/repositories, not raw SQL.

Recommended order:

1. Add DB-backed Universities route implementation.
2. Add DB-backed Questions route implementation.
3. Add DB-backed Forum route implementation.
4. Add DB-backed Billing/IAP and Notifications.
5. Add DB-backed Content upload tracking and contribution review.
6. Keep mock smoke green after each module and add DB smoke coverage when a test database is available in CI.
