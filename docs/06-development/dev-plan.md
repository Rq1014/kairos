# Kakomon · 开发方案与排期计划

**版本：** v1.2  
**日期：** 2026-05-14  
**平台：** iOS · React Native · Expo  
**参考文档：** PSD.md · TSD.md · MVP_SCOPE.md

---

## 一、总体目标

| 阶段 | 目标 | 周期 |
|------|------|------|
| Phase 0 | 工程脚手架 + 设计系统 | 第 1 周 |
| Phase 1 | K1 账户 + K3 核心（MVP）| 第 2–5 周 |
| Phase 2 | K2 大学 + K4 论坛 | 第 6–9 周 |
| Phase 3 | AI 功能 + 变现 + 推送 | 第 10–12 周 |
| Phase 4 | 性能优化 + App Store 上架 | 第 13–14 周 |

**总工期：** 基准 14 周（3.5 个月）；Phase 3 风险高，若 IAP + AI 流式超期，Phase 4 顺延至第 15–16 周（见八、风险）  
**团队配置（建议）：**

| 角色 | 人数 | 负责 |
|------|------|------|
| iOS 前端工程师 | 2 | React Native 开发 |
| 后端工程师 | 2 | API + 数据库 + AI 网关 |
| 产品/设计 | 1 | 原型确认 + 验收 |
| QA | 1 | Phase 2 开始介入 |

---

## 二、Phase 0 · 工程脚手架（第 1 周）

### 目标
完成项目初始化，所有人可本地运行，CI/CD 跑通。

### 任务清单

#### 前端
- [ ] **F0-1** `expo init` 创建项目，配置 TypeScript strict 模式
- [ ] **F0-2** 安装并配置 Expo Router v4
- [ ] **F0-3** 集成 Zustand + TanStack Query + axios
- [ ] **F0-4** 配置 `app.json`（bundleIdentifier、版本、iOS 权限）
- [ ] **F0-5** 配置 EAS Build（dev / staging / production 三个 profile）
- [ ] **F0-6** 实现设计 Token（`colors.ts` / `typography.ts` / `spacing.ts`）
- [ ] **F0-7** 实现基础 UI 组件库（Card / Chip / Badge / Button / ProgressBar / Icon）
- [ ] **F0-8** 实现 Bottom Tab 导航壳（4 个 Tab 占位页面）
- [ ] **F0-9** 配置 Mock 数据层（复用 `data.jsx`：`UNIVERSITIES`×14 / `UNI_GRADS` / `UNI_MAJORS` / `KAKOMON_QUESTIONS`，迁移为 TypeScript）

#### 后端
- [ ] **B0-1** 创建数据库 schema（参考 TSD 类型定义）
- [ ] **B0-2** 搭建 Express / FastAPI 项目骨架
- [ ] **B0-3** 实现 `/health` 健康检查接口
- [ ] **B0-4** 配置 JWT 中间件
- [ ] **B0-5** 配置 Redis 连接（AI 额度计数器）
- [ ] **B0-6** 配置 S3 存储（题目原图 bucket）

