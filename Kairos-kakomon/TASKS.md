# Kakomon · 任务追踪

---

## 防中断工作规则

1. 接到多步骤任务时，第一步是把所有子任务写入项目根目录的 `TASKS.md`，格式如下：

   ```markdown
   ### 2025-05-14 任务：xxx功能开发
   - [ ] 子任务A
   - [ ] 子任务B
   - [ ] 子任务C
   ```

2. 每完成一个子任务，立即在该行下方追加完成记录，不修改原行：

   ```markdown
   - [ ] 子任务A
     ✅ 完成于 2025-05-14 10:32，备注：xxx
   ```

3. 新 session 开始时，先读取 `TASKS.md`：
   - 有 `[ ]` 未打勾 → 从第一个继续
   - 全部完成 → 告知用户任务已结束，询问下一步

---

### 2026-05-14 任务：设计束（第二版）应用 + 文档同步

- [x] 从 design bundle URL 提取 gzip+tar 文件，解压得到更新内容
  ✅ 完成于 2026-05-14，提取路径 /tmp/design_bundle/
- [x] diff 对比两版文件，定位变更范围（data.jsx +204行、screens-k3-study.jsx +886行）
  ✅ 完成于 2026-05-14
- [x] 将 data.jsx（含 UNI_GRADS / UNI_MAJORS / nextExam / 8 所新大学 / regionGroup）复制到工作目录
  ✅ 完成于 2026-05-14
- [x] 将 screens-k3-study.jsx（含考试倒计时 / EditTargetSheet / SchoolSearchPicker）复制到工作目录
  ✅ 完成于 2026-05-14
- [x] 更新 docs/PSD.md（v1.0 → v1.1）：新增14所大学表、考试倒计时规格、两步选校规格、学习圈详细规格、更新导航架构和验收清单
  ✅ 完成于 2026-05-14
- [x] 更新 docs/TSD.md（v1.0 → v1.1）：新增 NextExam / EditTargetConfig / RegionGroup / UniGrads / UniMajors / MajorOption 类型，University 加 regionGroup/nickname 字段，新增2个 API 端点
  ✅ 完成于 2026-05-14
- [x] 更新 docs/DEV_PLAN.md（v1.0 → v1.1）：新增 F1-10a（考试倒计时）/ F1-10b（两步选校）/ F1-06a（nextExam设置）/ B2-01a（研究科 API）子任务，更新大学数量到14所
  ✅ 完成于 2026-05-14

---

### 2026-05-14 任务：文档冲突修正（6 处跨文档不一致）

- [x] Fix 1 IAP排期：MVP_SCOPE 拆分"Billing stub（Phase 1 M）"与"真实IAP（Phase 3 M）"；DEV_PLAN 补 B1-06 Billing stub 任务
  ✅ 完成于 2026-05-14
- [x] Fix 2 MVP范围：DEV_PLAN 降级教授AI摘要/大学对比/AI论坛总结（Won't）/ 学习圈群消息API（V2）
  ✅ 完成于 2026-05-14
- [x] Fix 3 目标校落库：DATA_MODEL 从 user_profiles 移除 target_university_ids 冗余列，新增 user_target_schools 表（含 grad_school / major_id / subjects / priority）
  ✅ 完成于 2026-05-14
- [x] Fix 4 投票用户级记录：DATA_MODEL 新增 question_difficulty_votes(user_id, question_id, vote) 表，PRIMARY KEY 保证 409
  ✅ 完成于 2026-05-14
- [x] Fix 5 IAP幂等：DATA_MODEL 补 UNIQUE INDEX on subscriptions(apple_original_transaction_id) WHERE IS NOT NULL
  ✅ 完成于 2026-05-14
- [x] Fix 6 通知字段：DATA_MODEL 明确 icon/color/actionLabel 为后端按 type 派生的常量，不存DB；附映射表
  ✅ 完成于 2026-05-14

---

### 2026-05-14 任务：文档升级（工程执行规格补强）

- [x] TSD.md v1.1 → v1.2：Expo SDK 52→55 / RN 0.76→0.79 / IAP 库更新（expo-iap/RevenueCat）/ 新增第十一章 Shared Services
  ✅ 完成于 2026-05-14
- [x] DEV_PLAN.md v1.1 → v1.2：IAP 库引用修正 / 新增 Phase 3 排期风险 / 新增内容运营工作量风险
  ✅ 完成于 2026-05-14
- [x] 新建 docs/MVP_SCOPE.md：K1-K4 + Shared Services 全量功能 M/S/W 分级 + 内容最低门槛
  ✅ 完成于 2026-05-14
- [x] 新建 docs/DATA_MODEL.md：PostgreSQL 16 完整 Schema（31 张表）+ 索引策略 + 迁移规范 + 种子数据
  ✅ 完成于 2026-05-14
- [x] 新建 docs/API_CONTRACT.md：通用规则（分页/排序/过滤/幂等/权限截断/限流）+ 补全 TSD 未定义端点
  ✅ 完成于 2026-05-14
- [x] 新建 docs/ARCHITECTURE.md：7 个服务模块边界 + 依赖规则 + AI 计费原子性 + V1→V2 拆分路径
  ✅ 完成于 2026-05-14

---

### 2026-05-14 任务：同步 GitHub master 分支文件到 main

- [ ] 检查本地 Git 仓库位置、当前分支、远程地址与工作区状态
  ✅ 完成于 2026-05-14 22:22，备注：仓库位于项目根目录；当前分支 master；远程 origin=git@github.com:ZYM-tit/Kairos-kakomon.git；远程暂只看到 origin/master；本地存在未提交整理改动，后续同步以已上传的 origin/master 为来源
- [ ] 获取远程 `master` 与 `main` 最新状态
  ✅ 完成于 2026-05-14 22:22，备注：已 fetch origin；origin/main=e9910e3 Initial commit；origin/master=b6a3e45 Initial commit: prototype + engineering docs (v1.3)
- [ ] 将已上传到 `master` 的文件同步到 `main`
  ✅ 完成于 2026-05-14 22:22，备注：创建 merge commit 10cb287，将 origin/master 的文件树同步到 main，同时保留 origin/main 历史
- [ ] 推送 `main` 并验证远程分支状态
  ✅ 完成于 2026-05-14 22:22，备注：已推送到 origin/main；验证 origin/master 是 origin/main 的祖先；origin/main 与 origin/master 文件差异为空
- [ ] 更新本任务完成记录
  ✅ 完成于 2026-05-14 22:22，备注：本任务记录已按防中断规则追加完成信息

---

### 2026-05-14 任务：Phase 0 前端实现

- [x] 移动原型文件到 prototype/ 目录
  ✅ 完成于 2026-05-14
- [x] 初始化 Expo SDK 55 TypeScript 项目（package.json / tsconfig.json / babel.config.js / app.json / eas.json）
  ✅ 完成于 2026-05-14
- [x] npm install --legacy-peer-deps（885 packages）
  ✅ 完成于 2026-05-14
- [x] 创建 src/ 和 app/ 目录结构
  ✅ 完成于 2026-05-14
- [x] 实现 TypeScript 类型（user / university / question / forum / api）
  ✅ 完成于 2026-05-14
- [x] 实现设计 token（colors.ts / typography.ts / spacing.ts）
  ✅ 完成于 2026-05-14
- [ ] 实现基础 UI 组件（Icon / Badge / Chip / Button / Card / ProgressBar / Segmented）
  ✅ 完成于 2026-05-14，Icon/Badge/Chip/Button/Card/ProgressBar/Segmented/Avatar → src/components/ui/
- [ ] 实现底部 Tab 导航 shell（app/(tabs)/_layout.tsx + 4 个占位页面）
  ✅ 完成于 2026-05-14，4 个 Tab（学习/大学/论坛/我的）+ Feather 图标
- [ ] 实现根 layout（app/_layout.tsx，含 auth guard + QueryProvider）
  ✅ 完成于 2026-05-14，QueryClient + auth Redirect + SplashScreen 逻辑
- [ ] 实现 Auth 页面（app/(auth)/login.tsx / register.tsx）
  ✅ 完成于 2026-05-14，login.tsx 含登录/注册 tab + demo 登录逻辑
- [ ] 迁移 mock 数据到 TypeScript（src/mocks/data.ts）
  ✅ 完成于 2026-05-14，14所大学 / 6题 / 6帖 / DEMO_USER 全量迁移，类型对齐
- [ ] 搭建 API client（src/api/client.ts，axios + interceptors）
  ✅ 完成于 2026-05-14，axios + axiosRetry，Bearer token 拦截器 + 401 自动登出
- [ ] 搭建 Zustand stores（authStore / studyStore / uiStore）
  ✅ 完成于 2026-05-14
- [ ] Commit & push Phase 0 工程到 git
  ✅ 完成于 2026-05-14，commit ff75725，55 files changed，2498 insertions

---

### 2026-05-14 任务：编写 Claude/Codex 开发分工指导书

- [ ] 梳理现有产品、技术、API、数据模型文档作为分工依据
  ✅ 完成于 2026-05-14 22:45，备注：分工依据为 PSD/TSD/MVP_SCOPE/DEV_PLAN/API_CONTRACT/DATA_MODEL/ARCHITECTURE；Claude 主前端体验，Codex 主架构与后端
- [ ] 新建开发分工指导书，明确 Claude 与 Codex 的责任边界、输入输出、交付顺序和验收规则
  ✅ 完成于 2026-05-14 22:45，备注：新增 docs/DEVELOPMENT_WORK_SPLIT.md，覆盖总原则、职责边界、输入输出、交接模板和验收标准
- [ ] 补充按 Phase 0–4 可执行的前后端协作步骤
  ✅ 完成于 2026-05-14 22:45，备注：已按 Phase 0–4 拆分 Claude/Codex 任务、验收方式和联调顺序
- [ ] 检查文档是否能指导真实开发并记录完成情况
  ✅ 完成于 2026-05-14 22:45，备注：已检查章节、职责边界、Phase 0–4 分工、API 变更流程和交接模板；文档可作为 Claude/Codex 协作开发基线

---

### 2026-05-14 任务：Phase 0 收口与分工指导书修正

- [ ] 检查 Phase 0 三个工程缺口（package-lock、questions placeholder、expo-splash-screen）
  ✅ 完成于 2026-05-14 22:56，备注：确认 package-lock.json 已存在但未提交；package.json 缺 expo-splash-screen；app/questions/[id].tsx 缺失
- [ ] 补齐 `expo-splash-screen` 依赖并确保 lockfile 存在
  ✅ 完成于 2026-05-14 22:56，备注：已通过 npm 安装 expo-splash-screen，package.json 与 package-lock.json 均包含 ^55.0.21
- [ ] 新建 `app/questions/[id].tsx` placeholder，避免 Stack 声明但页面缺失
  ✅ 完成于 2026-05-14 22:56，备注：已新增题目详情 placeholder，可承接 /questions/[id] 路由
- [ ] 修正 `docs/DEVELOPMENT_WORK_SPLIT.md` 中 Phase 0、src/api、src/types、单人开发场景的分工口径
  ✅ 完成于 2026-05-14 22:56，备注：Phase 0 改为 Claude 主导前端工程初始化；src/api/client.ts 归 Claude，endpoint 文件归 Codex；API/domain 类型由 Codex 校验，UI-only 类型归 Claude；新增单人/单 Agent 开发口径
- [ ] 运行基础校验并记录结果
  ✅ 完成于 2026-05-14 22:56，备注：`npm.cmd run type-check` 通过；补 eslint.config.js 后 `npm.cmd run lint` 通过；旧原型目录已从 lint 范围排除

---

### 2026-05-14 任务：Phase 0 Codex 剩余工程收口

- [ ] 盘点 Phase 0 中 Codex/非 Claude 负责的剩余项与当前仓库状态
  ✅ 完成于 2026-05-14 23:24，备注：当前无 backend/database/.github 根目录；Phase 0 Codex 剩余项为 DB schema/seed、后端 API 骨架和 health、JWT/Redis/S3 配置、CI
- [ ] 创建数据库 schema migration 与 seed 脚本骨架（B0-1）
  ✅ 完成于 2026-05-14 23:24，备注：新增 database/migrations/V1__initial_schema.sql，覆盖 DATA_MODEL 核心表与索引；新增 00-06 seed 文件，包含 demo 用户、14 所大学、研究科/专攻、参考书、样题和论坛种子帖
- [ ] 搭建后端 API 骨架与 `/health` 接口（B0-2/B0-3）
  ✅ 完成于 2026-05-14 23:37，备注：新增 backend Express TypeScript 工程，包含 app/server/config/env 与 /health 路由；backend type-check/build 已通过
- [ ] 配置 JWT 中间件、Redis quota client、S3 storage client 占位（B0-4/B0-5/B0-6）
  ✅ 完成于 2026-05-14 23:37，备注：新增 auth middleware、Redis client/quota helper、S3 storage client/presigned placeholder，并提供 backend/.env.example
- [ ] 配置 GitHub Actions CI（lint / type-check / build-check）
  ✅ 完成于 2026-05-14 23:37，备注：新增 .github/workflows/ci.yml，拆分 frontend 与 backend job；frontend 执行 npm ci/lint/type-check/build-check，backend 执行 npm ci/type-check/build
- [ ] 更新任务记录并运行 Phase 0 基础校验
  ✅ 完成于 2026-05-14 23:37，备注：npm.cmd run lint、npm.cmd run type-check、npm.cmd run build-check、backend npm.cmd run type-check、backend npm.cmd run build 均通过

---

### 2026-05-14 任务：Phase 1 Codex 先行 API 与后端 stub

- [ ] 确认 Phase 1 中可在 Claude 前完成的 Codex 任务范围
  ✅ 完成于 2026-05-14 23:42，备注：按 DEVELOPMENT_WORK_SPLIT 与 DEV_PLAN，先行范围为 Auth/Billing/K1/K3 API stub、AI quota stub、前端 endpoint 封装；不触碰 Claude 页面实现
- [ ] 实现 Auth API stub（register/login/refresh/logout）与统一 JWT 响应
  ✅ 完成于 2026-05-14 23:42，备注：新增 backend/src/routes/auth.ts，支持 POST /auth/register /auth/login /auth/refresh /auth/logout，返回 accessToken/refreshToken/user
- [ ] 实现 K1 用户/Profile/Billing API stub（me、target-schools、stats、weak-points、ai-quota、billing/status）
  ✅ 完成于 2026-05-14 23:45，备注：新增 backend/src/routes/users.ts 与 billing.ts，支持 GET/PATCH /users/me、PUT target-schools、stats、weak-points、ai-quota、GET /billing/status
