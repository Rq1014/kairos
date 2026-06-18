# Git History Timeline

This document records the intended branch order for this repository. It is a readable map of the existing Git history, not a rewritten history.

## Current Branch Meaning

| Branch / tag | Meaning | Tip commit |
|--------------|---------|------------|
| `main` | Current default branch. Use this for cloning and development. | `bf0b02c` |
| `develop` | Integrated development branch before the final merge into `main`. | `974b81c` |
| `archive/main-base` | Historical snapshot of the previous `main` before the `develop` merge. | `10cb287` |
| `archive-main-base-2026-05-19` | Tag for the same historical base snapshot. | `10cb287` |
| `master` | Phase 0 frontend scaffold branch. Kept for history only. | `ff75725` |
| `feature/phase1-frontend` | Phase 1 frontend milestone. | `13920ff` |
| `feature/phase2-frontend` | Phase 2 frontend milestone. | `46f3c80` |
| `feature/phase3-frontend` | Phase 3 frontend milestone. | `5afacd2` |
| `feature/phase4-frontend` | Phase 4 frontend milestone. | `431ee8a` |

## Logical Development Order

1. Initial repository setup
   - `e9910e3` Initial commit
   - `b6a3e45` Initial commit: prototype + engineering docs (v1.3)

2. Original `main` archive point
   - `10cb287` Merge master content into main
   - This is now preserved as `archive/main-base` and `archive-main-base-2026-05-19`.

3. Phase 0 scaffold
   - `ff75725` feat: Phase 0 frontend scaffold (Expo SDK 55 + TypeScript)
   - Branch marker: `master`

4. Phase 1 frontend
   - `2ff1a8d` feat(phase1): implement all Phase 1 K1+K3 frontend screens
   - `13920ff` chore: mark Phase 1 frontend tasks complete in TASKS.md
   - Branch marker: `feature/phase1-frontend`

5. Phase 2 frontend
   - `46f3c80` feat(phase2): implement K2 university + K4 forum frontend screens
   - Branch marker: `feature/phase2-frontend`

6. Phase 3 frontend
   - `5afacd2` feat(phase3): implement Phase 3 frontend -- AI streaming, IAP, billing, notifications, reference links
   - Branch marker: `feature/phase3-frontend`

7. Phase 4 frontend
   - `5311cf0` feat: Phase 4 frontend -- onboarding flow, upload UI, FlatList optimization, image viewer modal
   - `e01f9ca` feat: Phase 4 wrap-up -- AI share button, push token registration, query cache tuning, bundle analysis scripts
   - `f6c8092` fix: AI Chat action buttons changed to wrong-book, save-note, share
   - `0f7af9a` feat: AI Chat share changed to bottom sheet
   - `431ee8a` docs: add inline comments to non-obvious logic
   - Branch marker: `feature/phase4-frontend`

8. Integration work on `develop`
   - `6e4dde1` feat: integrate TanStack Query into screens + wire API endpoint modules
   - `c645bf9` chore: add backend scaffold, DB migrations, CI, and engineering docs
   - `d380a0a` feat: wire all no-op buttons + add EditProfile page
   - `f4f399a` fix: wire all remaining no-op buttons (second pass)
   - `871da91` docs: expand question similarity pipeline for electronic PDF source
   - `56ea37b` docs: update question similarity pipeline to v3.0
   - `47e693e` feat: polish forum post, help request, and AI chat interactions
   - `c03025a` feat: add anonymous posting/commenting + project README
   - `ef49326` chore: update package.json (react-dom + @types/react bumped by expo export)
   - `974b81c` fix: sync package-lock.json with package.json to fix CI npm ci error
   - Branch marker: `develop`

9. Final merge into `main`
   - `1017196` Merge develop into main
   - `bf0b02c` docs: document main merge and archive branch
   - Branch marker: `main`

## Why The Graph Looks Out Of Order

The project started with both `main` and `master`-style history, then Phase work continued through feature branches and `develop`. Later, the previous `main` was archived and `develop` was merged back into `main`.

That means the commit graph is correct, but the visual order can look confusing because:

- `main` originally had a small archived history.
- `master` marked the Phase 0 scaffold.
- Feature branches mark milestones, but later integration commits continued on `develop`.
- The final `main` merge happened after the archive branch was created.
- Some early commits use `+08:00` timestamps and later commits use `+09:00` timestamps.

## Recommended Workflow From Now On

Use this order going forward:

```text
main
  -> develop
      -> feature/<short-task-name>
  -> main
```

Rules:

- Clone and run from `main`.
- Branch new work from `develop`.
- Merge feature branches back into `develop`.
- Merge `develop` into `main` only when the project is runnable.
- Keep `archive/main-base` untouched as a historical snapshot.
- Do not use `master` for new work.

Useful commands:

```bash
# Current app
git clone git@github.com:ZYM-tit/Kairos-kakomon.git

# Start new work
git switch develop
git pull origin develop
git switch -c feature/my-task

# Inspect the old base snapshot
git switch archive/main-base
```
