# Kakomon Phase 1-4 后端内容完成说明

**版本**：v1.0  
**日期**：2026-05-15  
**用途**：集中记录 Phase 1-4 后端已经覆盖的能力、接口、数据库范围、验收方式，以及从 stub 走向生产级后端仍需补齐的事项。  
**适用角色**：Codex、后端工程师、QA、Claude 前端接入时参考。  

---

## 一、状态总览

当前后端已经完成 Phase 1-4 的**可联调后端骨架**：

- Express + TypeScript 后端项目。
- `/api/v1` 统一版本路径。
- JWT auth middleware。
- Auth / Users / Questions / Universities / Forum / AI / Billing / References / Notifications / Content 路由。
- PostgreSQL schema migration。
- Phase 4 性能索引 migration。
- S3 presigned upload / read URL stub。
- Redis client / AI quota 基础能力。
- SSE AI stream stub。
- IAP receipt verify stub。
- Push notification stub。
- request id、response time、metrics、readiness。
- backend smoke test。
- API p95 baseline。
- GitHub Actions backend CI。

但当前后端仍以 mock / in-memory 数据为主。它的定位是：

> Phase 1-4 后端接口契约、工程骨架、联调路径和测试基线完成；生产级数据库落地、真实 AI、真实 IAP、真实 Push、正式内容导入仍属于下一阶段。

---

## 二、Phase 1 后端内容：K1 账号 + K3 核心学习

### 2.1 目标

Phase 1 后端负责让 MVP 主流程可联调：

- 登录 / 注册 / 刷新 / 登出。
- 用户资料。
- 目标校。
- 学习统计。
- AI quota。
- Billing 状态 stub。
- 题目列表。
- 题目详情。
- 掌握状态。
- 错题本。
- 收藏。
- 难度投票。
- AI 问答 stub。

---

### 2.2 已实现接口

Auth：

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

Users：

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `PUT /api/v1/users/me/target-schools`
- `GET /api/v1/users/me/stats`
- `GET /api/v1/users/me/weak-points`
- `GET /api/v1/users/me/ai-quota`

Billing stub：

- `GET /api/v1/billing/status`

Questions：

- `GET /api/v1/questions`
- `GET /api/v1/questions/recommendations`
- `GET /api/v1/questions/wrong-book`
- `GET /api/v1/questions/knowledge-matrix`
- `GET /api/v1/questions/:id`
- `GET /api/v1/questions/:id/related`
- `POST /api/v1/questions/:id/mastery`
- `POST /api/v1/questions/:id/vote`
- `POST /api/v1/questions/:id/favorite`

AI：

- `POST /api/v1/ai/ask`
- `POST /api/v1/ai/chat/:sessionId`

---

### 2.3 涉及后端文件

- `backend/src/routes/auth.ts`
- `backend/src/routes/users.ts`
- `backend/src/routes/billing.ts`
- `backend/src/routes/questions.ts`
- `backend/src/routes/ai.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/data/mockStore.ts`
- `src/api/auth.ts`
- `src/api/user.ts`
- `src/api/billing.ts`
- `src/api/questions.ts`
- `src/api/ai.ts`
- `src/api/response.ts`

---

### 2.4 涉及数据库表

Phase 1 生产级落地时主要对应：

- `users`
- `user_profiles`
- `user_target_schools`
- `refresh_tokens`
- `token_balances`
- `token_transactions`
- `ai_daily_usage`
- `questions`
- `question_knowledge_points`
- `question_explanation_steps`
- `user_mastery`
- `user_bookmarks`
- `user_wrong_book`
- `question_difficulty_votes`
- `related_questions`
- `ai_sessions`
- `ai_messages`

---

### 2.5 当前完成标准

当前已经满足：

- 前端可以登录、注册并拿到 token。
- 受保护接口需要 Bearer token。
- 用户资料和学习统计有稳定响应结构。
- 题目列表支持分页、学校、科目、知识点、年份、关键词筛选。
- 题目详情可返回完整 mock 数据。
- 掌握状态、投票、收藏接口可联调。
- 重复难度投票返回 `409 CONFLICT`。
- Free / Token / Pro 的 AI quota 响应结构已经固定。

---

### 2.6 生产化待补

Phase 1 真正生产级还需要：