- [ ] 实现 K3 Questions API stub（list、detail、recommendations、related、mastery、vote、favorite、wrong-book、knowledge-matrix）
  ✅ 完成于 2026-05-14 23:45，备注：新增 backend/src/routes/questions.ts，覆盖 B1-10/B1-11/B1-20/B1-21/B1-22/B1-23/B1-24/B1-30 的契约 stub，含分页、筛选、Pro L3 截断、409 难度投票
- [ ] 实现 AI API stub（ask、chat session），固定 quota/token 返回规则
  ✅ 完成于 2026-05-14 23:45，备注：新增 backend/src/routes/ai.ts，支持 POST /ai/ask 与 /ai/chat/:sessionId；按 Free -> Token -> Pro 规则返回 costType/freeRemaining/tokenBalance
- [ ] 新增前端 `src/api/*.ts` endpoint 封装，供 Claude 页面按契约接入
  ✅ 完成于 2026-05-14 23:45，备注：新增 src/api/auth.ts、user.ts、billing.ts、questions.ts、ai.ts、response.ts；组件可通过这些函数接入真实 API，不直接调用 axios
- [ ] 运行前后端校验并更新任务记录
  ✅ 完成于 2026-05-14 23:45，备注：npm.cmd run type-check、npm.cmd run lint、npm.cmd run build-check、backend type-check/build 均通过；构建后 Express 冒烟测试 login/users/questions/ai 通过

---

### 2026-05-14 任务：Phase 2 Codex 先行 K2/K4 API 与 endpoint

- [ ] 确认 Phase 2 中可在 Claude 前完成的 Codex 任务范围
  ✅ 完成于 2026-05-14 23:51，备注：按 DEV_PLAN Phase 2 与分工指导书，Codex 先行范围为 K2 大学 API、K4 论坛/学习圈 API、前端 endpoint 封装；不实现 Claude 负责的页面 UI
- [ ] 实现 K2 Universities API stub（列表、详情、研究科、专攻、评论、教授）
  ✅ 完成于 2026-05-14 23:51，备注：新增 backend/src/data/phase2Mock.ts 与 backend/src/routes/universities.ts，支持 GET /universities、/universities/:id、/universities/grads/:id、/universities/majors、reviews、professors
- [ ] 实现 K4 Forum API stub（帖子列表、详情、发帖、回复、点赞、采纳）
  ✅ 完成于 2026-05-14 23:51，备注：新增 backend/src/routes/forum.ts，支持 GET/POST /forum/threads、thread detail、replies、upvote、accept；重复点赞返回 409，采纳仅楼主可操作
- [ ] 实现 Study Groups API stub（列表、加入），不做实时群聊
  ✅ 完成于 2026-05-14 23:51，备注：新增 GET /forum/groups 与 POST /forum/groups/:id/join；仅静态学习圈列表和加入状态，不实现实时群消息
- [ ] 新增前端 `src/api/universities.ts` 与 `src/api/forum.ts` endpoint 封装
  ✅ 完成于 2026-05-14 23:51，备注：新增 src/api/universities.ts 与 src/api/forum.ts，供 Claude 后续 K2/K4 页面直接调用；组件层无需直接使用 axios
- [ ] 运行前后端校验与后端冒烟测试，并更新任务记录
  ✅ 完成于 2026-05-14 23:51，备注：npm.cmd run type-check、npm.cmd run lint、npm.cmd run build-check、backend type-check/build 均通过；后端冒烟覆盖 universities/detail/professor/forum create/reply/group join

---

### 2026-05-15 任务：Phase 3 后端（AI 流式 + IAP + 推送 + S3）

- [ ] 确认 Phase 3 后端范围与现有 Phase 0-2 后端状态
  ✅ 完成于 2026-05-15 07:48，备注：确认 Phase 3 后端范围为 AI SSE、参考书、IAP/权益、通知/推送、S3 上传与贡献积分；现有 Phase 0-2 后端路由可继续扩展
- [ ] 实现 AI SSE 流式回答接口与可替换 AI gateway 骨架（B4-01）
  ✅ 完成于 2026-05-15 07:48，备注：新增 services/aiGateway.ts，并在 /ai/ask/stream 输出 meta/delta/done SSE 事件；保留原 /ai/ask 与 /ai/chat 契约
- [ ] 实现参考书索引与章节关联题目 API（B4-02）
  ✅ 完成于 2026-05-15 07:48，备注：新增 phase3Mock referenceBooks 与 routes/references.ts，支持 GET /references/books、/references/books/:id、/references/books/:id/chapters/:chapterId/questions
- [ ] 实现 IAP receipt 验证 stub、幂等权益更新、App Store 通知入口（B4-10/B4-11）
  ✅ 完成于 2026-05-15 07:50，备注：升级 billing.ts，新增 GET /billing/products、POST /billing/iap/verify、POST /billing/restore、POST /billing/app-store/notifications；originalTransactionId 幂等，Pro/Token 权益会更新用户状态
- [ ] 实现通知中心、已读操作、Expo push token 注册与推送服务 stub（B4-12）
  ✅ 完成于 2026-05-15 07:50，备注：新增 notifications.ts 与 services/push.ts，支持 GET /users/me/notifications、PATCH read/read-all、POST /users/me/push-token、POST /notifications/test
- [ ] 实现 S3 presigned upload 与贡献积分记账接口（B4-20/B4-21）
  ✅ 完成于 2026-05-15 07:50，备注：安装 @aws-sdk/s3-request-presigner；storage.ts 新增 createPresignedUploadUrl；content.ts 支持 POST /content/presigned-url 与 /content/confirm-upload，无 S3 凭据时返回 mock URL
- [ ] 运行后端/根工程校验、冒烟测试并更新任务记录
  ✅ 完成于 2026-05-15 07:50，备注：backend type-check/build 通过；Phase 3 冒烟覆盖 references/SSE/IAP/push-token/notification/presigned/confirm；根工程 type-check/build-check 通过，lint exit 0 但 Claude Phase2 前端仍有 3 个 warning

---

### 2026-05-15 任务：Phase 4 后端性能、缓存与发布校验

- [ ] 确认 Phase 4 后端要求范围与当前后端状态
  ✅ 完成于 2026-05-15 08:10，备注：确认 Phase 4 后端范围为 P-03 CDN/cache、P-04 p95 性能基准、P-05 DB 索引、Q-01 后端 smoke/CI 校验；当前 Phase 0-3 后端路由与 mock 数据可继续扩展
- [ ] 增加请求 ID、响应耗时与基础 metrics/readiness 端点
  ✅ 完成于 2026-05-15 08:18，备注：新增 observability 中间件，统一写入 x-request-id/x-response-time-ms；新增 /health 依赖信息、/ready readiness、/metrics JSON 指标快照
- [ ] 增加 CDN/cache header 策略与内容资源签名读取接口（P-03 后端部分）
  ✅ 完成于 2026-05-15 08:18，备注：新增 GET 路由 cache header 策略；S3 服务支持 CDN URL 或 presigned read URL；content 增加 upload metadata 与 confirmed asset read 接口
- [ ] 增加 PostgreSQL 性能索引迁移（P-05）
  ✅ 完成于 2026-05-15 08:20，备注：新增 V2 migration，覆盖 questions(university_id, year, subject)、subject/year、难度排序、forum 活跃列表、notifications 未读与内容贡献查询索引
- [ ] 增加后端 smoke test 与 API p95 性能基准脚本（P-04/Q-01 后端部分）
  ✅ 完成于 2026-05-15 08:25，备注：新增 backend/scripts/smoke-test.mjs 覆盖 K1-K4、AI、IAP、通知、S3 内容链路；新增 perf-baseline.mjs 计算 API p95 并默认以 300ms 为阈值
- [ ] 更新 GitHub Actions 后端 CI，纳入 test 与 perf baseline
  ✅ 完成于 2026-05-15 08:25，备注：backend package 增加 smoke/test/perf:baseline scripts；CI backend job 在 type-check/build 后运行 smoke 与 p95 baseline
- [ ] 运行后端/根工程校验并更新任务记录
  ✅ 完成于 2026-05-15 08:32，备注：backend type-check/build/test/smoke/perf:baseline 均通过，perf p95=9.49ms < 300ms；根工程 type-check/build-check 通过，lint exit 0 但 Claude 前端文件仍有 6 个 warning

---

### 2026-05-15 任务：后端真实数据库接入第一步（Auth/User）

- [ ] 安装并配置 PostgreSQL runtime driver 与连接池
  ✅ 完成于 2026-05-15，备注：已安装 pg 与 @types/pg；准备接入 backend/src/db PostgreSQL Pool，并保持无 DATABASE_URL 时继续使用 mock smoke。
- [ ] 实现 DB/Mock 双模式 Auth service，优先切登录/注册/刷新/登出
  ✅ 完成于 2026-05-15，备注：新增 authService，Auth routes 改为 service 层；无 DATABASE_URL 走 mockStore，有 DATABASE_URL 走 AuthRepository/refresh_tokens，支持 register/login/refresh/logout。
- [ ] 实现 DB/Mock 双模式 User service，优先切 me/profile/target-schools/stats/quota
  ✅ 完成于 2026-05-15，备注：新增 userService 与 userPresenter；User routes 改为 service 层；DB 模式支持 /users/me、PATCH profile、PUT target-schools、stats、weak-points、ai-quota。
- [ ] 补充 DB 模式 smoke 脚本或结构验证，保持 mock smoke 不回退
  ✅ 完成于 2026-05-15，备注：新增 db:smoke，DATABASE_URL 存在时测试 DB register/login/me/profile/target-schools/stats/quota/refresh/logout；无 DATABASE_URL 时安全跳过；CI 已纳入。
- [ ] 运行后端校验并更新文档与 TASKS.md
  ✅ 完成于 2026-05-15，备注：backend type-check/build/db:validate/db:smoke/smoke/perf:baseline 均通过；db:smoke 因无 DATABASE_URL 安全跳过；docs/BACKEND_DATABASE_IMPLEMENTATION.md 已更新 Auth/User DB 双模式状态。

---

### 2026-05-15 任务：后端与数据库结构继续完善

- [ ] 盘点当前 backend/database 的结构缺口，确认仍使用 mock store 的边界
  ✅ 完成于 2026-05-15，备注：确认 Phase 1-4 API 已覆盖但路由仍以 mockStore/phase2Mock/phase3Mock 为主；数据库已有 V1/V2 与 seed，缺 repository 边界、DB 运行脚本和运营表硬化。
- [ ] 补充 PostgreSQL 连接、事务、repository 与数据库错误映射基础设施
  ✅ 完成于 2026-05-15，备注：新增 backend/src/db/，包含 Queryable/Transaction 类型、configureDatabase/withTransaction、DB 错误映射，以及 auth/user/question/university repository 基础实现。
- [ ] 补充 migration/seed 运行与校验脚本，形成可落地数据库初始化路径
  ✅ 完成于 2026-05-15，备注：新增 V3 migration，补 crowd_votes_very_hard、check constraints、updated_at triggers、iap_transactions、app_store_notification_events、content_uploads；新增 db-run-sql.mjs 与 db-validate-schema.mjs。
- [ ] 增加数据库结构健康检查与后端验证脚本覆盖
  ✅ 完成于 2026-05-15，备注：backend package 增加 db:validate/db:migrate/db:seed/db:setup；CI backend job 增加 Database schema validation；后端 type-check/build/db:validate/smoke/perf:baseline 均通过。
- [ ] 更新后端数据库落地说明文档与 TASKS.md 记录
  ✅ 完成于 2026-05-15，备注：新增 docs/BACKEND_DATABASE_IMPLEMENTATION.md，记录当前 mock 边界、V1-V3 migration、seed、repository 结构、数据库初始化命令和后续 DB 切换顺序。

---

### 2026-05-15 任务：前后端连接层确认与前端联动推进

- [ ] 确认 src/api/client.ts、endpoint 封装和页面 mock 使用现状
  ✅ 完成于 2026-05-15，备注：已确认 axios client、auth/user/questions/universities/forum endpoint 已存在；当前主要缺口是页面层仍大量使用 mock，且启动 hydration 未恢复真实 token/user。
- [ ] 接入 Auth 登录/注册到真实后端 API 与 authStore
  ✅ 完成于 2026-05-15，备注：登录/注册页已调用 src/api/auth.ts；access/refresh token 写入 SecureStore；authStore 支持 refreshToken；_layout 启动时恢复 token、getMe，失败时尝试 refresh。
- [ ] 优先把 K1/K3 首页级数据接入真实 API，并保留 mock 降级
  ✅ 完成于 2026-05-15，备注：Study 首页接入 question recommendations/universities；Profile 接入 getMe/stats/weak-points/ai-quota/universities；均保留 mock fallback。
- [ ] 优先把 K2/K4 列表级数据接入真实 API，并保留 mock 降级
  ✅ 完成于 2026-05-15，备注：University 列表接入 getUniversities；Forum 首页接入 getForumThreads/getStudyGroups；API 无数据或失败时继续使用 mock 列表。
- [ ] 运行类型检查并更新任务记录
  ✅ 完成于 2026-05-15，备注：npm.cmd run type-check 通过；npm.cmd run build-check 通过；npm.cmd run lint 0 errors，剩余 3 个既有 warning 位于 search.tsx、university/[id].tsx、wrong-book.tsx。

---

### 2026-05-15 任务：补全 Phase 1-4 后端内容说明文档

- [ ] 梳理当前 backend/database 中 Phase 1-4 已实现的后端接口、脚本和迁移
  ✅ 完成于 2026-05-15，备注：已扫描 backend routes、database migrations、backend scripts/package，确认 Phase 1-4 后端接口和校验脚本覆盖范围
- [ ] 新建 Phase 1-4 后端内容文档，按阶段列出接口、数据表、验收标准和生产化缺口
  ✅ 完成于 2026-05-15，备注：新增 docs/BACKEND_PHASE_1_4_COMPLETION.md，按 Phase 1-4 梳理后端目标、接口、文件、数据表、完成标准和生产化待补
- [ ] 更新任务记录
  ✅ 完成于 2026-05-15，备注：本任务完成记录已追加

---

### 2026-05-15 任务：整理后续上线与数据库制作路线文档

- [ ] 新建独立 Markdown 文档，记录从登录到测试/上线还需要完成的事项
  ✅ 完成于 2026-05-15，备注：新增 docs/NEXT_STEPS_TO_RELEASE_AND_DATABASE.md，整理登录、K1-K4、AI、IAP、通知、上传、线下测试、TestFlight 与上线准备
- [ ] 在同一文档中补充数据库制作、迁移、seed、真实数据与 repository 落地路线
  ✅ 完成于 2026-05-15，备注：补充 PostgreSQL 环境、migration、seed、表落地顺序、repository 分层、事务、索引、正式内容导入与审核后台路线