#### 工程基础
- [ ] **E0-1** GitHub 仓库 + 分支规范（main / develop / feature/*）
- [ ] **E0-2** GitHub Actions CI（lint + type-check + build-check on PR）
- [ ] **E0-3** EAS Submit 配置（后续一键上传 TestFlight）

---

## 三、Phase 1 · MVP：K1 + K3 核心（第 2–5 周）

### 第 2 周 · 账户系统（K1）

**前端任务**

| 任务 ID | 描述 | 估时 |
|---------|------|------|
| F1-01 | 登录页（邮箱/密码 + 表单校验 + 错误提示）| 1d |
| F1-02 | 注册页 | 0.5d |
| F1-03 | authStore（JWT 存储/刷新/登出）| 1d |
| F1-04 | 路由守卫（未登录跳转 /login）| 0.5d |
| F1-05 | 个人主页（头像 / Pro 状态 / 学习统计 / 弱点预览）| 1.5d |
| F1-06 | 设置页（邮箱 / 目标校 / 通知 / 登出）| 0.5d |
| F1-06a | 目标考试设置（nextExam：考试名/日期/持续天数，PATCH /users/me）| 0.5d |

**后端任务**

| 任务 ID | 描述 | 估时 |
|---------|------|------|
| B1-01 | `POST /auth/login` `POST /auth/register` | 1d |
| B1-02 | `POST /auth/refresh` `POST /auth/logout` | 0.5d |
| B1-03 | `GET /users/me` `PATCH /users/me` | 0.5d |
| B1-04 | `GET /users/me/stats` `GET /users/me/weak-points` | 0.5d |
| B1-05 | `GET /users/me/ai-quota`（Redis 计数）| 1d |
| B1-06 | Billing/Entitlement stub：`GET /billing/status` 返回 isPro/tokenBalance；后台脚本可手动设置 Pro 状态供测试；**真实 IAP 支付流程留 Phase 3** | 0.5d |

---

### 第 3 周 · 学习仪表板 + 题目列表

**前端任务**

| 任务 ID | 描述 | 估时 |
|---------|------|------|
| F1-10 | StudyDashboard（目标校芯片 / AI 额度卡 / 继续学习 / 快捷操作）| 1.5d |
| F1-10a | 考试倒计时组件（44×44 按钮，rose/amber/blue 紧迫色，读取 `nextExam`）| 0.5d |
| F1-10b | EditTargetSheet（两步选校）+ SchoolSearchPicker（地区/类型筛选 + 研究科 + 专攻）| 1.5d |
| F1-11 | 弱点地图迷你版（4 条进度条）| 0.5d |
| F1-12 | 跨校关联提醒卡 | 0.5d |
| F1-13 | 推荐题目列表（TanStack Query 接口对接）| 0.5d |
| F1-14 | QuestionListScreen（年份/科目筛选 + 掌握状态徽章）| 1d |
| F1-15 | SearchScreen（关键词搜索 + 热词 + 筛选 Dropdown）| 1d |

**后端任务**

| 任务 ID | 描述 | 估时 |
|---------|------|------|
| B1-10 | `GET /questions`（完整筛选/分页）| 1.5d |
| B1-11 | `GET /questions/recommendations`（基于用户弱点）| 1d |
| B1-12 | 导入 mock 过去问数据（14 所大学 × 历年，含 regionGroup / UNI_GRADS / UNI_MAJORS）| 1.5d |

---

### 第 4 周 · 题目详情页（核心）

> 这是整个产品最关键的屏幕，需要充分时间打磨。

**前端任务**

| 任务 ID | 描述 | 估时 |
|---------|------|------|
| F1-20 | QuestionDetailScreen 框架 + 元数据卡 | 1d |
| F1-21 | 题目正文 + 数学公式占位块 | 0.5d |
| F1-22 | 掌握情况三态控件（乐观更新）| 0.5d |
| F1-23 | 众包难度投票 | 0.5d |
| F1-24 | 标准解析段落（步骤卡）| 0.5d |
| F1-25 | 参考书对应章节（3 种匹配类型）| 1d |
| F1-26 | Pro AI 扩展讲解（模糊锁定 + 升级 CTA）| 0.5d |
| F1-27 | 举一反三三级关联（L1/L2/L3 + Free 截断）| 1d |
| F1-28 | 论坛关联卡 | 0.3d |
| F1-29 | 底部悬浮 AI 问答栏 + 书签 | 0.5d |

**后端任务**

| 任务 ID | 描述 | 估时 |
|---------|------|------|
| B1-20 | `GET /questions/:id`（完整数据）| 1d |
| B1-21 | `GET /questions/:id/related`（三级，Pro 控制）| 1d |
| B1-22 | `POST /questions/:id/mastery` + 弱点更新逻辑 | 1d |
| B1-23 | `POST /questions/:id/vote`（众包难度）| 0.5d |
| B1-24 | `POST /questions/:id/favorite` | 0.5d |

---

### 第 5 周 · 错题本 + AI Sheet + AI Chat

**前端任务**

| 任务 ID | 描述 | 估时 |
|---------|------|------|
| F1-30 | WrongBookScreen（题目列表 + 知识点矩阵 Tab）| 1.5d |
| F1-31 | AiContextSheet（@gorhom/bottom-sheet + 表单）| 1d |
| F1-32 | AiChatScreen（消息列表 + 输入框 + 快捷芯片）| 1.5d |
| F1-33 | TokenMeter 组件（Pro/Free/Token 状态切换）| 0.5d |
| F1-34 | PaywallScreen（档位选择 + 功能对比表）| 1d |

**后端任务**

| 任务 ID | 描述 | 估时 |
|---------|------|------|
| B1-30 | `GET /questions/wrong-book` `GET /questions/knowledge-matrix` | 1d |
| B1-31 | `POST /ai/ask`（配额检查 + Claude API 调用 + 扣费）| 2d |
| B1-32 | `POST /ai/chat/:sessionId`（多轮追问）| 1d |
| B1-33 | AI 额度 Redis 日重置定时任务 | 0.5d |

**Phase 1 产出物**

- ✅ 可登录/注册的 iOS App
- ✅ 完整的学习主流程（仪表板 → 题目列表 → 题目详情 → 错题本 → 问 AI）
- ✅ Free / Token / Pro 状态在所有页面一致
- ✅ EAS Preview Build 发布给产品验收

---

## 四、Phase 2 · K2 大学 + K4 论坛（第 6–9 周）

### 第 6 周 · K2 大学列表 + 详情

| 任务 ID | 端 | 描述 | 估时 |
|---------|---|------|------|
| F2-01 | 前 | UniversityListScreen（搜索/筛选/卡片）| 2d |
| F2-02 | 前 | UniversityDetailScreen（5 个 Tab 骨架）| 1d |
| F2-03 | 前 | 概览 Tab（维度进度条 / 热门科目 / 适合人群）| 1d |
| F2-04 | 前 | 评分 Tab（用户评价列表 + WriteReview 入口）| 0.5d |
| B2-01 | 后 | `GET /universities`（支持 regionGroup 筛选 + 中/日/英/昵称搜索）| 1.5d |
| B2-01a | 后 | `GET /universities/grads/:id` + `GET /universities/majors`（UNI_GRADS/UNI_MAJORS）| 0.5d |
| B2-02 | 后 | `GET /universities/:id`（全量数据，含 regionGroup）| 0.5d |
| B2-03 | 后 | `GET /universities/:id/reviews` `POST .../reviews` | 1d |

### 第 7 周 · K2 教授（基础）

> 教授 AI 摘要（Pro）和大学对比页面已列为 MVP_SCOPE Won't，本周不实现。

| 任务 ID | 端 | 描述 | 估时 |
|---------|---|------|------|
| F2-10 | 前 | 教授 Tab（列表 + 跳转详情）| 0.5d |
| F2-11 | 前 | ProfessorDetailScreen（基础信息 + 录取数据 + 经验列表；AI 摘要区域留占位 UI 但不接后端）| 1d |
| F2-13 | 前 | 过去问 Tab（复用 QuestionListScreen）| 0.5d |
| B2-10 | 后 | `GET /universities/:id/professors`| 0.5d |
| B2-11 | 后 | `GET /universities/professors/:name`（`aiSummary` 字段留 null，V2 再填充）| 0.5d |
| ~~F2-12~~ | ~~前~~ | ~~UniversityCompareScreen~~ — **Won't（V2）** | — |
| ~~B2-12~~ | ~~后~~ | ~~`GET /universities/compare`~~ — **Won't（V2）** | — |

### 第 8 周 · K4 论坛首页 + 帖子详情

| 任务 ID | 端 | 描述 | 估时 |
|---------|---|------|------|
| F3-01 | 前 | ForumHomeScreen（搜索 + 5 Tab + 帖子列表）| 2d |
| F3-02 | 前 | ThreadDetailScreen（原帖 + 关联题目卡 + 回复）| 2d |
| F3-03 | 前 | 已采纳答案高亮 + 点赞 | 0.5d |
| ~~F3-04~~ | ~~前~~ | ~~AI 论坛总结（Pro）~~ — **Won't（V2）** | — |
| B3-01 | 后 | `GET /forum/threads`（筛选/分页）| 1d |
| B3-02 | 后 | `GET /forum/threads/:id`（帖子 + 回复）| 1d |
| B3-03 | 后 | `POST /forum/threads/:id/replies` + 采纳/点赞 | 1d |

### 第 9 周 · K4 发帖 + 资料互助 + 学习圈

| 任务 ID | 端 | 描述 | 估时 |
|---------|---|------|------|
| F3-10 | 前 | ComposeThreadScreen（类型/关联题目/标签/正文）| 1.5d |
| F3-11 | 前 | MaterialRequestScreen（状态机 UI）| 1d |
| F3-12 | 前 | GroupListScreen（静态展示）+ GroupDetailScreen（成员/今日任务/静态消息流，不接实时 API）| 1d |
| B3-10 | 后 | `POST /forum/threads`（发帖）| 0.5d |
| B3-11 | 后 | `GET /forum/groups`（列表）+ `POST /forum/groups/:id/join`（加入）；群消息 API **Won't（V2，需 WebSocket）** | 0.5d |

**Phase 2 产出物**

- ✅ 完整 K2 大学模块（列表/详情/教授基础信息）；大学对比和教授 AI 摘要 V2
- ✅ 完整 K4 论坛模块（首页/帖子/发帖/学习圈静态展示）；实时群消息 V2
- ✅ 题目详情 ↔ 论坛双向跳转

---

## 五、Phase 3 · AI 增强 + 变现 + 推送（第 10–12 周）

### 第 10 周 · AI 流式输出 + 参考书索引

| 任务 ID | 端 | 描述 | 估时 |
|---------|---|------|------|
| F4-01 | 前 | AI Chat 支持 SSE 流式渲染（打字机效果）| 2d |
| F4-02 | 前 | AiAnswer 行动按钮（加错题本/复制/分享）| 0.5d |
| F4-03 | 前 | ReferenceIndexScreen（书目列表 + 章节详情）| 1.5d |
| F4-04 | 前 | ReferenceBookDetail（章节 → 关联题目跳转）| 1d |
| B4-01 | 后 | SSE 流式 AI 回复接口 | 1.5d |
| B4-02 | 后 | `GET /references/books` + 章节关联题目 | 1d |

### 第 11 周 · IAP 内购 + 通知中心

| 任务 ID | 端 | 描述 | 估时 |
|---------|---|------|------|
| F4-10 | 前 | 集成 `expo-iap` 或 RevenueCat（三档产品）| 1.5d |
| F4-11 | 前 | PaywallScreen 接入真实 IAP 流程 | 1d |
| F4-12 | 前 | NotificationsScreen（通知列表 + 已读标记）| 1d |
| F4-13 | 前 | Expo Push Token 注册 | 0.5d |
| B4-10 | 后 | Apple IAP receipt 验证（App Store Connect API）| 2d |
| B4-11 | 后 | Pro 状态更新 + 到期处理 | 0.5d |
| B4-12 | 后 | 推送通知服务（Expo Push API + 模板）| 1d |

### 第 12 周 · 贡献机制 + 离线缓存 + 图片上传

| 任务 ID | 端 | 描述 | 估时 |
|---------|---|------|------|
| F4-20 | 前 | 上传贡献入口 UI（MVP 不实现真实上传）| 0.5d |
| F4-21 | 前 | TanStack Query 离线模式（缓存策略调优）| 1d |
| F4-22 | 前 | 题目原图查看（expo-image + 缩放手势）| 1d |
| F4-23 | 前 | OnboardingScreen（首次引导 3 步）| 1d |
| B4-20 | 后 | S3 presigned URL 上传接口 | 1d |
| B4-21 | 后 | 贡献积分记账接口 | 0.5d |

---

## 六、Phase 4 · 性能 + App Store 上架（第 13–14 周）

### 第 13 周 · 性能优化 + QA

| 任务 ID | 描述 | 负责 |
|---------|------|------|
| P-01 | Metro bundle 分析（react-native-bundle-visualizer）| 前端 |
| P-02 | 大列表 FlashList 替换 FlatList | 前端 |
| P-03 | 图片懒加载 + CDN 缓存头配置 | 前端 + 后端 |
| P-04 | API 响应时间基准测试（目标 < 300ms p95）| 后端 |
| P-05 | 数据库索引优化（universityId + year + subject）| 后端 |
| Q-01 | 全流程功能测试（K1–K4 + AI + IAP 沙箱）| QA |
| Q-02 | iPhone SE / iPhone 15 Pro Max 双端兼容测试 | QA |
| Q-03 | 网络劣化测试（3G / 断网 降级）| QA |
| Q-04 | Pro / Free / Token 状态边界场景测试 | QA |

### 第 14 周 · App Store 准备 + 上架

| 任务 ID | 描述 | 负责 |
|---------|------|------|
| R-01 | EAS Build Production 签名配置 | 前端 |
| R-02 | App Store Connect 创建 App 条目 | 前端 |
| R-03 | 截图制作（6.7" + 6.1" + iPad 可选）| 设计 |
| R-04 | 应用描述 / 关键词（中文/日文）| 产品 |
| R-05 | 隐私政策页面（Web）| 产品 |
| R-06 | IAP 产品在 App Store Connect 配置 | 前端 |
| R-07 | TestFlight 内测发布（20 人）| 前端 |
| R-08 | App Store 审核提交 | 前端 |
| R-09 | 审核通过后灰度发布（10% → 100%）| 前端 |

---

## 七、里程碑汇总

| 里程碑 | 日期（基准 2026-05-14）| 验收标准 |
|--------|----------------------|---------|
| M0 工程脚手架完成 | Week 1 末 | CI 绿灯，本地可运行 |
| M1 MVP 内测版 | Week 5 末 | K1+K3 完整流程，TestFlight 可下载 |
| M2 完整功能版 | Week 9 末 | K1–K4 全模块，QA 开始介入 |
| M3 发布候选版 | Week 12 末 | AI+IAP+推送全部接通，全功能测试通过 |
| M4 App Store 上架 | Week 14 末 | 审核通过，公开上线 |

---

## 八、风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| App Store 审核被拒（IAP / 内容）| 中 | 高 | 提前阅读 App Review Guidelines；IAP 使用标准描述；过去问版权声明清晰 |
| AI API 延迟 > 10s | 中 | 中 | SSE 流式输出改善体验；前端加 30s 超时+重试；备用 loading 动画 |
| 大学评分/教授数据维护成本高 | 高 | 低 | MVP 阶段运营手动录入；Phase 2 后考虑用户贡献+审核机制 |
| 过去问版权问题 | 低 | 极高 | 不全文展示题目；仅显示改写摘要+页码；参考日本著作权法第 36 条（试验合理使用）|
| React Native New Architecture 兼容问题 | 低 | 中 | Phase 0 明确测试所有依赖库；不兼容的库保留 Old Arch fallback |
| Token 消耗异常（用户刷接口）| 中 | 中 | Redis 每用户每日限流（免费 1 次/天，Token 上限 100 次/天）；后端服务端校验 |
| **Phase 3 排期严重偏紧** | 高 | 高 | AI 流式 + IAP + Apple Server Notifications + 推送 + S3 + 离线缓存合计压缩在 3 周，实际经验需要 5–6 周；建议将 Phase 3 拆成 Phase 3a（AI+IAP，第 10–12 周）和 Phase 3b（推送+离线+贡献，第 13–14 周），Phase 4 顺延至第 15–16 周 |
| **内容运营工作量被低估** | 高 | 极高 | 过去问拆题、解析撰写、参考书章节匹配、版权审查、教授信息录入均为人力密集型工作，预计 1 人×3 个月；若 Phase 1 验收时题目不足 200 题，核心功能无法演示；建议 Phase 0 开始即启动内容录入，独立于研发排期跟进 |

---

## 九、开发规范

### 分支策略
```
main           ← 仅合并经过审核的 release
develop        ← 集成分支，每日自动 CI
feature/*      ← 功能开发，从 develop 切，完成后 PR → develop
fix/*          ← Bug 修复
release/vX.Y.Z ← 预发布分支，从 develop 切
```

### PR 规范
- PR 标题格式：`[F1-20] 题目详情页骨架`
- 必须通过：`tsc --noEmit` + `eslint` + EAS Build Check
- 至少 1 人 review 后合并

### Commit 规范（Conventional Commits）
```
feat(study): add question detail mastery control
fix(ai): handle quota exceeded error correctly
perf(list): replace FlatList with FlashList
chore(deps): upgrade expo-router to 4.1.0
```

### API Mock 策略
- Phase 0–1 初期：前端使用本地 Mock Service Worker（MSW）+ TypeScript 类型约束
- Phase 1 中后期：对接真实后端，保留 MSW 作为测试层
- 所有 API 调用集中在 `src/api/` 目录，组件不直接调用 axios

---

## 十、环境变量（EAS 多环境）

```bash
# .env.development
EXPO_PUBLIC_API_BASE_URL=https://dev.api.kairos.app/api/v1
EXPO_PUBLIC_SENTRY_DSN=

# .env.staging
EXPO_PUBLIC_API_BASE_URL=https://staging.api.kairos.app/api/v1

# .env.production
EXPO_PUBLIC_API_BASE_URL=https://api.kairos.app/api/v1
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/...
```

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" }
    },
    "staging": {
      "distribution": "internal",
      "env": { "APP_ENV": "staging" }
    },
    "production": {
      "distribution": "store",
      "env": { "APP_ENV": "production" }
    }
  }
}
```

---

## 十一、与 Kairos 主应用的合并路径

Kakomon 作为独立模块开发，后期合并到 Kairos 时的接入点：

1. **路由** — Kakomon 所有路由已在 `/kakomon/*` 命名空间下，Kairos 只需在主导航中添加入口
2. **认证** — 使用同一套 JWT；`authStore` 共享 token，不重复登录
3. **UI 组件** — `src/components/ui/` 中的组件与 Kairos 设计系统对齐，可直接复用
4. **用户 Profile** — K1 中的目标校/专业字段合并到 Kairos 主用户表，新增字段即可
5. **状态** — Kakomon 的 `studyStore` 独立，不污染 Kairos 全局 Store