- 密码 hash 改为 `bcrypt` 或 `argon2`。
- refresh token 写入 PostgreSQL。
- Auth 限流。
- 用户资料、目标校、统计全部从 DB 读写。
- Questions 从 DB 读取，不再依赖 `mockStore.ts`。
- `POST /questions/:id/mastery` 使用 transaction 更新 `user_mastery` 和 `user_wrong_book`。
- AI quota 接 Redis，并把审计写入 PostgreSQL。
- AI session / message 落库。

---

## 三、Phase 2 后端内容：K2 大学 + K4 论坛

### 3.1 目标

Phase 2 后端负责补齐大学模块和论坛模块：

- 大学列表。
- 大学详情。
- 研究科。
- 专攻。
- 评分和评论。
- 教授基础信息。
- 论坛帖子。
- 论坛回复。
- 点赞。
- 采纳。
- 学习圈列表。
- 加入学习圈。

---

### 3.2 已实现接口

Universities：

- `GET /api/v1/universities`
- `GET /api/v1/universities/:id`
- `GET /api/v1/universities/grads/:id`
- `GET /api/v1/universities/majors`
- `GET /api/v1/universities/:id/reviews`
- `POST /api/v1/universities/:id/reviews`
- `GET /api/v1/universities/:id/professors`
- `GET /api/v1/universities/professors/:name`

Forum：

- `GET /api/v1/forum/threads`
- `POST /api/v1/forum/threads`
- `GET /api/v1/forum/threads/:id`
- `GET /api/v1/forum/threads/:id/replies`
- `POST /api/v1/forum/threads/:id/replies`
- `POST /api/v1/forum/threads/:id/replies/:replyId/upvote`
- `POST /api/v1/forum/threads/:id/replies/:replyId/accept`
- `GET /api/v1/forum/groups`
- `POST /api/v1/forum/groups/:id/join`

---

### 3.3 涉及后端文件

- `backend/src/routes/universities.ts`
- `backend/src/routes/forum.ts`
- `backend/src/data/phase2Mock.ts`
- `src/api/universities.ts`
- `src/api/forum.ts`

---

### 3.4 涉及数据库表

Phase 2 生产级落地时主要对应：

- `universities`
- `university_grad_schools`
- `university_majors`
- `university_reviews`
- `professors`
- `professor_experiences`
- `forum_threads`
- `forum_replies`
- `forum_reply_upvotes`
- `study_groups`
- `group_memberships`
- `group_messages`

---

### 3.5 当前完成标准

当前已经满足：

- 大学列表支持 regionGroup、type、keyword。
- 大学详情返回 gradSchools、reviews、professors。
- 研究科和专攻接口可供前端目标校选择复用。
- 教授详情可以按姓名查询。
- 帖子列表支持 type、universityId、questionId、keyword。
- 发帖、回帖、点赞、采纳接口可联调。
- 重复点赞返回 `409 CONFLICT`。
- 非楼主采纳返回 `403 FORBIDDEN`。
- 学习圈列表和加入接口可联调。

---

### 3.6 生产化待补

Phase 2 真正生产级还需要：

- Universities / Professors / Reviews 从 DB 查询。
- Forum 发帖和回帖写入 DB。
- 点赞使用唯一约束保证幂等。
- 采纳回答使用 transaction 更新 reply 和 thread。
- 加入学习圈写入 `group_memberships`。
- 帖子增加审核 / 隐藏 / 删除状态。
- 写操作加限流。
- 增加举报或内容审核入口。

---

## 四、Phase 3 后端内容：AI 增强 + IAP + 通知 + 内容上传

### 4.1 目标

Phase 3 后端负责增强商业化和平台能力：

- AI SSE 流式输出。
- 参考书索引。
- 章节关联题。
- IAP 商品列表。
- IAP receipt 验证 stub。
- restore purchases。
- App Store Server Notifications 入口。
- 通知中心。
- Push token 注册。
- 测试推送。
- S3 presigned upload。
- 上传确认。
- 贡献积分。

---

### 4.2 已实现接口

AI：

- `POST /api/v1/ai/ask/stream`

References：

- `GET /api/v1/references/books`
- `GET /api/v1/references/books/:id`
- `GET /api/v1/references/books/:id/chapters/:chapterId/questions`

Billing / IAP：

- `GET /api/v1/billing/products`
- `POST /api/v1/billing/iap/verify`
- `POST /api/v1/billing/restore`
- `POST /api/v1/billing/app-store/notifications`

Notifications：