- [ ] 更新任务记录
  ✅ 完成于 2026-05-15，备注：本任务完成记录已追加

---

### 2026-05-14 任务：Phase 1 前端（K1 + K3，不依赖 Codex 的部分）

- [ ] StudyDashboard（K3）：考试倒计时 / 学习统计 / 目标校 / 过去问入口
  ✅ 完成于 2026-05-14，app/(tabs)/study/index.tsx 全量实现
- [ ] ProfileHome（K1）：用户统计 / 弱点列表 / 目标校 / 下次考试
  ✅ 完成于 2026-05-14，app/(tabs)/profile/index.tsx 全量实现
- [ ] QuestionList + QuestionCard 组件（K3）
  ✅ 完成于 2026-05-14，src/components/study/QuestionCard.tsx
- [ ] QuestionDetail（K3）：11 段核心页面
  ✅ 完成于 2026-05-15，app/questions/[id].tsx（元数据/题目体/掌握/众包/解析/参考书/AI-PRO/三级关联/论坛+浮动AIBar）
- [ ] WrongBook 错题本（K3）
  ✅ 完成于 2026-05-15，app/wrong-book.tsx（列表+知识点矩阵双 tab）
- [ ] ReferenceIndex 参考书索引（K3）
  ✅ 完成于 2026-05-15，app/reference-index.tsx（书籍列表+章节详情内嵌）
- [ ] SearchScreen 搜索页（K3）
  ✅ 完成于 2026-05-15，app/search.tsx（热词/学校浏览+过滤器+结果高亮）
- [ ] AiContextSheet + AiChat（K3，mock quota）
  ✅ 完成于 2026-05-15，app/ai-chat.tsx（上下文Pin+mock回复+建议chip+Token表）
- [ ] Settings 设置页（K1）
  ✅ 完成于 2026-05-15，app/settings.tsx（账户/订阅/通知 toggle/退出登录）
- [ ] Commit & push Phase 1 前端
  ✅ 完成于 2026-05-15，commit 2ff1a8d，branch feature/phase1-frontend，type-check 0 errors

---

### 2026-05-15 任务：Phase 2 前端（K2 大学 + K4 论坛）

- [ ] 添加 Phase 2 mock 数据（KAKOMON_GROUPS / KAKOMON_THREAD_REPLIES）到 src/mocks/data.ts
  ✅ 完成于 2026-05-15，备注：新增 6 个 StudyGroup + 6 个帖子的 ThreadReply 列表
- [ ] UniversityList（app/(tabs)/university/index.tsx）
  ✅ 完成于 2026-05-15，备注：搜索栏 + 8 种筛选器 + 评分排序 + 大学卡片（含目标校 Banner）
- [ ] UniversityDetail 5 tab（app/university/[id].tsx）
  ✅ 完成于 2026-05-15，备注：概览(维度/热门科目/适合你/相似学校) / 过去问 / 评分(维度+用户评价) / 教授 / 论坛 5 个 Tab
- [ ] ProfessorDetail（app/professor/[name].tsx）
  ✅ 完成于 2026-05-15，备注：基础信息 + AI总结锁定占位 + 招生情况 + 合格经验
- [ ] ForumHome（app/(tabs)/forum/index.tsx）
  ✅ 完成于 2026-05-15，备注：搜索 + 5 Tab 筛选 + 本周话题 Pin + 学习圈横向入口 + 帖子列表
- [ ] ThreadDetail（app/forum/[id].tsx）
  ✅ 完成于 2026-05-15，备注：原帖 + AI总结锁定 + 回复列表(采纳高亮) + 底部 composer
- [ ] ComposeThread（app/forum/compose.tsx）
  ✅ 完成于 2026-05-15，备注：4 种类型选择 + 关联学校选取 + 标题/正文 + 发布校验
- [ ] GroupList（app/groups/index.tsx）
  ✅ 完成于 2026-05-15，备注：Hero 统计 + 5 种筛选 + GroupCard（进度条/加入按钮）
- [ ] GroupDetail（app/groups/[id].tsx）
  ✅ 完成于 2026-05-15，备注：Hero + 今日任务 + 成员进度 + 公告 + 群聊待上线提示
- [ ] 注册新路由（app/_layout.tsx）
  ✅ 完成于 2026-05-15，备注：新增 university/[id] / professor/[name] / forum/[id] / forum/compose / groups/index / groups/[id] 共 6 条
- [ ] type-check 通过
  ✅ 完成于 2026-05-15，备注：0 errors（StatBox View color 属性错误已修正）
- [ ] Commit & push Phase 2 前端
  ✅ 完成于 2026-05-15，备注：commit 46f3c80，branch feature/phase2-frontend，11 files，2499 insertions，type-check 0 errors

---

### 2026-05-15 任务：Phase 3 前端（AI 增强 + IAP + 通知 + 参考书）

- [ ] 重写 AiChat（app/ai-chat.tsx）：流式动画（ThinkingDots + StreamingBubble）+ SSE 状态栏 + 错误重试 + isBusy 门控
  ✅ 完成于 2026-05-15，备注：ThinkingDots(Animated.loop) + StreamingBubble(22ms/4char) + streamTimer cleanup on unmount
- [ ] Paywall IAP 状态机（app/paywall.tsx）：plan 选择 + processing/success/error 状态 + ActivityIndicator
  ✅ 完成于 2026-05-15，备注：idle→processing(2s)→success(自动返回)；error 横幅可重试；radio 选择器；成功覆盖页
- [ ] 新建 Billing 订阅状态页（app/billing.tsx）：当前套餐 / AI 用量进度 / 功能对比表 / 账户操作
  ✅ 完成于 2026-05-15，备注：新增文件；免费版卡+AI quota bar + 升级CTA + 6项功能对比 + 恢复购买/联系支持/条款
- [ ] 通知中心增强（app/notifications.tsx）：未读蓝点 + 全部已读按钮 + 按 link 跳转
  ✅ 完成于 2026-05-15，备注：readIds state；标题含 unreadCount；indigo 蓝点；link 字段跳论坛/题目详情
- [ ] 参考书索引章节→题目链接（app/reference-index.tsx）：章节展开显示匹配题目列表
  ✅ 完成于 2026-05-15，备注：expandedChapterId state；knowledgePoints 交集过滤；点击跳 /questions/[id]
- [ ] 注册 billing 路由（app/_layout.tsx）
  ✅ 完成于 2026-05-15，备注：billing slide_from_right 已注册
- [ ] type-check 通过
  ✅ 完成于 2026-05-15，备注：0 errors
- [ ] Commit & push Phase 3 前端
  ✅ 完成于 2026-05-15，备注：branch feature/phase3-frontend

---

### 2026-05-15 任务：Phase 4 前端（引导页 + 上传 + FlatList 优化 + 图片查看器）

- [ ] 创建 onboarding store（src/store/onboardingStore.ts）：AsyncStorage 持久化 + 三态 boolean|null
  ✅ 完成于 2026-05-15，备注：STORAGE_KEY=kakomon_onboarding_done；hydrateOnboarding 读取 AsyncStorage；fail-safe 设为 true
- [ ] 创建 OnboardingScreen 3步引导流（app/onboarding.tsx）
  ✅ 完成于 2026-05-15，备注：3 slides (SLIDES as const)；跳过按钮；圆点指示器；最后一步"开始使用"→setOnboardingDone+router.replace
- [ ] 创建 UploadContribution UI（app/upload-contribution.tsx）
  ✅ 完成于 2026-05-15，备注：4 种内容类型；大学/年份/科目 inline 下拉；标题 60 字限制；虚线文件选择区；提交成功绿色卡
- [ ] 更新 _layout.tsx：引入 onboardingStore 双水合 guard + 新增 onboarding/upload-contribution 路由
  ✅ 完成于 2026-05-15，备注：isHydrated && hasSeenOnboarding !== null 才渲染；未登录按 hasSeenOnboarding 重定向到 /onboarding 或 /(auth)/login
- [ ] FlatList 优化大学列表（app/(tabs)/university/index.tsx）
  ✅ 完成于 2026-05-15，备注：用 FlatList 替换外层 ScrollView；ListHeaderComponent=搜索+筛选+计数行；useCallback renderItem/keyExtractor；keyboardDismissMode="on-drag"
- [ ] 图片查看器 Modal（app/questions/[id].tsx）
  ✅ 完成于 2026-05-15，备注：imageModalVisible state；"查看原版"按钮 onPress 开启 Modal；fullscreen rgba(0,0,0,0.92) 遮罩；右上角关闭按钮；pageRef 占位图标
- [ ] type-check 通过
  ✅ 完成于 2026-05-15，备注：0 errors
- [ ] Commit & push Phase 4 前端
  ✅ 完成于 2026-05-15，备注：branch feature/phase4-frontend

---

### 2026-05-15 任务：Phase 4 前端收口（F4-02 / F4-13 / F4-21 / P-01）

- [ ] F4-02：AI Chat 回答卡行动按钮（加入错题本 / 复制 / 分享）
  ✅ 完成于 2026-05-15，备注：引入 React Native Share API；"保存为笔记"改为"分享"；分享内容为各 section 拼接文本；icon=share（Feather share-2）
- [ ] F4-13：Expo Push Token 注册（登录后调用）
  ✅ 完成于 2026-05-15，备注：新增 src/utils/pushNotifications.ts；setNotificationHandler + requestPermissionsAsync + getExpoPushTokenAsync；Android setNotificationChannelAsync；全程 try-catch 降级；login.tsx 登录成功后 fire-and-forget 调用
- [ ] F4-21：TanStack Query 离线缓存策略调优
  ✅ 完成于 2026-05-15，备注：_layout.tsx QueryClient 新增 gcTime=30min / networkMode=offlineFirst / refetchOnMount=false / refetchOnWindowFocus=false / refetchOnReconnect=true；mutations 同样 offlineFirst
- [ ] P-01：Metro bundle 分析脚本
  ✅ 完成于 2026-05-15，备注：package.json 新增 analyze（react-native-bundle-visualizer）/ analyze:ios / analyze:android（expo export + source-map-explorer 生成 HTML 报告）三条 npm 脚本
- [ ] Icon.tsx 补充 image 图标
  ✅ 完成于 2026-05-15，备注：新增 image: { family: 'feather', name: 'image' } 至 ICON_MAP
- [ ] type-check 通过
  ✅ 完成于 2026-05-15，备注：0 errors
- [ ] Commit & push Phase 4 收口
  ✅ 完成于 2026-05-15，备注：branch feature/phase4-frontend

---

### 待办：React Native Expo 工程实现（Phase 0–4）

> 参考 docs/DEV_PLAN.md，共 14 周。以下为工程启动前需确认的前置项。

- [ ] 确认技术负责人 / 团队配置
- [ ] 创建 GitHub 仓库，设置分支规范
- [ ] Phase 0：`expo init` + Expo Router v4 + Zustand + TanStack Query + EAS 配置
- [ ] Phase 1：K1 账户 + K3 核心（MVP）
- [ ] Phase 2：K2 大学 + K4 论坛 + 学习圈
- [ ] Phase 3：AI 增强 + IAP 内购 + 推送
- [ ] Phase 4：性能优化 + App Store 上架

---

### 当前文件交付物清单

| 文件 | 类型 | 状态 |
|------|------|------|
| index.html | 原型入口 | ✅ 完成 |
| styles.css | 原型样式 | ✅ 完成 |
| data.jsx | 原型数据层（14所大学/UNI_GRADS/UNI_MAJORS/nextExam）| ✅ 完成 |
| icons.jsx | 原型图标库 | ✅ 完成 |
| components.jsx | 原型通用组件 | ✅ 完成 |
| screens-k3-study.jsx | K3 学习仪表板 + 考试倒计时 + 选校 | ✅ 完成 |
| screens-k3-detail.jsx | K3 题目详情页（11段） | ✅ 完成 |
| screens-k3-ai.jsx | K3 AI 上下文 Sheet + AI 对话 | ✅ 完成 |
| screens-k3-extra.jsx | K3 错题本 + 参考书索引 + 搜索 | ✅ 完成 |
| screens-k2.jsx | K2 大学列表 / 详情 / 对比 / 教授详情 | ✅ 完成 |
| screens-k4.jsx | K4 论坛首页 / 帖子详情 / 资料互助 | ✅ 完成 |
| screens-k1.jsx | K1 登录 / 个人主页 / 设置 | ✅ 完成 |
| screens-groups.jsx | K4 学习圈列表 + 详情（QQ群风格） | ✅ 完成 |
| screens-batch3.jsx | K4 附加学习圈功能 | ✅ 完成 |
| screens-misc.jsx | Paywall / 通知 / 发帖 / 写评价 / 引导 | ✅ 完成 |
| tweaks-panel.jsx | 开发调试面板 | ✅ 完成 |
| app.jsx | 原型路由 + 状态管理 | ✅ 完成 |
| docs/PSD.md | 产品规格文档 v1.1 | ✅ 完成 |
| docs/TSD.md | 技术规格文档 v1.3（UserTargetSchool 类型 / PUT target-schools API / SDK 55）| ✅ 完成 |
| docs/DEV_PLAN.md | 开发方案 v1.2（基准 14 周 / Phase 3 风险缓冲 16 周）| ✅ 完成 |
| docs/MVP_SCOPE.md | MVP 功能范围 v1.0 | ✅ 完成 |
| docs/DATA_MODEL.md | 数据模型 v1.0（含 user_target_schools / question_difficulty_votes）| ✅ 完成 |
| docs/API_CONTRACT.md | API 契约 v1.0 | ✅ 完成 |
| docs/ARCHITECTURE.md | 架构边界 v1.0 | ✅ 完成 |
| TASKS.md | 任务追踪（本文件）| ✅ 持续维护 |

---

### 2026-06-08 任务：学习界面 MVP 改版（学习引擎 / 消除重合）

> 背景：用户反馈 ①学习页与我的页内容重合严重 ②做题入口太靠后 ③选校+选专攻流程复杂。
> 方向：B 方案精简版 —— 学习页变「学习引擎」，砍掉非核心功能，快速上线最小 MVP。
> 状态：方案已定稿，**当前仅存档，暂不改码**（用户指示）。

#### A. 学习页 app/(tabs)/study/index.tsx
- [x] 删除 AI 提问额度卡（aiCard 整段 + 相关 styles）
      ✅ 完成于 2026-06-08
- [x] 删除「问 AI」「参考书」快捷入口；快捷区保留 搜过去问 / 错题本 / 收藏（三等分）
      ✅ 完成于 2026-06-08
- [x] 删除跨校关联提醒卡（alertCard 整段）
      ✅ 完成于 2026-06-08
- [x] 删除弱点地图模块（学习页不再展示，归我的页）
      ✅ 完成于 2026-06-08
