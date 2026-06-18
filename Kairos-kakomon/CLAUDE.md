# CLAUDE.md

本项目协作约定。

## 任务流程（重要）

每次执行任务前，先在 `tasks.md`（仓库根目录）写一份 checklist：
- 列出本次任务的所有子步骤，标记 `[ ]` / `[x]`。
- 每完成一步就更新文件，防止因 token 不足导致任务中断后无法续接。
- 任务全部完成后保留记录，便于下次回溯。

## 项目概览

- 框架：Expo + expo-router（React Native）。
- 主要 Tab：学习（`app/(tabs)/study`）、大学（`app/(tabs)/university`）、论坛（`app/(tabs)/forum`）、我的（`app/(tabs)/profile`）。
- 主题/样式：`@/constants/colors`（明暗主题，默认 light）、`@/constants/typography`、`@/constants/spacing`。
- UI 组件：`@/components/ui`、做题相关 `@/components/study`。
- 数据：`@/api/*`（react-query），mock 兜底数据在 `@/mocks/data`。