- `GET /api/v1/users/me/notifications`
- `PATCH /api/v1/users/me/notifications/read-all`
- `PATCH /api/v1/users/me/notifications/:id/read`
- `POST /api/v1/users/me/push-token`
- `POST /api/v1/notifications/test`

Content：

- `POST /api/v1/content/presigned-url`
- `POST /api/v1/content/confirm-upload`

---

### 4.3 涉及后端文件

- `backend/src/routes/ai.ts`
- `backend/src/services/aiGateway.ts`
- `backend/src/routes/references.ts`
- `backend/src/routes/billing.ts`
- `backend/src/routes/notifications.ts`
- `backend/src/services/push.ts`
- `backend/src/routes/content.ts`
- `backend/src/services/storage.ts`
- `backend/src/data/phase3Mock.ts`

---

### 4.4 涉及数据库表

Phase 3 生产级落地时主要对应：

- `reference_books`
- `reference_chapters`
- `reference_question_matches`
- `ai_sessions`
- `ai_messages`
- `subscriptions`
- `token_balances`
- `token_transactions`
- `push_tokens`
- `notifications`
- `content_contributions`

---

### 4.5 当前完成标准

当前已经满足：

- SSE endpoint 会输出 `meta`、`delta`、`done` 事件。
- AI gateway 已抽象，后续可替换真实 provider。
- 参考书和章节关联题 API 可联调。
- IAP 商品列表和验证接口结构已固定。
- `originalTransactionId` 支持幂等验证 stub。
- restore purchases 有稳定响应结构。
- App Store notification webhook 有入口。
- 通知列表、已读、全部已读可联调。
- Push token 可注册。
- 测试通知可触发 mock push。
- S3 presigned upload 在无凭证时返回 mock URL。
- 上传确认后增加贡献积分并创建通知。

---

### 4.6 生产化待补

Phase 3 真正生产级还需要：

- 接入真实 AI provider。
- AI prompt 模板版本化。
- AI token 扣费用 DB transaction + Redis quota 保证原子性。
- 接入 Apple App Store Server API。
- 解析和验证真实 receipt / signed transaction。
- 处理 Apple Server Notifications V2 的订阅续费、过期、退款、取消。
- Push 接真实 Expo Push API。
- 通知写入 PostgreSQL。
- S3 bucket / CDN 生产配置。
- 上传文件类型、大小、审核状态校验。

---

## 五、Phase 4 后端内容：性能 + 缓存 + 发布校验

### 5.1 目标

Phase 4 后端负责让后端具备可测试、可监控、可发布的基础能力：

- 请求 ID。
- 响应耗时。
- readiness。
- metrics。
- cache header。
- CDN / signed read URL。
- PostgreSQL 性能索引。
- 后端 smoke test。
- API p95 baseline。
- CI 接入 smoke/perf。

---

### 5.2 已实现接口与能力

Health / Observability：

- `GET /api/v1/health`
- `GET /api/v1/ready`
- `GET /api/v1/metrics`
- `x-request-id`
- `x-response-time-ms`

Content read：

- `GET /api/v1/content/uploads/:id`
- `GET /api/v1/content/assets/:uploadId`

Cache：

- Universities GET routes：public cache header。
- References GET routes：public cache header。
- Questions GET routes：private cache header。
- Content asset GET routes：private cache header 或 CDN public cache。
- 非 GET 写操作：`Cache-Control: no-store`。

Performance：

- `database/migrations/V2__phase4_performance_indexes.sql`
- `backend/scripts/smoke-test.mjs`
- `backend/scripts/perf-baseline.mjs`
- `npm run smoke`
- `npm run perf:baseline`
- CI backend job 运行 smoke 和 perf baseline。

---

### 5.3 涉及后端文件

- `backend/src/middleware/observability.ts`
- `backend/src/middleware/cache.ts`
- `backend/src/routes/health.ts`
- `backend/src/routes/content.ts`
- `backend/src/services/storage.ts`
- `backend/scripts/smoke-test.mjs`
- `backend/scripts/perf-baseline.mjs`
- `.github/workflows/ci.yml`
- `database/migrations/V2__phase4_performance_indexes.sql`

---

### 5.4 涉及数据库索引

Phase 4 新增索引：

- `idx_questions_university_year_subject`
- `idx_questions_subject_year`
- `idx_questions_university_subject_difficulty`
- `idx_reference_question_matches_question_chapter`
- `idx_forum_threads_university_activity`
- `idx_forum_threads_question_activity`
- `idx_notifications_user_unread_time`
- `idx_content_contributions_user_status_time`