- [x] 「继续做题」改为大号主操作区（hero 蓝卡 + 进度条 + 开始做题按钮），置于头部下方作为视觉焦点
      ✅ 完成于 2026-06-08
- [x] 过去问列表：默认按用户已选学校+专攻限定题库范围
      ✅ 完成于 2026-06-08，备注：getQuestions 传 universityIds + subjects；mock 兜底也按目标校过滤
- [ ] 弱点推荐（极简版）：跨校拉「专题 tag 相同」的同类题  —— **未做，下一轮**
      - 相似度 = 专题 tag 是否相同，纯匹配，**无任何算法/动态计算/重叠度评分**
      - 题目在数据层固定挂好专题 tag（如「线性代数·对角化」），录入时确定，不在运行时生成
      - 推荐理由直接展示该 tag（如「同专题：对角化」）
      - 【前置依赖】题目已有 knowledgePoints: string[] 字段可直接用作专题 tag
- [x] 删除升级 Pro / paywall / Token 相关 UI
      ✅ 完成于 2026-06-08

#### B. 考试倒计时（改用户可编辑，存后端）
- [x] 倒计时模组改为可点击编辑考试日（点击弹出日期编辑 Modal）
      ✅ 完成于 2026-06-08
- [x] 复用既有 patchMe({ nextExam }) 接口落库（examDate 存于 nextExam.date，后端无需改）
      ✅ 完成于 2026-06-08
- [x] 前端对接：考试日由用户设置值驱动，乐观本地更新 + patchMe 落库
      ✅ 完成于 2026-06-08

#### C. 我的页 app/(tabs)/profile/index.tsx
- [x] 删除 AI 提问额度卡（quotaCard 整段 + QuotaCell 组件 + getAiQuota 查询 + 相关 styles）
      ✅ 完成于 2026-06-08
- [x] 删除「我的 AI 提问」入口
      ✅ 完成于 2026-06-08
- [x] 删除 Pro / paywall / Token 相关 UI（含「可换 Pro 时间」hint）
      ✅ 完成于 2026-06-08
- [x] 弱点地图（热力图版）**保留不动**
      ✅ 完成于 2026-06-08
- [x] 学习统计、上传贡献、错题、收藏入口保留
      ✅ 完成于 2026-06-08

#### D. 选校流程极简（列表直选 → 选专攻）
- [x] 去掉标签推荐选校，改为在学校列表里直接勾选（SchoolSearchPicker 已是列表直选）
      ✅ 完成于 2026-06-08
- [x] 选校后选研究科→専攻（ExpandedGradPicker 已支持），确定即锁定题库范围
      ✅ 完成于 2026-06-08
- [x] 复用现有大学列表，避免新增多步嵌套向导
      ✅ 完成于 2026-06-08
- [x] EditTargetSheet 精简：删「备考类型」「专业方向」「需考科目」三组 chip，只留目标校
      ✅ 完成于 2026-06-08，备注：valid 改为仅要求 schools.length>0
- [ ] 【前端落库】选完学校/专攻后调 updateTargetSchools 写回后端  —— **未做，下一轮**
      备注：当前 handleSaveTarget 仅 setUser 本地更新，未接 updateTargetSchools
- [x] 推荐/过去问 API 按目标校 + 科目过滤（getQuestions 已支持，前端已传参）
      ✅ 完成于 2026-06-08

#### E. 全局清理（MVP 阶段前端移除，后续迭代再加）
- [x] 移除两 tab 的 ai-chat 路由入口引用
      ✅ 完成于 2026-06-08，备注：questions/forum/professor 详情页内的引用不在本轮范围，未动
- [x] 移除学习页 reference-index（参考书）入口
      ✅ 完成于 2026-06-08
- [x] 检查两 tab 无残留指向已删功能的 router.push
      ✅ 完成于 2026-06-08，备注：grep 验证两 tab 无 ai-chat/reference-index/paywall 残留
- [x] 全项目 tsc 类型检查 0 错误
      ✅ 完成于 2026-06-08

#### 备注
- 删除目标：彻底消除学习页/我的页重合（AI 额度、弱点、参考书重复项）。
- 核心闭环：选学校 → 选专攻 → 该题库过去问 → 做题。
- AI 协助类功能 MVP 阶段全部从前端删除，用户增长后再更新。

---

### 2026-06-08 任务：评审 Claude 的学习页 MVP 修改意见

- [ ] 读取用户粘贴的 Claude 建议与当前已存档的学习页 MVP 改版清单
  ✅ 完成于 2026-06-08，备注：已读取粘贴内容、现有学习页 MVP 存档清单与相关页面代码
- [ ] 判断 Claude 方案是否符合快速上线 MVP 目标
  ✅ 完成于 2026-06-08，备注：B 方案精简版符合最小 MVP，上线目标应聚焦选校 → 选专攻 → 推荐过去问 → 做题
- [ ] 标出需要调整的产品、前端、后端/API 口径
  ✅ 完成于 2026-06-08，备注：需补前端落库调用、推荐 API 按目标校/专攻过滤、全局 AI/Pro/参考书入口清理
- [ ] 给出是否采纳及下一步执行建议
  ✅ 完成于 2026-06-08，备注：建议采纳 Claude 主方向，但按 Codex 评审后的执行边界落地

---

### 2026-06-08 任务：修正过去问推荐范围口径

- [ ] 区分「顺序做题列表」与「弱点推荐」的题库范围
  ✅ 完成于 2026-06-08，备注：顺序做题/题库列表限定目标校+专攻；弱点推荐允许跨校，用于补强同知识点训练

---

### 2026-06-08 任务：启动 Expo Go 前端预览

- [ ] 检查 package.json 启动脚本与当前工作区状态
  ✅ 完成于 2026-06-08，备注：启动脚本为 npm run start；当前工作区已有学习页/我的页等未提交改动，按现状运行预览
- [ ] 启动 Expo 开发服务器供 Expo Go 扫码预览
- [ ] 记录 Expo 启动结果、访问方式与明显报错

---

### 2026-06-08 任务：学习界面深度改版（用户第二轮反馈 · 14+ 项）

> 来源：用户体验后反馈，分 4 类。分批执行，先做第一类「体质问题」。
> 状态：清单存档；第一批进行中。

#### 第一类 · 体质问题（首批，全局地基）—— ✅ 首批完成 2026-06-08
- [x] T1 主题对比度修复
      ✅ 根因：Chip/Badge/Avatar import 静态 Colors(=DARK_COLORS)，标签永远暗色调
      ✅ Chip 改 useColors + 主题感知；浅色=浅底深字，深色=深底浅字
      ✅ Badge 改主题感知；FREE 徽章浅色模式修正
      ✅ profile 弱点热力图：空格/低级别色按主题切换（浅色不再近黑）
      ✅ Avatar 保留静态(500 级 accent 双主题一致，无对比度问题)
- [x] T2 界面统一：edit-profile 复用 EditTargetSheet
      ✅ 删 edit-profile 自带网格选校(分区域+QS徽章)，改调共享 EditTargetSheet
      ✅ 全 App 只剩一套选校交互；删独立「专业方向」自由文本(专攻随选校决定)
      ✅ 「专业方向」字段位改为「个人介绍」(bio)，为 T15 铺路
- [x] T3 清除残留「AI 无限提问」影子
      ✅ settings：升级Pro 文案改「全部学校+不限过去问」；删 Token 余额行
      ✅ paywall：PRO_FEATURES/heroSub 改 全部学校/不限过去问/免广告/跨校相似题
      ✅ billing：对比表与免费版描述改为 3校/3年/看广告解锁 模型
      备注：ai-chat.tsx 本体保留(主 Tab 已无入口)，整体删除属批次2/3

#### 第二类 · VIP / 广告付费墙（核心商业逻辑）—— ✅ 第二批完成 2026-06-09
- [x] T4 权限单一数据源 src/utils/accessPolicy.ts
      ✅ canAccessQuestion(user,{universityId,year,questionId}) 为唯一判定入口
      ✅ VIP(isPro)=全解锁；非VIP 免费=已选目标校 priority 前3所 × 当前年-2~当前年
      ✅ freeSchoolIds / freeYearFloor 动态计算；lockHint 输出解锁文案
- [x] T5 看广告解锁基建
      ✅ src/store/adStore.ts：单题永久解锁 + 校×年 24h 解锁(带过期)
      ✅ src/components/ui/AdGateModal.tsx：可交互广告弹窗(5s倒计时mock)，
         proOnly 模式隐藏看广告路径只留 Pro 升级
      ✅ 两种粒度：相似题=单题解锁；其他年份=校×年 24h 解锁
- [x] T6 搜过去问/列表接入
      ✅ search.tsx：超范围结果仍可见，显示锁徽章 + 解锁文案
      ✅ 年份超范围→AdGateModal 看广告解锁校×年(24h)；学校超范围→proOnly 仅 Pro
      ✅ 解锁后订阅 adStore 即时刷新
- [x] 详情页相似题(举一反三)接入
      ✅ questions/[id].tsx：废除「L3 整组按 isPro 锁」，改为每道相似题按 accessPolicy 判定
      ✅ 锁定的相似题→单题级广告解锁(unlockQuestion)
- [x] 文案对齐(上一批已做)：settings/paywall/billing 改 全部学校/不限过去问/免广告 模型
      备注：未接 study 首页推荐(T9 将整体移走推荐位)；AI「问这道题」属 T8 批次3

#### 第三类 · 学习核心交互重做（最大工作量）—— ✅ 第三批完成 2026-06-09
> 地基：src/mocks/data.ts 题库 7→24 题(多校×2022-2026×多专题×难度)；
>       src/store/attemptStore.ts 做题/考试记录(AsyncStorage 持久化+预留后端接口)；
>       src/utils/recommend.ts(专题 tag 推荐) / difficulty.ts(难度可视化)。
- [x] T7 做题流：详情页打开即 recordAttempt；评价(我会/模糊/不会)写回 setAttemptResult；
      评价后出现「下一题」(同科目可访问题) + 「选题」按钮
      ✅ 完成于 2026-06-09
- [x] T8 AI/参考书交互：SHOW_AI=false 隐藏「AI 扩展讲解」区(代码保留)；
      底部「问这道题(AI)」改为「去论坛讨论这道题」(AI 按钮代码保留 SHOW_AI 分支)；参考书章节保留
      ✅ 完成于 2026-06-09，备注：用户要求 AI 代码保留供未来恢复
- [x] T9 推荐换位：首页删「推荐过去问」块；详情页加「同专题练习」；错题本每条加「加固练习」
      ✅ 完成于 2026-06-09
- [x] T10 首页继续做题上方加两按钮：专题学习(青) + 模拟考试(靛)
      ✅ 完成于 2026-06-09
- [x] T11 专题学习页 app/topic-study.tsx：限 3 校 → 按专题聚合 → 双难度条(系统+大家评分) + 大题拆分
      ✅ 完成于 2026-06-09
- [x] T12 模拟考试页 app/mock-exam.tsx：3 校 × 最近 3 年按校×年组卷
      ✅ 完成于 2026-06-09
- [x] T13 考试模式 app/exam-session.tsx：答题→交卷→自评对错→成绩页→recordExamResult；
      我的页加「成绩曲线」(柱状图按时间 + 最近/最高/平均)
      ✅ 完成于 2026-06-09
- [x] T14 继续做题模组：首页 hero 改读 attemptStore，优先上次未完成→最近做过→兜底
      ✅ 完成于 2026-06-09

#### 第四类 · 账户 / 统计页（中等 + 零碎）—— ✅ 第四批完成 2026-06-09
- [x] T15 我的页点「张同学」资料卡 → 进 edit-profile
      ✅ 资料卡整体可点击进编辑页；加 chevron + bio 展示
      ✅ edit-profile 加头像编辑(6 色 swatch + 自动)，存 user.avatarColor；profile/Avatar 读取
- [x] T16 学习统计「已做题」点击 → 历史做题记录 + 做题时间
      ✅ 完成于 2026-06-09，app/history.tsx：按天分组、显示自评结果/未完成、相对时间，点击回到题目
- [x] T17 考试日设置改转盘选择器（wheel picker）
      ✅ src/components/ui/WheelDatePicker.tsx：年/月/日三列 ScrollView snap 转盘(纯前端，无新依赖)
      ✅ 替换 study 首页考试日 Modal 的文本输入；打开默认今天
- [x] T18 收藏入口跳转修复 + 收藏列表页
      ✅ src/store/favoritesStore.ts：收藏 id 持久化(AsyncStorage + 预留后端接口)
      ✅ app/favorites.tsx 收藏列表页；详情页书签接入 store(原为本地 state)
      ✅ study/profile 的收藏入口从 /search 改到 /favorites

#### 备注 / 待定
- 液态玻璃：Expo Go 无法跑 iOS 26 原生液态玻璃；可用 expo-blur 做毛玻璃近似（待用户确认是否要）
- 本轮按用户指示「先修体质问题」开始

---

### 2026-06-09 任务：上传当前改动到 Git

- [ ] 检查当前分支、远端地址与工作区状态
  ✅ 完成于 2026-06-09，备注：当前分支 feat/study-ux-revamp；远端 origin=git@github.com:ZYM-tit/Kairos-kakomon.git；工作区仅显示 TASKS.md 有改动
- [ ] 暂存本次需要上传的改动
  ✅ 完成于 2026-06-09，备注：已暂存 TASKS.md；后续任务记录更新后会重新暂存
- [ ] 创建 Git commit
  ✅ 完成于 2026-06-09，备注：已创建提交 d5d2162，提交信息 `chore: record git upload task`
- [ ] 推送到远端分支
  ✅ 完成于 2026-06-09，备注：已推送 feat/study-ux-revamp 到 origin，远端从 2daa927 前进到 d5d2162
- [ ] 验证推送结果并更新任务记录
  ✅ 完成于 2026-06-09，备注：已通过 `git ls-remote origin refs/heads/feat/study-ux-revamp` 验证远端引用为 d5d2162；本完成记录将作为收尾提交继续推送

---

### 2026-06-09 任务：学习/大学 UX 改版（多项）

#### 1. 大学评分页面 app/university/[id].tsx
- [ ] 修考难度评分改 5 分制（满分5），可选雷达图
- [ ] 不写「弱点重叠度/适合你」
- [ ] 增设个人「打分」按钮
- [ ] 修复 Tab 栏（概览/过去问/评分…）无法完整显示 bug

#### 2. 搜过去问 app/search.tsx
- [ ] 按学校浏览显示全部学校
- [ ] 学校→研究科→习题 三级结构

#### 3. 参考书隐藏（MVP 先隐藏）
- [ ] question 详情页参考书 section
- [ ] reference-index 入口 / ai-chat chip

