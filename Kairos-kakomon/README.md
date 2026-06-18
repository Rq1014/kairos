# Kakomon (過去問) — Graduate School Exam Prep App

A mobile app for Japan graduate school (大学院) exam preparation. Features past exam questions, AI-assisted explanations, reference book matching, and a study community forum.

**Stack:** Expo SDK 55 · React Native 0.83.6 · TypeScript · Expo Router v4 · TanStack Query v5 · Zustand v5

---

## Repository Branches

`main` is the default working branch. As of 2026-05-19, the integrated `develop` branch has been merged into `main`, so a normal clone gets the current runnable project.

The previous `main` state is preserved as the historical base snapshot:

| Archive | Ref | Commit |
|---------|-----|--------|
| Branch | `archive/main-base` | `10cb287` |
| Tag | `archive-main-base-2026-05-19` | `10cb287` |

Use `main` for the current app. Use `archive/main-base` only when you need to inspect the original base version before the `develop` merge.

For the full branch timeline and development order, see [`docs/GIT_HISTORY_TIMELINE.md`](docs/GIT_HISTORY_TIMELINE.md).

```bash
# Current runnable project
git clone git@github.com:ZYM-tit/Kairos-kakomon.git

# Historical base snapshot
git clone -b archive/main-base git@github.com:ZYM-tit/Kairos-kakomon.git Kairos-kakomon-base
```

---

## Quick Start — Mobile Demo (Expo Go)

> All screens run on mock data out of the box. No backend needed for demo.

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18 or 20 LTS | https://nodejs.org |
| npm | bundled with Node | — |
| Expo Go (phone) | latest | App Store / Google Play |

Both your computer and phone must be on the **same Wi-Fi network**.

---

### Step 1 — Clone and install

```bash
git clone git@github.com:ZYM-tit/Kairos-kakomon.git
cd Kairos-kakomon
npm install
```

---

### Step 2 — Start the dev server

```bash
npm start
# or
npx expo start
```

You will see a **QR code** in the terminal.

---

### Step 3 — Open on your phone

**iPhone:**
1. Open the default **Camera** app
2. Point it at the QR code
3. Tap the banner that appears → opens in **Expo Go**

**Android:**
1. Open the **Expo Go** app
2. Tap **Scan QR code**
3. Point at the QR code

The app loads in 10–30 seconds on the first run (bundling). Subsequent loads are instant with hot reload.

---

### Step 4 — Demo login

On the login screen, tap **"跳过 / Demo 体验"** (skip) to enter with a pre-filled demo account.

No email or password required for demo.

---

## What You Can Demo

| Screen | How to reach |
|--------|-------------|
| Study dashboard + weak-point map | Tab 1 (学习) |
| University list + detail + professor | Tab 2 (大学) |
| Past exam question detail (解析 / AI / 举一反三) | Tap any question card |
| AI chat with streaming animation | Bottom bar "问这道题" on any question |
| Forum — post / reply / like / anonymous | Tab 3 (论坛) |
| Write post with anonymous toggle | Forum → "+" button |
| Wrong-answer book | Profile → 我的错题 |
| Pro paywall | Any locked Pro feature |
| Edit profile + target schools | Profile → settings icon |

---

## Project Structure

```
app/                  Expo Router screens (file-based routing)
  (tabs)/             Bottom-tab screens
  forum/              Forum thread detail + compose
  questions/          Question detail + AI chat
  university/         University + professor detail
src/
  api/                API client modules (TanStack Query)
  components/         Shared UI components
  constants/          Colors, Typography, Spacing tokens
  mocks/              Mock data (questions, threads, users)
  store/              Zustand stores (auth, study)
  types/              TypeScript interfaces
backend/              Fastify API scaffold (not required for demo)
docs/                 Architecture, API contract, MVP scope
```

---

## Running on iOS Simulator (Mac only)

```bash
npm run ios
# Requires Xcode installed
```

## Running on Android Emulator

```bash
npm run android
# Requires Android Studio + emulator running
```

---

## TypeScript Check

```bash
npm run type-check
```

---

## Backend (not needed for demo)

The backend scaffold (`backend/`) is a Fastify + PostgreSQL API. It is **not required** to run the frontend demo — all screens fall back to mock data automatically.

To run the backend locally, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Key Docs

| Document | Purpose |
|----------|---------|
| [`docs/MVP_SCOPE.md`](docs/MVP_SCOPE.md) | V1 feature scope (Must / Should / Won't) |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | REST API spec |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Database schema |
| [`docs/QUESTION_SIMILARITY_PIPELINE.md`](docs/QUESTION_SIMILARITY_PIPELINE.md) | OCR + embedding pipeline for past exam questions |
| [`docs/DEV_PLAN.md`](docs/DEV_PLAN.md) | Development phases |

---

## Troubleshooting

**"Metro bundler" error on start**
```bash
npx expo start --clear
```

**Expo Go opens to a white screen**
- First check the v0.11 startup fix guide and error-code table: [`docs/V0_11_EXPO_START_FIX.md`](docs/V0_11_EXPO_START_FIX.md)
- Make sure `assets/images/icon.png` and `assets/images/splash-icon.png` exist after pulling latest `main`
- Reinstall from the lockfile with `npm ci`, then start with `npx expo start --clear`

**Phone can't connect (QR scan opens browser instead of Expo Go)**
- Make sure Expo Go is installed, not just the camera app
- Try switching from `Tunnel` to `LAN` mode: press `w` in the terminal to open web, or `shift+l` to switch network mode

**"Unable to resolve module" error**
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

**App shows white screen on Android**
- Make sure you are using the **Expo Go** app, not a custom dev build
- Android 10+ required
