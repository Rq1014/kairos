# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo layout

Three independent parts, no root-level build — each is developed and run on its own:

| Path | What | Stack |
|------|------|-------|
| `Kairos-kakomon/` | Mobile app (過去問 / graduate-school exam prep) | Expo + React Native + TypeScript |
| `Kairos-kakomon-server/` | Backend API | Spring Boot 4 + MyBatis + MySQL + Redis |
| `docs/` | Product / architecture / API / DB specs | Markdown (numbered `01-product` … `07-collaboration`) |

`main` is the default working branch. Most commands below must be run from inside the relevant subproject directory, not the repo root.

## Task workflow convention (repo-specific, important)

Before starting a multi-step task, append a checklist to `Kairos-kakomon/TASKS.md` (the project's running task log). Mark sub-steps `[ ]` / `[x]` and append a `✅ 完成于 <date>` note under each line as you finish — never rewrite earlier lines. This is how the project preserves continuity across sessions; a new session reads `TASKS.md` to find the first unchecked item. Convert relative dates to absolute (the project uses `YYYY-MM-DD`).

## Frontend — `Kairos-kakomon/`

```bash
cd Kairos-kakomon
npm install            # first time
npm start              # Expo dev server + QR for Expo Go
npm run ios            # iOS simulator (needs Xcode)
npm run android        # Android emulator
npm run type-check     # tsc --noEmit  — the primary gate, run before every commit
npm run lint           # eslint
```

There is no test runner; `npm run type-check` (and secondarily `npm run lint`) is the correctness gate referenced throughout `TASKS.md`. SDK is pinned to **Expo ~54 / RN 0.81.5** deliberately for Expo Go compatibility (despite README mentioning 55).

### Architecture

- **Routing:** Expo Router v6 file-based. Screens live in `app/`. Tabs in `app/(tabs)/` (学习 study / 大学 university / 论坛 forum / 我的 profile); auth flow in `app/(auth)/`. Every screen must be registered as a `Stack.Screen` in `app/_layout.tsx`.
- **Path alias:** `@/*` → `./src/*` (see `tsconfig.json`, `strict: true`).
- **State:** Zustand stores in `src/store/` (`authStore`, `attemptStore`, `favoritesStore`, `adStore`, `browseSchoolsStore`, `onboardingStore`, `themeStore`, …). Several persist to AsyncStorage and are hydrated at module load in `app/_layout.tsx`.
- **Server state:** TanStack Query v5. Client configured offline-first (`networkMode: 'offlineFirst'`, no refetch on mount/focus).
- **Theming:** `@/constants/colors` (light/dark via `useColors()`), `typography`, `spacing`. Components must be theme-aware — read colors via the hook, never import a static palette.
- **UI:** shared primitives in `src/components/ui/`, study-specific in `src/components/study/`.

### Hybrid mock / real-API split (critical)

The data layer in `src/api/` is **half mocked, half wired to the real backend** — know which before changing one:

- **Real backend** (`apiRequest` → Spring Boot): `auth.ts`, `user.ts`, `universities.ts`, plus `client.ts`.
- **Mock-only** (return data from `src/mocks/data.ts`, no network): `questions.ts`, `forum.ts`, `ai.ts`, `billing.ts`.

`src/api/client.ts` is the single HTTP layer: base URL from `EXPO_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:8080`), unwraps the `{code,message,data}` envelope (throws `ApiError` on non-zero `code`), attaches the bearer token from SecureStore, and applies 30-day **sliding-session** tokens from `X-New-Access-Token` / `X-New-Refresh-Token` response headers back into SecureStore + `authStore`.

### Paywall business logic

`src/utils/accessPolicy.ts` is the **single source of truth** for 過去問 access (VIP / ad-unlock). Free tier = top-3 target graduate schools (大学+研究科 entries, by priority) × most-recent-3-years; out-of-range content unlocks via ad (school×year, 24h) or single-question ad, or Pro. Any screen gating content must call `canAccessQuestion` rather than reimplementing the rule.

## Backend — `Kairos-kakomon-server/`

```bash
cd Kairos-kakomon-server
./mvnw compile                 # quick compile check (used as the backend gate in TASKS.md)
./mvnw spring-boot:run         # run on :8080
./mvnw test                    # JUnit (currently just contextLoads)
./mvnw clean package           # build jar
```

Requires **MySQL 8** (db `kakomon`, utf8mb4) and **Redis**. Provide secrets via env vars (`DB_PASSWORD`, `JWT_SECRET`, …) or copy `src/main/resources/application-local.yml.example` → `application-local.yml` (gitignored) and run with `-Dspring.profiles.active=local`. Initialize the DB with the ordered scripts in `docs/05-database/sql/` (`V1_0` schema → `V1_1` dictionary → `V1_2` demo user).

### Layered structure & conventions

Packages under `org.example.kairos`, each split by feature module (auth / user / dict / …):

- `web/` — `@RestController`s. `service/` — interfaces + `impl/`. `mapper/` — MyBatis (Java interface + matching XML in `resources/mapper/`). `model/` — `request/` (controller in), `response/` (controller out), `bo/` (intermediate). `entity/` — table rows. `gateway/` — interceptors/filters/context. `config/`, `common/` (constants, enums, `Result`, `ResultCode`, exceptions).
- **Response envelope:** every endpoint returns `Result<T>` (`{code, message, data, traceId}`). `code 0` = success; business errors use `ResultCode` (10000–10499 ranges by domain) and are decoupled from HTTP status, which `GlobalExceptionHandler` maps. Frontend `client.ts` mirrors these codes (e.g. `10110` invalid code, `10201` identity occupied).
- **Auth chain (two interceptors):** `AuthInterceptor` parses the token (`Authorization: Bearer` or `X-Auth-Token`) into a `UserSession` ThreadLocal (`UserContextHolder`) and triggers sliding-session re-issue; `LoginRequiredInterceptor` enforces login on all `/api/**` unless the handler/class is annotated `@PublicApi`. Get the current user in a controller via the `@CurrentUser UserSession` argument. JWT TTLs are 30 days (sliding).

When adding a backend feature, follow the per-module folder split documented in `docs/04-backend/backend-conventions.md` and keep MyBatis Java mapper + XML in lockstep.

## Key docs

- `docs/02-architecture/` — `TSD-tech-spec.md`, `architecture.md`, `API-contract.md`, `question-similarity-pipeline.md`
- `docs/01-product/` — `PSD-product-spec.md`, `MVP-scope.md`, TRDs
- `docs/04-backend/` — `backend-conventions.md`, `backend-TRD-design.md`
- `docs/06-development/git-workflow.md` — tag-before-each-cycle release convention