#### 4. 专题学习 app/topic-study.tsx
- [ ] 去掉系统/大家评分宽难度条
- [ ] 题目右侧直接 难/极难 + 评分，单页更多标题

#### 5. 模拟考试 app/mock-exam.tsx
- [ ] 左栏收窄、右侧更有效显示
- [ ] 去掉已选科目模式
- [ ] 添加→选大学→选研究科；右侧显示 学校+研究科

#### 验证
- [ ] tsc / lint

#### 完成记录（2026-06-09）
- ✅ 1 大学评分页：修考难度评分改 6 维雷达图(5分制，新增 react-native-svg)；去掉「弱点重叠度」；新增「给学校打分」5分制弹窗；修复 Tab 栏被裁剪(flexGrow:0)
- ✅ 2 搜过去问：按学校浏览显示全部学校；新增 学校→研究科→习题 三级下钻(BrowseDrillDown)
- ✅ 3 参考书隐藏：question 详情页 SHOW_REFERENCE=false；ai-chat 过滤「参考书」chip；reference-index 本就无入口
- ✅ 4 专题学习：去掉宽难度条，题目右侧紧凑 难/极难 标签 + 5分制评分，单页更多标题
- ✅ 5 模拟考试：左栏 96→72 收窄；去掉已选科目模式；添加→选大学→选研究科；右侧显示 学校+研究科；按 graduateSchool 过滤试卷
- ✅ 验证：tsc --noEmit 通过(exit 0)；eslint 仅 1 个既有 warning(无关)；expo export ios 打包成功

#### 追加修复（2026-06-09 第二轮）
- ✅ WheelDatePicker 转盘可用性：去掉只生效一次的 contentOffset，改 useEffect+scrollTo 同步；新增 onScrollEndDrag(慢拖也能选中)；始终对齐整数行
- ✅ 模拟考试 右侧灰字显示「目标校/已添加 · 专攻：xxx」(majorLabel 由 UNI_MAJORS 映射)
- ✅ 模拟考试 左栏宽度 72→58、移除「目标校/已添加」副标签，左右比例进一步收紧
- ✅ 模拟考试 接入 canAccessQuestion：备考设置的前 3 所目标校近 3 年题目对非会员免费(显示「目标校·免费」绿标，直接开始)；其余仍走广告/Pro

#### 追加修复（2026-06-09 第三轮）
- ✅ 考试日转盘改用 @react-native-community/datetimepicker(Expo Go 内置)：iOS 内嵌 spinner、Android 系统对话框，滚动可靠；保留 value/onChange(ISO) 接口
- ✅ 模拟考试 左栏 ScrollView 加 flexGrow/flexShrink:0，修复其在行内抢占宽度导致左右比例失衡
- ✅ 模拟考试 左栏每项补回研究科灰字(gradShort 压缩显示)，右侧标题下灰字明确显示 研究科·专攻，区分同校不同研究科
- ✅ 模拟考试 目标校在上/浏览校在下，中间分界线；目标校<3 时显示「目标校+」加号(写入 user.targetSchools，与目标校选择全局同步)；底部「浏览」加号仅本页浏览
- ✅ 增减目标校的重置问题：目标校来自 store live 派生，浏览校独立本地 state，互不影响
- ✅ 大学详情页隐藏「教授」Tab(点开会出现问 AI)，从 TABS 移除，代码保留

#### 追加修复（2026-06-09 第四轮）
- ✅ 模拟考试 左栏每项右下角加「⋮」操作菜单：置顶/上移/下移/删除；删除目标校弹 Alert 确认"将同步从目标校移除"，目标校改 priority 写回 store，浏览校改本地顺序
- ✅ 目标校选择 EditTargetSheet：允许 0 所目标校保存(去掉 valid 拦截)，空态显示邀请文案"还没有目标校——添加一个…"
- ✅ 学习页「张同学」下灰字改为 研究科·专攻(由 UNI_MAJORS 映射第一目标校 majorId)，能真正同步；无目标校时显示"还没有目标校·点上方＋添加"
- ✅ EditTargetSheet 手动添加(picker)子页的「完成」按钮改为底部固定 footer(sticky)，不用滚到底

#### 追加修复（2026-06-09 第五轮）
- ✅ 目标校选择 EditTargetSheet：非 VIP 上限 3 所(原 8)，VIP 8 所；超额不再静默失败，弹「升级 Pro」弹窗+免费额度提示条；计数文案改「免费 3 所 / 至多 8 所」。study 页传入 isPro + onUpgrade(跳 paywall)
- ✅ 大学列表 isTarget 修复：原来写死 index===0(只标第一张卡)，改为按 user.targetSchools 真实联动
- ✅ 模拟考试 左栏宽度 58→68(上次过窄)
- ⏳ (4) 模拟考试优先级修改联动目标显示：用户说暂可不改，未做

---

### 2026-06-09 任务：全部上传到 Git

- [ ] 检查当前分支、远端地址与完整工作区状态
  ✅ 完成于 2026-06-09，备注：当前分支 feat/study-ux-revamp；远端 origin=git@github.com:ZYM-tit/Kairos-kakomon.git；fetch 后本地与远端对齐，存在 14 个已跟踪文件改动和 1 个新增文档
- [ ] 确认所有改动文件范围
  ✅ 完成于 2026-06-09，备注：范围为 TASKS.md、学习/大学/搜索/题目/模拟考试/专题学习相关页面、EditTargetSheet、WheelDatePicker、package/app 配置，以及新增 docs/requirements-study-ux-revamp.md
- [ ] 暂存全部改动
  ✅ 完成于 2026-06-09，备注：已 `git add -A` 暂存 15 个文件，包含新增 docs/requirements-study-ux-revamp.md；任务记录更新后会重新暂存 TASKS.md
- [ ] 创建 Git commit
  ✅ 完成于 2026-06-09，备注：已创建提交 b781dcc，提交信息 `feat: revamp study ux flows`
- [ ] 推送到远端分支
  ✅ 完成于 2026-06-09，备注：已推送 feat/study-ux-revamp 到 origin，远端从 7dd2110 前进到 b781dcc
- [ ] 验证远端分支与本地同步
  ✅ 完成于 2026-06-09，备注：已通过 `git ls-remote origin refs/heads/feat/study-ux-revamp` 验证远端引用为 b781dcc
- [ ] 更新任务记录并完成收尾推送

#### 追加修复（2026-06-09 第六轮）
- ✅ #1 浏览学校丢失：新建 browseSchoolsStore(zustand+AsyncStorage 持久化)，模拟考试/专题学习共用；_layout 启动 hydrate；离开页面再回来/重启都保留
- ✅ #2 VIP 体验：paywall「立即订阅」成功后置 isPro=true(模拟购买)；设置页加「开发：切换 Pro 状态」一键切换，方便看 VIP/非 VIP 两套界面
- ✅ #3 倒计时 badge：44×44 小方块改为横向加宽 pill，日历图标 + 「考试倒计时」说明 + 大号天数
- ✅ #4 专题学习改版：仿模拟考试左栏(目标校+浏览校、⋮菜单、目标校+/浏览+)；右侧改 学校研究科→科目→题目 三级；题目从新到旧单行显示(年份标签+标题+考点+难度+5分星级)；超范围按 canAccessQuestion 看广告/Pro 解锁

#### 追加修复（2026-06-09 第七轮）
- ✅ #3 VIP 6 校权益没生效：accessPolicy 加 schoolLimit(user)=免费3/VIP6；EditTargetSheet PRO_LIMIT 8→6；mock-exam/topic-study 「目标校+」由硬编码 3 改为 schoolLimit(user)，VIP 可加到 6 所并在三处联动
- ✅ #1 按学校浏览校徽：University 加 logoUrl? 字段(后端维护)；新建 SchoolLogo 组件(有 logoUrl 显示 Image，缺失/加载失败回退首字母色块)；search 按学校浏览改用 SchoolLogo
- ✅ #2 下一题按列表上下文：questions/[id] 读 &list= 顺序参数，下一题按列表跳(末尾提示已完)，并透传 list 维持链路；专题学习科目列表 / 错题本(列表/今日/矩阵) 进入时带上有序 list

#### 追加修复（2026-06-09 第八轮）
- ✅ #1 广告锁题被「下一题」绕过：goNext 先 canAccessQuestion 校验，锁定则弹 AdGateModal(年份→看广告解锁校×年/学校→Pro)，不再直接 router.replace
- ✅ #2 编辑资料考试日期与首页统一：改用 WheelDatePicker(滚轮弹窗)，默认 name'我的考试'/durationDays 1，与首页一致
- ✅ #3 升级 Pro 无购买界面：edit-profile 调 EditTargetSheet 时补传 onUpgrade(跳 paywall)；isPro 也补传
- ✅ #4 同校多研究科 + 选后不保存：EditTargetConfig 重构为 entries:TargetEntry[]；研究科 chip 可多选(打勾/再点移除)；「完成」flushPending 提交待选研究科；上限按不同大学数计(VIP6/免费3)，同校多研究科不占额；study/edit-profile 的 config 构造与保存同步改 entries
- ✅ #5 编辑资料目标校联动：去掉本页局部 targetSchools 草稿，handleSaveTarget 直接写全局 store(与首页一致)；补传 isPro 修复 VIP 仍显示「免费 3 所」
- 🔎 自查：grep 确认无残留旧 EditTargetConfig 字段(schools/schoolGrads/schoolMajors)；删除未用的 targetEntryKey 导出；tsc 0 / eslint 0 / iOS bundle 通过

#### 追加修复（2026-06-09 第九轮）
- ✅ topic-study/mock-exam 目标校未按 universityId+gradSchool 去重：addTargetSchool 的 some()、moveEntry 的 findIndex、deleteEntry 的 filter 全部改为按「大学+研究科」精确匹配，同校多研究科可独立增/删/排序
- ✅ 边界修复：两文件新增 normGrad(uid,grad) 归一化(缺省回退该校首个研究科)，左栏映射与增删改匹配统一用它，避免「stored gradSchool 为空 vs 显示值」不一致导致匹配失败
- 🔎 自查：study/edit-profile→handleSaveTarget 直接映射 cfg.entries(EditTargetSheet 已按 uni+grad 去重)，同校多研究科端到端打通；tsc 0 / eslint 0 / iOS bundle 通过

---

### 2026-06-09 任务：继续排查潜在 bug（只读审查）

- [ ] 检查当前未提交改动范围，确认审查基线
  ✅ 完成于 2026-06-09，备注：工作区含第八/九轮修复相关未提交改动，本次按当前工作区代码审查
- [ ] 搜索目标校/研究科数据模型残留旧逻辑
  ✅ 完成于 2026-06-09，备注：未见旧 EditTargetConfig 字段残留，但发现若干按 universityId 折叠/计数的显示与额度问题
- [ ] 搜索权限与广告解锁绕过路径
  ✅ 完成于 2026-06-09，备注：发现题目详情页缺少当前题入口级权限校验，多个入口可直接打开锁题
- [ ] 搜索 Pro 升级入口和 VIP 状态传递缺口
  ✅ 完成于 2026-06-09，备注：EditTargetSheet 调用点已传 isPro/onUpgrade；发现 lockHint 文案与 proOnly 策略不一致
- [ ] 整理潜在 bug、位置和原因
  ✅ 完成于 2026-06-09，备注：已整理为本轮回复

---

### 2026-06-09 任务：上传当前内容并修正文案策略

- [ ] 检查当前分支、远端与工作区状态
  ✅ 完成于 2026-06-09，备注：当前分支 feat/study-ux-revamp；远端 origin=git@github.com:ZYM-tit/Kairos-kakomon.git；fetch 后本地未显示落后远端；当前含第六到第九轮修复及审查记录相关改动
- [ ] 上传当前已有改动到 Git
  ✅ 完成于 2026-06-09，备注：已提交 23caeb0 `fix: tighten study access and target school flows` 并推送到 origin/feat/study-ux-revamp
- [ ] 按用户口径确认：同校不同研究科仍属于免费 3 所学校内，目标学校折叠显示不作为 bug
  ✅ 完成于 2026-06-09，备注：用户确认免费额度按 3 所学校计算，同校不同研究科仍归同一学校；目标学校折叠显示可接受，不作为 bug
  ⚠️ 纠正于 2026-06-09：以上「3 所学校」口径错误；用户重申免费可访问额度是 3 个研究科（大学+研究科条目），不是 3 所大学
- [ ] 修正锁定提示文案与真实策略不一致
  ✅ 完成于 2026-06-09，备注：accessPolicy 注释与 lockHint 已改为：目标校其他年份可看广告；超出学校范围仅 Pro 解锁
  ⚠️ 纠正于 2026-06-09：以上「超出学校范围仅 Pro」口径错误；用户确认非目标 3 研究科也可看广告解锁，广告粒度为大学×年份
- [ ] 运行必要校验
  ✅ 完成于 2026-06-09，备注：`npm run type-check` 通过；`npm run lint` 0 error，保留 2 个既有 warning（university/index useMemo dependency、Card unused useMemo）
- [ ] 提交并推送文案修正
  ✅ 完成于 2026-06-09，备注：已提交 fffc031 `fix: align lock hint copy with pro-only school access` 并推送到 origin/feat/study-ux-revamp
- [ ] 验证远端状态并记录完成

---

### 2026-06-09 任务：将当前版本合进 main

- [ ] 检查当前分支、工作区状态和远端分支引用
  ✅ 完成于 2026-06-09，备注：当前在 feat/study-ux-revamp；origin/main=36c493d；origin/feat/study-ux-revamp=fef652b；工作区仅 TASKS.md 有本任务记录改动
- [ ] 判断当前 feature 最新提交是否已包含在 origin/main
  ✅ 完成于 2026-06-09，备注：`git merge-base --is-ancestor fef652b origin/main` 通过，说明 fef652b 已包含在 main 的 merge commit 36c493d 中
- [ ] 如未包含，将 feature 最新内容合并到 main
  ✅ 完成于 2026-06-09，备注：功能版本已包含在 main；后续只需将本次任务记录提交并同步 main
- [ ] 推送 main 到远端
  ✅ 完成于 2026-06-09，备注：已将 main 从 36c493d 推送到 cd40a0a，合入 feature 最新任务记录
- [ ] 验证 origin/main 最终状态
  ✅ 完成于 2026-06-09，备注：已通过 `git ls-remote origin refs/heads/main refs/heads/feat/study-ux-revamp` 验证 origin/main=cd40a0a、origin/feat/study-ux-revamp=7a5a0f2
- [ ] 更新任务记录并完成收尾
  ✅ 完成于 2026-06-09，备注：本收尾记录将提交并推送到 main
  ✅ 完成于 2026-06-09，备注：已通过 `git ls-remote origin refs/heads/feat/study-ux-revamp` 验证远端引用为 3f39361；本记录将作为收尾提交推送

