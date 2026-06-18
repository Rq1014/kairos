# Git 工作流规范

## 核心原则

**每次开始一轮修改前，先给当前 `main` 打一个版本 tag。**  
这样任何历史版本都能通过 tag 完整恢复，不会被后续提交覆盖。

---

## 标准流程（每次开发循环）

```
① 给当前 main 打 tag（存档旧版）
② 在 develop 分支上开发
③ TypeScript 检查通过
④ develop → merge → main
⑤ 给新 main 打 tag（记录新版）
⑥ push main + push --tags
```

### 具体命令

```bash
# ① 开始新一轮修改前 —— 存档当前版本
git checkout main
git tag v0.X.0 -m "简短说明当前版本状态"
git push origin --tags

# ② 切换到 develop 分支开发
git checkout develop

# ... 做修改、commit ...

# ③ 类型检查
npm run type-check

# ④ 合并到 main
git checkout main
git merge develop --no-ff -m "merge: vX.X 功能说明"

# ⑤ 给新版本打 tag
git tag v0.X+1.0 -m "新版本说明"

# ⑥ 推送
git push origin main
git push origin --tags
```

---

## 版本号规则

| 版本号 | 含义 |
|--------|------|
| `v0.X.0` | 每次 develop → main 合并后的里程碑 |
| `v0.X.Y` | 同一里程碑内的小修复（hotfix） |

---

## 从任意 tag 恢复

```bash
# 查看所有历史快照
git tag -l "v*" --sort=version:refname

# 恢复到某个版本（只读查看）
git checkout v0.8.0

# 从某个版本新建分支（用于真正回退）
git checkout -b restore/v0.8.0 v0.8.0
```

---

## 当前版本历史

| Tag | 内容 |
|-----|------|
| `v0.1.0` | Phase 0: Expo SDK 55 + TypeScript 脚手架 |
| `v0.2.0` | Phase 1: K1 账户 + K3 题目屏幕 |
| `v0.3.0` | Phase 2: K2 大学 + K4 论坛屏幕 |
| `v0.4.0` | Phase 3: AI 流式输出 + IAP + 账单 + 通知 |
| `v0.5.0` | Phase 4: Onboarding + 上传 UI + Bundle 优化 |
| `v0.6.0` | TanStack Query 接入 + API 模块 |
| `v0.7.0` | 后端骨架 + DB 迁移 + CI |
| `v0.8.0` | 所有按钮接通 + EditProfile 页面 |
| `v0.9.0` | 论坛/AI 交互打磨 + 相似题流水线 v3 |
| `v0.10.0` | 匿名发帖/评论 + README |
| `v0.11.0` | 缺失资产修复 + SDK 55 依赖对齐 |
| `v0.11.1` | Git 工作流文档快照，修复手册追加前留档 |
| `v0.11.2` | v0.11 Expo 白屏修复手册 + README 排障入口 |
| `v0.11.3` | 启动 hydration 不再阻塞首屏 + Demo 体验入口（当前）|

---

## 快速备忘

```bash
# 下一轮开始时，必须先执行：
git tag v0.12.0 -m "修改前存档" && git push origin --tags

# 然后再：
git checkout develop
```