---

### 5.5 当前完成标准

当前已经满足：

- 每个请求有 request id。
- metrics 可以返回 total requests、status counts、latency p50/p95、route metrics。
- readiness 可以用于部署平台健康判断。
- GET 路由有基础 cache header。
- 内容资源可以返回 CDN URL 或 signed read URL。
- 后端 smoke test 覆盖 K1-K4、AI、IAP、通知、内容上传。
- p95 baseline 默认阈值 300ms。
- 当前 mock 环境 p95 已低于 300ms。

---

### 5.6 生产化待补

Phase 4 真正生产级还需要：

- metrics 接入实际监控系统。
- 日志接入集中式 log platform。
- request id 贯穿前端、网关、后端、数据库慢查询。
- 真实数据量下重新跑 p95 baseline。
- `EXPLAIN ANALYZE` 校验核心查询。
- CDN 生产域名和 cache invalidation 策略。
- 部署平台接 `/ready` 和 `/health`。

---

## 六、Phase 1-4 后端完成度矩阵

| 阶段 | 后端模块 | 当前状态 | 可联调 | 生产级 |
|------|----------|----------|--------|--------|
| Phase 1 | Auth | stub 完成 | 是 | 否 |
| Phase 1 | Users/Profile | stub 完成 | 是 | 否 |
| Phase 1 | Questions/K3 | stub 完成 | 是 | 否 |
| Phase 1 | AI ask/chat | stub 完成 | 是 | 否 |
| Phase 2 | Universities/K2 | stub 完成 | 是 | 否 |
| Phase 2 | Forum/K4 | stub 完成 | 是 | 否 |
| Phase 2 | Study Groups | stub 完成 | 是 | 否 |
| Phase 3 | SSE AI | 骨架完成 | 是 | 否 |
| Phase 3 | References | stub 完成 | 是 | 否 |
| Phase 3 | IAP | 验证 stub 完成 | 是 | 否 |
| Phase 3 | Notifications/Push | stub 完成 | 是 | 否 |
| Phase 3 | S3 upload | presigned stub 完成 | 是 | 否 |
| Phase 4 | Observability | 基础完成 | 是 | 部分 |
| Phase 4 | Cache/CDN read | 基础完成 | 是 | 部分 |
| Phase 4 | DB indexes | migration 完成 | 是 | 需真数据验证 |
| Phase 4 | Smoke/perf CI | 完成 | 是 | 需真实环境验证 |

---

## 七、后端下一步真实完成路线

如果目标是“生产级后端完成”，下一步应按这个顺序推进：

1. 建 PostgreSQL 连接层。
2. 建 repository 层。
3. Auth 从 mock 切 DB。
4. Users/Profile/TargetSchools 从 mock 切 DB。
5. Universities/Questions 从 mock 切 DB。
6. Mastery/WrongBook/Favorite/Vote 从 mock 切 DB。
7. Forum 从 mock 切 DB。
8. Billing/IAP 从 mock/stub 切真实 Apple 验证。
9. AI 从 mock gateway 切真实 provider。
10. AI quota/token 计费用 Redis + PostgreSQL transaction 落地。
11. Notifications/Push 从 mock 切真实服务。
12. Content upload 从 mock URL 切真实 S3/CDN。
13. Admin/import scripts 支持正式内容导入。
14. staging 环境跑真实 smoke/perf。
15. TestFlight 前完成安全、限流、备份、监控。

---

## 八、验收命令

当前后端骨架验收命令：

```bash
cd backend
npm run type-check
npm run build
npm run smoke
npm run perf:baseline
npm test
```

根工程联动检查：

```bash
npm run type-check
npm run lint
npm run build-check
```

---

## 九、结论

Phase 1-4 后端内容已经完成到“可联调、可验证、可继续接生产服务”的阶段。

当前不能把它称为“生产后端全部完成”，因为以下关键部分仍是 stub 或 mock：

- 真实 PostgreSQL repository。
- 真实 Auth 安全策略。
- 真实 AI provider。
- 真实 Apple IAP 验证。
- 真实 Expo Push。
- 真实 S3/CDN。
- 正式内容导入和审核。

因此后续描述建议统一使用：

> Phase 1-4 后端骨架完成；生产级后端下一步进入 DB 化、真实服务接入和 staging 验证阶段。