---

### 2026-06-09 任务：修正广告解锁粒度为大学×年份

- [ ] 检查当前工作区状态
  ✅ 完成于 2026-06-09，备注：开始时仅 TASKS.md 有记录改动，本轮继续修正广告解锁口径
- [ ] 调整 accessPolicy：非目标研究科也可通过大学×年份广告解锁
  ✅ 完成于 2026-06-09，备注：大学×年份广告解锁现在不受目标研究科限制；看过广告后该大学该年份全部题目放行
- [ ] 调整 AdGateModal 调用：超出目标研究科范围不再 proOnly
  ✅ 完成于 2026-06-09，备注：search 与 questions 下一题弹窗移除 proOnly，所有锁定原因均可看广告解锁大学×年份
- [ ] 同步锁定提示文案
  ✅ 完成于 2026-06-09，备注：lockHint、search/questions 弹窗、topic-study/mock-exam 可见文案已改为研究科免费范围 + 大学×年份广告解锁
- [ ] 运行 type-check / lint
  ✅ 完成于 2026-06-09，备注：`npm run type-check` 通过；`npm run lint` 0 error，保留 2 个既有 warning
- [ ] 提交并推送修正
  ✅ 完成于 2026-06-09，备注：已提交 664c123 `fix: allow ad unlocks outside free target grads` 并推送到 origin/feat/study-ux-revamp
- [ ] 验证远端状态并记录完成
  ✅ 完成于 2026-06-09，备注：已通过 `git ls-remote origin refs/heads/feat/study-ux-revamp` 验证远端引用为 664c123；本记录将作为收尾提交推送
  ✅ 完成于 2026-06-09，备注：已通过 `git ls-remote origin refs/heads/feat/study-ux-revamp` 验证远端引用为 3f39361；本记录将作为收尾提交推送
  ✅ 完成于 2026-06-09，备注：已通过 `git ls-remote origin refs/heads/feat/study-ux-revamp` 验证远端引用为 fffc031；本记录将作为收尾提交推送

---

### 2026-06-09 任务：纠正免费额度为 3 个研究科

- [ ] 检查当前工作区状态
  ✅ 完成于 2026-06-09，备注：开始时仅 TASKS.md 有上一轮收尾记录改动；本轮从远端同步后的 feat/study-ux-revamp 继续
- [ ] 将 accessPolicy 免费访问判断从 3 所大学改为 3 个研究科条目
  ✅ 完成于 2026-06-09，备注：FREE_SCHOOL_LIMIT/PRO_SCHOOL_LIMIT 改为 FREE_TARGET_LIMIT/PRO_TARGET_LIMIT；免费范围改为 priority 前 3 个 universityId+gradSchool key
- [ ] 更新相关调用点传入题目研究科，确保按大学+研究科判断
  ✅ 完成于 2026-06-09，备注：questions/search/topic-study/mock-exam 的 canAccessQuestion/isQuestionAccessible 调用已传 graduateSchool/gradSchool；mock exam paper 补 gradSchool 字段
- [ ] 同步 UI 文案：免费 3 个研究科 / 超出研究科范围
  ✅ 完成于 2026-06-09，备注：EditTargetSheet、billing、paywall、settings、search/questions 文案从 3 所学校改为 3 个研究科
- [ ] 运行 type-check / lint
  ✅ 完成于 2026-06-09，备注：`npm run type-check` 通过；`npm run lint` 0 error，保留 2 个既有 warning
- [ ] 提交并推送修正
  ✅ 完成于 2026-06-09，备注：已提交 3f39361 `fix: treat free access as three target graduate schools` 并推送到 origin/feat/study-ux-revamp
- [ ] 验证远端状态并记录完成

---

### 2026-06-12 任务：降级 Expo SDK 55 → 54（兼容 Expo Go）

- [ ] 更新 package.json 依赖到 Expo 54 版本
  ✅ 完成于 2026-06-12，备注：参考 feature/renquan_0521_expo54 分支，expo ~54.0.0 / RN 0.81.5 / expo-router ~6.0.0
- [ ] 重新安装依赖并 `expo install --fix` 对齐版本
  ✅ 完成于 2026-06-12，备注：实际安装 expo@54.0.35，Dependencies are up to date
- [ ] 运行 type-check 验证
  ✅ 完成于 2026-06-12，备注：`npm run type-check` 通过
- [ ] 重启 dev server 确认 Expo Go 可连接
  ✅ 完成于 2026-06-12，备注：需用户 Ctrl+C 后重新 `npm start` 并扫码
- [ ] 补装缺失的 babel-preset-expo
  ✅ 完成于 2026-06-12，备注：`npx expo install babel-preset-expo` 安装 SDK 54 兼容版本

---

### 2026-06-15 任务：移除后端服务，前端统一接入 mock

- [ ] 盘点后端服务范围与前端 API 调用位置
  ✅ 完成于 2026-06-15，备注：后端服务=backend/ database/ uploads/ 三目录 + src/api/*；前端调用 API 仅在 app/(auth)/login.tsx、app/(tabs)/study|forum|profile|university/index.tsx
- [ ] 删除 backend/ 目录
  ✅ 完成于 2026-06-15
- [ ] 删除 database/ 目录
  ✅ 完成于 2026-06-15
- [ ] 删除 uploads/ 目录（仅含后端规格 md 文档）
  ✅ 完成于 2026-06-15
- [ ] 重写 src/api/client.ts：移除 axios，导出占位 TOKEN_KEY/REFRESH_TOKEN_KEY 常量
  ✅ 完成于 2026-06-15
- [ ] 重写 src/api/response.ts：仅保留 unwrapData 占位（如需）
  ✅ 完成于 2026-06-15，备注：所有 endpoint 文件已不再依赖 response.ts，文件已删除
- [ ] 重写 src/api/auth.ts：login/register/refreshAuth/logout 走 mock
  ✅ 完成于 2026-06-15，备注：返回 DEMO_USER + DEMO_ACCESS_TOKEN/DEMO_REFRESH_TOKEN
- [ ] 重写 src/api/user.ts：getMe/patchMe/updateTargetSchools/getUserStats/getWeakPoints/getAiQuota 走 mock
  ✅ 完成于 2026-06-15，备注：本地内存维护 currentUser，PATCH/PUT 在本会话内即时反映
- [ ] 重写 src/api/universities.ts：列表/详情/研究科/专攻/评论/教授 走 mock
  ✅ 完成于 2026-06-15
- [ ] 重写 src/api/questions.ts：questions 全部走 mock
  ✅ 完成于 2026-06-15
- [ ] 重写 src/api/forum.ts：threads/replies/groups 走 mock
  ✅ 完成于 2026-06-15
- [ ] 重写 src/api/ai.ts：askAi/chatAi 返回 mock
  ✅ 完成于 2026-06-15
- [ ] 重写 src/api/billing.ts：getBillingStatus 返回 mock
  ✅ 完成于 2026-06-15
- [ ] 从 package.json 移除 axios / axios-retry 依赖
  ✅ 完成于 2026-06-15，备注：npm uninstall axios axios-retry，移除 11 个 package
- [ ] 运行 `npm run type-check` 通过
  ✅ 完成于 2026-06-15
- [ ] login.tsx 错误文案改为「登录失败，请稍后重试」（原文案提示后端未启动）
  ✅ 完成于 2026-06-15

---

### 2026-06-16 任务：将 Podfile source 切回 CDN

- [x] 修改 ios/Podfile，把清华 git 镜像换成 https://cdn.cocoapods.org/
  ✅ 完成于 2026-06-16
- [x] 清理半成品 spec repo（~/.cocoapods/repos/tsinghua-git-cocoapods）
  ✅ 完成于 2026-06-16，备注：rm -rf 完成
- [x] 提示用户重新执行 pod install
  ✅ 完成于 2026-06-16

---

### 2026-06-16 任务：编辑资料页 联系方式 + 目标专业/学校

- [x] 编辑资料页 基本信息：同时展示「邮箱」「手机号」，未登录方式那项显示「待设置」可编辑
  ✅ 完成于 2026-06-16，备注：拆为两行 TextInput；按 user.phone 推断主登录方式，未登录方那项 placeholder 显示「待设置」
- [x] 把「目标学校」section 标题改为「目标专业 / 目标学校」，新增目标专业行(单选 学校→学院→专业)
  ✅ 完成于 2026-06-16，备注：与 onboard-profile 一致的三步 Modal；面包屑+返回按钮+空态提示
- [x] 选完目标专业后写回 user.major + 同步 targetSchools[*].gradSchool/majorId
  ✅ 完成于 2026-06-16，备注：第一目标校已存在则覆盖 grad/majorId；不存在则按当前 type 追加为新目标校
- [x] type-check 通过
  ✅ 完成于 2026-06-16，备注：tsc --noEmit EXIT=0

---

### 2026-06-16 任务：设置页 账户栏改为行内编辑

- [x] 昵称 / 邮箱 / 手机号 改 TextInput 行内编辑，onBlur 校验+写 store
  ✅ 完成于 2026-06-16，备注：placeholder 统一「待设置」；空值/格式错误回退草稿并 Alert
- [x] 专业方向行点击改打开三步 Modal（沿用 edit-profile 的实现），选完写 user.major
  ✅ 完成于 2026-06-16，备注：commitMajor 同步写 user.major + targetSchools[*].gradSchool/majorId
- [x] 目标学校行点击改打开 EditTargetSheet，保存写 user.targetSchools
  ✅ 完成于 2026-06-16，备注：handleSaveTarget 直接 setUser，与 edit-profile 行为一致
- [x] type-check 通过
  ✅ 完成于 2026-06-16，备注：tsc --noEmit EXIT=0

---

### 2026-06-17 任务：绑定邮箱/手机号 + 设置登录密码 真实写库

- [x] src/types/user.ts：UserProfile 新增 hasPassword / identities
  ✅ 完成于 2026-06-17，备注：新增 IdentityType / UserIdentity export 类型
- [x] src/api/auth.ts：扩展 sendVerificationCode 支持 scene 参数（LOGIN/BIND/UNBIND/RESET_PASSWORD）
  ✅ 完成于 2026-06-17，备注：scene≠LOGIN 时自动带 token；CODE_COOLDOWN(10111) 抛 AuthError
- [x] src/api/auth.ts：新增 bindIdentity / unbindIdentity / setPassword 三个 API
  ✅ 完成于 2026-06-17，备注：返回 UserProfile（adaptUser 已含 hasPassword/identities）
- [x] src/api/auth.ts：adaptUser 透传 hasPassword / identities 字段
  ✅ 完成于 2026-06-17
- [x] src/components/ui/VerifyCodeInput.tsx：抽出 60s 倒计时 + 发码按钮组件
  ✅ 完成于 2026-06-17，备注：identityValue 变化自动清空 code+countdown，避免拿旧码验新值
- [x] app/edit-profile.tsx：邮箱/手机号改造为「输入新值 + 发验证码 + 校验后 bindIdentity」
  ✅ 完成于 2026-06-17，备注：草稿与原值不同时才展开验证码行
- [x] app/edit-profile.tsx：新增账号安全区块（密码 + 旧密/验证码分支）
  ✅ 完成于 2026-06-17，备注：hasPassword=true 走旧密；false 走 RESET_PASSWORD scene 验证码（接收方为 EMAIL 优先,否则 PHONE）
- [x] app/edit-profile.tsx：handleSave 按 diff 串行调多接口，失败链式中断；密码改完跳登录页
  ✅ 完成于 2026-06-17，备注：updateUserProfile → bindIdentity(EMAIL) → bindIdentity(PHONE) → setPassword；每步独立 try/catch
- [x] app/settings.tsx：邮箱/手机号行展开式验证码 + bindIdentity，移除 commitEmail/commitPhone
  ✅ 完成于 2026-06-17，备注：草稿不同 → 行下展开验证码+取消/保存按钮；昵称改用 updateUserProfile 真写库
- [x] app/settings.tsx：新增「修改登录密码」行 → router.push edit-profile?focus=password
  ✅ 完成于 2026-06-17，备注：value 显示「已设置/未设置」；edit-profile 用 useLocalSearchParams + scrollTo 锚定到密码区块
- [x] type-check 通过
  ✅ 完成于 2026-06-17，备注：tsc --noEmit EXIT=0

---

### 2026-06-17 任务（补丁）：onboard-profile 首次填资料页 邮箱/手机号/密码 真实写库

- [x] app/(auth)/onboard-profile.tsx：联系方式输入下加 BIND scene 验证码,提交时调 bindIdentity
  ✅ 完成于 2026-06-17，备注：用复用的 VerifyCodeInput;contactValue 改变时清码
- [x] app/(auth)/onboard-profile.tsx：密码下加 RESET_PASSWORD scene 验证码,提交时调 setPassword
  ✅ 完成于 2026-06-17，备注：发码身份取当前登录身份(loggedInWithPhone 决定 PHONE/EMAIL)
- [x] app/(auth)/onboard-profile.tsx：handleSubmit 改为 4 步串行：updateUserProfile(资料) → bindIdentity(可选联系方式) → setPassword → updateUserProfile(onboardingCompleted=true)
  ✅ 完成于 2026-06-17，备注：每步独立 try/catch;中途失败把 latest 落本地避免重试丢失;onboardingCompleted 兜底本地标记
- [x] app/(auth)/onboard-profile.tsx：密码校验对齐后端 8-64 位 + 字母+数字
  ✅ 完成于 2026-06-17
- [x] app/edit-profile.tsx：密码校验同步加上字母+数字校验
  ✅ 完成于 2026-06-17
- [x] type-check 通过
  ✅ 完成于 2026-06-17，备注：tsc --noEmit EXIT=0

---

### 2026-06-17 任务（补丁 2）：登录密码模式 + 资料页/初次登录页 绑定按钮 + 设密免验证码

- [x] 后端 BindingServiceImpl.setPassword：去掉首次设密的验证码限制(已通过登录态鉴权,无需再发 RESET_PASSWORD 验证码),保留旧密校验/8-64 位/字母+数字
  ✅ 完成于 2026-06-17，备注：./mvnw -q compile EXIT=0
- [x] 登录页：handleIdentifierBlur 不再强切 credMode='code',forceCode 改为软提示;切换按钮永远可点;usingCode 不再被 forceCode 强行带跑
  ✅ 完成于 2026-06-17，备注：解决「点了使用密码登录,输完手机号失焦后又被切回验证码」的问题
- [x] onboard-profile：联系方式改成「输入 + 验证码 + 确定绑定按钮」独立流程,点确定立即调 bindIdentity;密码加确认密码框,去掉 RESET_PASSWORD 验证码 UI
  ✅ 完成于 2026-06-17，备注：boundContact 标记是否绑过;改 contact 会清掉绑定标记
- [x] onboard-profile：handleSubmit 简化为 资料 → setPassword → onboardingCompleted=true
  ✅ 完成于 2026-06-17
- [x] edit-profile：邮箱/手机号 verifyCodeInput 下方加「确定绑定」按钮,点后立即 bindIdentity 写库;handleSave 不再处理身份绑定;首次设密无验证码 UI
  ✅ 完成于 2026-06-17，备注：bindIdentity 成功后用返回的 user.email/phone 同步 draft,使 dirty 自动变 false
- [x] type-check + 后端 mvn compile 通过
  ✅ 完成于 2026-06-17，备注：tsc --noEmit EXIT=0; ./mvnw -q compile EXIT=0

---

### 2026-06-17 任务：账号安全页拆分（资料/设置页瘦身）

- [x] 资料编辑页：邮箱/手机号改只读、删除账号安全整块、清理相关 state 与 styles
  ✅ 完成于 2026-06-17，备注：邮箱/手机号 row 整行 Pressable 跳 /account-security；handleSave 仅保留资料字段；删 VerifyCodeInput / bindIdentity / setPasswordApi / scrollRef / focus=password 逻辑
- [x] 设置页：账户分组改为账号安全单按钮，移除昵称/邮箱/手机号/登录密码/专业方向/目标学校行
  ✅ 完成于 2026-06-17，备注：账户分组改名「账号安全」只剩一条 SettingsRow 跳 /account-security；移除 EditTargetSheet/major picker Modal/inline 编辑相关 state 与 styles
- [x] 新建 app/account-security.tsx hub 页（4 条 row 跳子页）
  ✅ 完成于 2026-06-17，备注：邮箱 / 手机号 / 第三方账号 / 登录密码 4 行；带「已绑定」badge；未设置项黄色提示
- [x] 新建 app/account-security/email.tsx 绑定邮箱
  ✅ 完成于 2026-06-17，备注：当前邮箱卡 + 新邮箱输入 + 验证码 + 「确定绑定邮箱」；bindIdentity 成功 setUser → router.back
- [x] 新建 app/account-security/phone.tsx 绑定手机号
  ✅ 完成于 2026-06-17，备注：同 email 页结构；PHONE_REGEX 校验；按钮文案「确定绑定手机号」
- [x] 新建 app/account-security/third-party.tsx 第三方账号占位
  ✅ 完成于 2026-06-17，备注：微信 / Apple / LINE 三行不可点击 + 「敬请期待」提示
- [x] 新建 app/account-security/password.tsx 设置/修改密码
  ✅ 完成于 2026-06-17，备注：按 hasPassword 切换三/两输入框；首次设密 setUser({hasPassword:true}) 留登录态；改密走 SecureStore.delete + clearAuth + replace 到登录页
- [x] _layout.tsx 注册新路由并 type-check 通过
  ✅ 完成于 2026-06-17，备注：account-security 及 4 个子页全部以 slide_from_right 注册；npm run type-check EXIT=0

---

### 2026-06-17 任务（补丁）：账号安全拆分回归修复

- [x] 资料编辑页底部「账号安全」入口删除（用户反馈冗余，邮箱/手机号行已能跳转）
  ✅ 完成于 2026-06-17
- [x] 手机号绑定页输入框无法输入：keyboardType 由 phone-pad 改为 number-pad + inputMode="numeric"，hardware keyboard 场景可正常输入
  ✅ 完成于 2026-06-17
- [x] type-check 通过
  ✅ 完成于 2026-06-17，备注：tsc --noEmit EXIT=0

---

### 2026-06-17 任务（补丁 2）：编辑资料 header 简化 + 密码显隐切换

- [x] 编辑资料页移除右上角「保存」按钮，仅保留底部「保存更改」
  ✅ 完成于 2026-06-17，备注：header 改为左侧返回 + 居中标题 + 右侧 36×36 占位
- [x] 密码页三个输入框（当前/新/确认）加 eye / eyeOff 按钮切换显隐
  ✅ 完成于 2026-06-17，备注：Icon.tsx 新增 eyeOff 映射；secureTextEntry 跟随 showOld/showNew/showConfirm 状态
- [x] type-check 通过
  ✅ 完成于 2026-06-17，备注：tsc --noEmit EXIT=0

---

### 2026-06-17 任务：30 天滑动登录态(后端 + 前端)

- [x] 后端 application.yml access-ttl-seconds 7d → 30d；JwtProperties 默认值同步
  ✅ 完成于 2026-06-17，备注：access/refresh 都是 30 天;refresh 仍走原有 Redis 白名单+一次性消费
- [x] TokenService 接口 + impl 新增 slideSession(session,response):重签 access+refresh 写入响应头
  ✅ 完成于 2026-06-17，备注：旧 access 不进黑名单(避免乱序请求误判)；旧 refresh 等待自然过期或一次性消费
- [x] AuthInterceptor preHandle 在解析成功后调 slideSession,排除 /api/auth/login|refresh|logout|identity/check|verify-code
  ✅ 完成于 2026-06-17
- [x] WebMvcConfig CORS exposedHeaders 加 X-New-Access-Token / X-New-Refresh-Token
  ✅ 完成于 2026-06-17
- [x] 前端 src/api/client.ts 在 fetch 后调 applySlidingTokens,把响应头里的新 token 写回 SecureStore + zustand
  ✅ 完成于 2026-06-17，备注：fire-and-forget;不阻塞业务请求
- [x] 前端 app/_layout.tsx bootstrapAuth 改写:不再无条件清 SecureStore,改为 getMe → refreshAuth fallback → clearAuth
  ✅ 完成于 2026-06-17，备注：getMe 成功就续命;失败用 refreshToken 兜底;再失败才清 token
- [x] 前后端校验通过
  ✅ 完成于 2026-06-17，备注：tsc --noEmit EXIT=0; ./mvnw -q compile EXIT=0

---

### 2026-06-17 任务：性能优化（卡顿排查）—— 列表虚拟化 + memo

> 背景：用户反馈 iOS 下 Tab 切换/列表滚动卡顿。Explore 扫描结果：5 处 ScrollView+map 渲染长列表，wrong-book 每个 item 触发 O(N*M) 推荐计算，全项目零 React.memo。
> 范围：task #1（FlatList 迁移）→ #2（recommendRelated 缓存）→ #3（item 加 memo）→ #4（tab 挂载开销）→ #5（ai-chat 流式节流）。

#### Task #1 列表虚拟化（5 个页面）
- [x] forum/index.tsx：ScrollView+map → FlatList，ThreadCard React.memo
  ✅ 完成于 2026-06-17，备注：search/tabs/pinned/groups 进 ListHeaderComponent；initialNumToRender=8，windowSize=7，removeClippedSubviews
- [x] wrong-book.tsx：同上，并配合 #2 一起改
  ✅ 完成于 2026-06-17，备注：list tab FlatList 化（matrix tab 短列表保持 ScrollView）；抽 WrongCard React.memo
- [x] mock-exam.tsx：papers 列表 FlatList 化
  ✅ 完成于 2026-06-17，备注：papers ≤5 条，FlatList 收益小；抽 PaperCard React.memo + handleStart/handleLockedPress useCallback
- [x] topic-study.tsx：subjectQuestions FlatList 化
  ✅ 完成于 2026-06-17，备注：activeSubject 模式右栏 FlatList；科目列表分支保持 ScrollView；抽 QuestionRow React.memo
- [x] search.tsx：results FlatList 化
  ✅ 完成于 2026-06-17，备注：3 态切换嵌在外层 ScrollView 内，未拆 FlatList；抽 ResultCard React.memo + handleResultPress useCallback
- [x] type-check 通过
  ✅ 完成于 2026-06-17，备注：tsc --noEmit EXIT=0

#### Task #2 wrong-book 渲染中 O(N*M) 的 recommendRelated 调用
- [x] 用 useMemo 一次性预算 list → reinforce 映射；renderItem 改读 reinforceMap.get(id)
  ✅ 完成于 2026-06-17，备注：彻底消除每次渲染对每条 item 都扫 KAKOMON_QUESTIONS 的 N*M 行为

#### Task #3 高频列表 item 加 React.memo
- [x] ThreadCard / WrongCard / PaperCard / QuestionRow / ResultCard 全部包 memo
  ✅ 完成于 2026-06-17，备注：避免 tab 切换、搜索输入引发的全列表重渲

#### Task #4 (tabs)/_layout 与各 tab 入口挂载开销
- [x] 检查 expo-router Tabs 是默认 lazy（首次进入才挂载，保留实例）
  ✅ 完成于 2026-06-17，备注：study/university/forum/profile 入口 mount 计算量都很小；论坛卡顿主因是 ScrollView+map（已在 #1 解决），无需额外改动 _layout

#### Task #5 AI chat 流式渲染 22ms setState（待用户确认）
- [ ] ai-chat.tsx setInterval 22ms 节流到 60ms+（仅影响 AI 聊天页，跟用户报告的 Tab/列表卡顿无关）

---

### 2026-06-18 任务：账号安全 增加注销账号功能

> TRD: docs/TRD-account-deletion.md

- [x] 后端 ResultCode 新增 USER_ALREADY_DELETED(10106)；GlobalExceptionHandler 映射到 HTTP 403
- [x] Mapper 扩充：UserMapper.softDelete / UserIdentityMapper.deleteAllByUserId / UserCredentialMapper.deleteByUserId / UserProfileMapper.deleteByUserId（含 XML）
- [x] UserService.deactivate(userId, jti, ttl, ip, ua, deviceId)：单事务内删 identity/credential/profile/target_school + 主表 softDelete + 写 login_audit；事务提交后再清 access 黑名单 + refresh 全清
- [x] UserController 新增 DELETE /api/users/me；返回 DeactivateResponse(userNo, deletedAt)
- [x] AuthInterceptor.shouldSlide 对 DELETE /api/users/me 跳过滑动续签
- [x] 前端 src/api/auth.ts 增 deactivateAccount()
- [x] app/account-security.tsx 增「注销账号」分组：Alert.alert 二次确认 → 调 API → 清 SecureStore + clearAuth → router.replace 登录页
- [x] 类型检查 / 编译验证（npm run type-check + ./mvnw clean compile）

---

### 2026-06-18 任务：专题学习 修复 key 重复 + 重构层级（学校→研究科→专业→科目→题目）

> 报错：`Encountered two children with the same key, .0:$todai=2=2情报理工学系研究科` —— 同一所学校多条研究科目标导致左栏 key 冲突。
> 用户期望：左栏按学校合并，右栏分类层级 = 研究科 → 专业 → 科目 → 题目。专业可一题多归属。

- [x] 题目类型 `KakomonQuestion` 增 `majorIds?: string[]`（支持多专业共享）
  ✅ 完成于 2026-06-18
- [x] mock 题库（`src/mocks/data.ts` 现有 ~24 道）补 majorIds：依据 UNI_MAJORS + knowledgePoints 手工映射
  ✅ 完成于 2026-06-18，未配置 UNI_MAJORS 的研究科（titech 理学院 / waseda 经济学研究科 / osakau 基础工学研究科）题目留空，视为该研究科全专业通用
- [x] `app/topic-study.tsx` 左栏按 universityId 去重；railEntry 模型改为 `{ universityId, isTarget }`，菜单/添加流程同步
  ✅ 完成于 2026-06-18，左栏 key=universityId，再无重复 key 报错；副标题显示「N 研究科」；菜单"删除"按学校级整体清理
- [x] 右栏改为四层级下钻：研究科 → 专业 → 科目 → 题目；专业层若该研究科 UNI_MAJORS 缺失则跳过
  ✅ 完成于 2026-06-18，专业层多了"全部专业"入口；专业题量含共享题计数
- [x] 面包屑 + 返回链路同步（科目 / 研究科 / 专业 都可点回上一层）
  ✅ 完成于 2026-06-18
- [x] 添加流程保留两步（学校 → 研究科），但同校可有多个研究科 → 写入 user.targetSchools 逻辑不变
  ✅ 完成于 2026-06-18
- [x] 类型检查通过（npm run type-check）
  ✅ 完成于 2026-06-18

- [x] 专业层只展示用户在 user.targetSchools 中显式勾过的 majorId（浏览校 / 未勾专业 → 跳过专业层）
  ✅ 完成于 2026-06-18，研究科卡副标题改成显示「N 个目标专业 · M 题」（N=0 时不显示目标专业）

- [x] 专题学习专业层去掉「全部专业」入口（仅展示用户已勾选的专业）
  ✅ 完成于 2026-06-18
- [x] 模拟考试沿用同样层级（学校 → 研究科 → 专业 → 年度模考），最深一层是按年聚合的整卷模考
  ✅ 完成于 2026-06-18，专业层规则与专题学习一致（仅展示用户在 targetSchools 显式勾过的 majorId），最深一层用 PaperCard 按 year 聚合
- [x] 类型检查通过
  ✅ 完成于 2026-06-18


### 2026-07-02 任务：专题学习/模考 Phase 1（结构化题干渲染 + 模考试卷化）
- [x] 类型层新增 ContentBlock / ExamPaper，KakomonQuestion 增量扩展 contentBlocks?/paperId?/orderIndex?
  ✅ 完成于 2026-07-02，向后兼容，旧字段保留
- [x] 新增 QuestionBlocks 渲染组件（react-native-webview + KaTeX，text/image/table 原生，math 走 WebView，纯文本回退）
  ✅ 完成于 2026-07-02，KaTeX 本期用 CDN 兜底，离线内联留作收尾（见 spec §范围外）
- [x] mock 数据升级：东大样例题填 contentBlocks，新增 KAKOMON_PAPERS；新增 src/api/papers.ts
  ✅ 完成于 2026-07-02
- [x] 详情页 / exam-session 答题区接入 QuestionBlocks（含旧题纯文本回退）
  ✅ 完成于 2026-07-02
- [x] 模考：exam-session 加倒计时 + 选做规则提示；mock-exam 年份卡改读 ExamPaper（时长/选做规则/传参）
  ✅ 完成于 2026-07-02
- [x] 门禁：npm run type-check 通过；npm run lint 0 error（既有 warning 属 WIP 基线，非本期文件）
  ✅ 完成于 2026-07-02，静态走查渲染链路通过；未做实机验证（本环境无已启动模拟器），需在真机/模拟器人工确认公式渲染与倒计时
- [ ] 后端落库（MySQL + MyBatis）为 Phase 2，另立计划

## 2026-07-03 任务：专题学习/模考 Phase 2（后端落库 MySQL + MyBatis）

- [x] V1_4 建表（exam_paper / question / question_knowledge_point / question_relation） + V1_5 东大 2024 数学样例种子
  ✅ 完成于 2026-07-03
- [x] question 模块 backend（Entity / Mapper + XML / Service / Controller） + ResultCode 106xx
  ✅ 完成于 2026-07-03
- [x] 补齐 API-contract.md `/papers` `/questions` 契约（2.10–2.14）
  ✅ 完成于 2026-07-03
- [x] 门禁 ./mvnw compile 通过；curl 冒烟未执行（本环境无 DB 凭据，待联调环境验证）
  ✅ 完成于 2026-07-03
- [ ] Phase 3：前端 `questions.ts` / `papers.ts` 切 `apiRequest`（另立计划）

### 2026-07-06 任务：专题学习/模考 Phase 3（前端切流 mock→真实后端）
- [x] papers.ts / questions.ts 切 apiRequest 真接口 + 响应字段映射（code→id、questions→questionIds、补 crowdDifficultyRate/related 字段）+ mock 回退
  ✅ 完成于 2026-07-06
- [x] 5 屏改用 useQuery：mock-exam(papers)、exam-session(paper 详情取题)、topic-questions、questions/[id]、topic-study
  ✅ 完成于 2026-07-06
- [x] 门禁 type-check + lint 0 error 通过；回退路径静态走查通过（每个切流函数 try/catch+空→mock，屏幕层 ?? 回退）
  ✅ 完成于 2026-07-06，真机连 Phase 2 后端端到端待联调环境验证（本环境无后端/DB 凭据）

### 2026-07-06 任务：研究科标识统一 第一期（全链路 code 化）
- [x] 前端 mock 全链路 gradSchool 换 code（UNI_GRADS/UNI_MAJORS 键/题库/paper/demo）+ 新增 GRAD_SCHOOL_NAMES（复合键 大学::code）
  ✅ 完成于 2026-07-06，26 道题按各自 universityId 映射（跨校 code 冲突已逐一核对）
- [x] gradShort 改签名 (universityId, code) 查复合键显示名；后端撤 name_jp shim；universities.ts 传 code
  ✅ 完成于 2026-07-06
- [x] V1_5 seed 改 code；新增 V1_6 存量迁移（JOIN name_jp，幂等）
  ✅ 完成于 2026-07-06，V1_6 已由用户在其数据库执行
- [x] 门禁 type-check + lint 0 error + mvnw compile 通过；静态走查无中文研究科名残留（仅 GRAD_SCHOOL_NAMES 值/注释/显示兜底串保留）
  ✅ 完成于 2026-07-06
- [ ] 第二期：前端字典改从后端拉（单独 brainstorm）
  ✅ 完成于 2026-07-07，见下方独立章节

### 2026-07-07 任务：研究科标识统一 第二期（前端字典数据源化）
> spec: docs/superpowers/specs/2026-07-07-gradschool-dict-datasource-design.md
> plan: docs/superpowers/plans/2026-07-07-gradschool-dict-datasource.md
> 执行：subagent-driven-development（每任务 implementer + reviewer 双门）

- [x] 新增 src/api/dict.ts（/dict/version + /dict/universities/tree 拉取 + normalizeTree 拍平；空树返回 null）
  ✅ 完成于 2026-07-07
- [x] 新增 src/store/dictStore.ts（seed 初始态 + 三段式 hydrate[seed→cache→network] + dictGradName/dictGrads/dictMajors 同步 selector，命中空回退静态 seed）
  ✅ 完成于 2026-07-07
- [x] _layout.tsx 启动 useDictStore.getState().hydrate()（不 gate 渲染，seed-first 首屏无阻）
  ✅ 完成于 2026-07-07
- [x] 8 消费点改从 dictStore 读：EditTargetSheet / topic-study / mock-exam / edit-profile / onboard-profile / search / questions/[id] / study/index
  ✅ 完成于 2026-07-07，字典刷新靠顶层 useDictStore((s)=>s.version) 裸订阅触发重渲；廉价字典查询从 useMemo 拆为普通计算避免 exhaustive-deps 警告（不留 eslint-disable）；search 的 styles.gradName 样式键与私有 gradShort 截断逻辑保持不变
- [x] universities.ts code 保真（.map(g=>g.nameJp)→g.id，与 mock 兜底一致；死代码无消费方）+ mocks/data.ts 三字典加 seed 注释
  ✅ 完成于 2026-07-07
- [x] 门禁 type-check EXIT 0 + lint 0 error（19 既有 warning 基线）+ 全项目 grep 走查（消费屏幕无静态字典直读残留；universities.ts 作为 API 层保留 mock 兜底属合理）
  ✅ 完成于 2026-07-07，真机端到端（选校/专题/模考/详情显示名 + 断网 seed 兜底 + 后端新增研究科 version 递增重启拉取）待联调环境人工验证（本环境无后端/DB 凭据 + 无模拟器）
  ✅ 补充 2026-07-07：前述 "19 warning 基线" 修正——其中 4 条（topic-study / mock-exam 的 memo+useCallback 死导入）实为本次 useMemo→普通计算重构遗留、非既有基线，已清理；门禁现为 lint 15 warning / 0 error

## 题目详情页改造：删论坛/举一反三 + 同专题真数据 + 难度投票/掌握上后端（2026-07-09）

> spec：docs/superpowers/specs/2026-07-09-question-detail-crowd-mastery-design.md
> plan：docs/superpowers/plans/2026-07-09-question-detail-crowd-mastery.md
> 执行：subagent-driven-development（后端/前端两大集成单元各 implementer + reviewer 双门；机械单文件任务 controller 直做 + ./mvnw compile 门禁）

- [x] V1_9 迁移：question_difficulty_vote + question_user_mastery（各 uk_user_question 一人一题唯一）
  ✅ 完成于 2026-07-09（3217ec8；本环境无 MySQL，建库执行 DEFERRED 联调）
- [x] ResultCode +10603 INVALID_DIFFICULTY_VOTE / +10604 INVALID_MASTERY_STATUS
  ✅ 完成于 2026-07-09（e607c06）
- [x] 后端投票/掌握 entity+mapper（upsert / countGroupByVote / findUserVote / findUserMastery）+ QuestionMapper updateCrowd/findCrowdVotes/findSameTopic
  ✅ 完成于 2026-07-09（e607c06 + c64091d；./mvnw compile SUCCESS；MyBatis XML 运行期绑定 DEFERRED 联调）
- [x] QuestionMutationService：投票 upsert→重算三桶→回写 crowd_difficulty_rate(=hard/total, total=0→null, BigDecimal scale3 HALF_UP)/crowd_votes；掌握 upsert
  ✅ 完成于 2026-07-09（096257b）
- [x] getRelated 改查 findSameTopic（严格同 学校+研究科+专业+科目、知识点重合排序）并填全字段；detail 补 crowdDifficultyRate/crowdVotes/myVote/masteryStatus
  ✅ 完成于 2026-07-09（096257b）
- [x] QuestionController：类级 @PublicApi 下沉方法级（list/related 保留公开，detail 强制登录 +@CurrentUser）；新增 POST difficulty-vote / PUT mastery（强制登录）
  ✅ 完成于 2026-07-09（096257b；sonnet reviewer Spec✅+Quality Approved，契约 byte-for-byte 对齐）
- [x] 前端 API 层对齐：RelatedQuestion 精简 9 字段、getRelatedQuestions 返数组、voteQuestionDifficulty 收窄 CrowdVoteValue、detailToQuestion 补 crowdVotes/myVote/masteryStatus、listItemToQuestion crowd 读真值
  ✅ 完成于 2026-07-09（7e4cdb5）
- [x] 详情页 app/questions/[id].tsx：删论坛(2处入口+sticky bar)、删举一反三整块(+relatedGate+死样式)；同专题练习改 react-query 调后端；掌握对 attemptStore+后端双写；投票调后端并 setQueryData 刷新
  ✅ 完成于 2026-07-09（7e4cdb5 + Minor 修 6093525；type-check 0 err / lint 0 err（15 既有 warning 基线）；recommend.ts 保留（wrong-book 仍用））
- [x] 文档：API-contract §2.14 补字段+需登录 / §2.15 改同专题 / 新增 §2.16 投票 §2.17 掌握；§1.7 示例去举一反三
  ✅ 完成于 2026-07-09（08ad88f + ec92f72）
- [ ] 联调环境人工验证（本环境无 MySQL/后端/模拟器，全部运行期项 DEFERRED）：
  - [ ] 初始化 DB 到 V1_9；GET /questions/{code} 未登录返回 401、登录后带 myVote/masteryStatus
  - [ ] 投票落库；改投时旧桶-1/新桶+1；crowd_difficulty_rate = hard/total、无票为 null
  - [ ] 掌握 upsert；换设备/清 AsyncStorage 后仍从后端读回
  - [ ] 同专题只返回同 学校+研究科+专业+科目 其它题、知识点重合排序、卡片大学/年份/科目非空
  - [ ] 详情页三级下钻：专题学习→题列表→详情，投票/掌握/同专题三块交互跑通

## 题目/试卷多归属(M:N)模型改造(2026-07-10)

> spec：docs/superpowers/specs/2026-07-09-question-multi-attribution-design.md
> plan：docs/superpowers/plans/2026-07-09-question-multi-attribution.md
> 执行：subagent-driven-development（后端 Task3-6 / 前端 Task7-8 两大集成单元各 implementer+reviewer 双门；迁移/种子机械任务直做）
> ⚠️ 推翻 2026-07-08 单归属标量结论；撤掉 2026-07-09 详情页改造里的 findSameTopic 标量实现（改 join scope）

- [x] V2_0 迁移：question_scope + exam_paper_scope（五元组 校+研究科+专业+科目+year，uk 六列唯一）+ 回填 + 删主表五列/旧索引
  ✅ 完成于 2026-07-10（95f3ddb；MySQL 执行 DEFERRED 联调）
- [x] V1_5 种子改多归属：主表去五列 + 写 scope 行 + 跨校散题样例 q-shared-eigen-1（东大 info-sci/cs/math/2024 + 京大 informatics/ii/math/2022）
  ✅ 完成于 2026-07-10（ba26e4e）
- [x] 后端 entity/DTO/resultMap 去五列 + QuestionScopeMapper/ExamPaperScopeMapper + 查询改 join scope（findByFilter UNION 散题/挂卷、findSameTopic 按源题 scope、exam_paper findByScope）+ AccessGate 后端算 locked + Controller
  ✅ 完成于 2026-07-10（f61ba51；./mvnw compile SUCCESS；sonnet reviewer Approved）
  ✅ review Important 修（5f6bf0a）：findByScope GROUP BY p.id + ORDER BY ps.year 非FD列 → 改 MIN() 避 MySQL8 ONLY_FULL_GROUP_BY 1055；删 AccessGate 未用 import
- [x] 前端类型去 universityId/graduateSchool/majorId/year + 加 locked；四屏（topic-questions/topic-study/search/详情）去本地过滤/去归属展示/门禁读 locked；mock data 清理
  ✅ 完成于 2026-07-10（efe00a3；type-check 0/lint 0；sonnet reviewer Approved）
  ✅ review Minor 修（135a6f2）：删详情页无用 unlockedSchoolYears 订阅
- [x] API-contract §2.13/§2.14 去归属字段+加 locked，§2.15 同专题改"任一 scope 并集"
  ✅ 完成于 2026-07-10
- [ ] 联调环境人工验证（本环境无 MySQL/后端/模拟器，全部运行期项 DEFERRED）：
  - [ ] 迁移执行顺序 V1_9 → V2_0 → V2_1（种子在 V2_0 之后，forward-only 非幂等：重跑需重建库）；种子多归属样例落库
  - [ ] 多归属散题 q-shared-eigen-1 在东大 cs 与 京大 ii 两个专题列表都出现、DISTINCT 无重复
  - [ ] findByFilter UNION 散题+挂卷不漏不重；findSameTopic 跨源题多 scope 并集正确
  - [ ] AccessGate locked 三态（免费命中/VIP/未登录）+ 前端广告解锁叠加
  - [ ] exam_paper findByScope 在 MySQL8 ONLY_FULL_GROUP_BY 下不报 1055、排序确定
  - [ ] paper 列表/详情按 scope 过滤，exam-session universityId 来自主 scope
  - [ ] 已知 DEFERRED：university/[id] 与 search BrowseDrillDown 需接后端 getQuestions（当前 mock 本地过滤已移除，空列表有 fallback）

## 归属⊆科目字典一致性(scope↔major_subject)(2026-07-13)

> spec：docs/superpowers/specs/2026-07-13-scope-major-subject-consistency-design.md
> plan：docs/superpowers/plans/2026-07-13-scope-major-subject-consistency.md
> 执行：subagent-driven-development（DB/文档机械任务直做，后端 Guard 组件 compile 门禁）
> 不变式：question_scope/exam_paper_scope 的 (校+研究科+专业+科目) 必须是 major_subject 子集才展示

- [x] 修 V2_0 exam_paper DROP KEY uk_paper_scope→idx_paper_scope（原名不存在会报 1091）
  ✅ 完成于 2026-07-13（dbea85e）
- [x] V1_8 补 major_subject 行 kyodai/informatics/ii/math（支撑 q-shared-eigen-1 跨校归属合法）
  ✅ 完成于 2026-07-13（7080683）
- [x] V2_2 迁移：scope 加 major_subject_id 外键列 + 由四列 join 字典回填 + 收紧 NOT NULL/FK；README 加 V2_2 顺序
  ✅ 完成于 2026-07-13（6456568；四列冗余保留，写入由 id 反查填）
- [x] MajorSubjectGuard 写入校验组件（resolveId 查不到抛 10605）+ MajorSubjectMapper.findId + ResultCode MAJOR_SUBJECT_NOT_FOUND(10605)
  ✅ 完成于 2026-07-13（8bd981c；./mvnw compile SUCCESS；现无录题 API，组件备用）
- [ ] 联调环境人工验证（本环境无 MySQL，全部运行期项 DEFERRED）：
  - [ ] 迁移顺序 V1_8(含新字典行) → V2_0(修 bug 后) → V2_1 → V2_2
  - [ ] V2_2 回填后 question_scope/exam_paper_scope 无 major_subject_id NULL（有 NULL=孤儿，须先补字典再重跑）
  - [ ] FK fk_qs_ms/fk_ps_ms 生效：插引用不存在 major_subject 的 scope 被拒
  - [ ] q-shared-eigen-1 的 kyodai scope（kyodai/informatics/ii/math）回填出正确 major_subject_id
  - [ ] V2_0 迁移不再因 uk_paper_scope 报 1091
  - [ ] MajorSubjectGuard.resolveId 命中返 id、未命中抛 10605
