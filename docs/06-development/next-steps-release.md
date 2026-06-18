# Kakomon 接下来需要做什么：登录、测试、上线与数据库制作路线

**版本**：v1.0  
**日期**：2026-05-15  
**用途**：把当前项目从“可联调工程骨架”推进到“可线下测试、可 TestFlight、可上线”的执行路线。  
**参考文档**：`DEV_PLAN.md`、`DEVELOPMENT_WORK_SPLIT.md`、`API_CONTRACT.md`、`DATA_MODEL.md`、`ARCHITECTURE.md`

---

## 一、当前状态判断

当前项目已经具备：

- Expo / React Native 前端工程基础
- K1-K4 主要页面与 API 调用入口
- Express TypeScript 后端骨架
- Auth、Users、Questions、Universities、Forum、AI、Billing、Notifications、Content 的 API stub
- PostgreSQL schema migration
- Phase 4 后端基础性能、cache header、readiness、metrics、smoke test、p95 baseline

但现在还不能直接上线。当前状态更准确地说是：

> 已经具备可联调、可继续扩展的工程骨架；下一阶段重点是把 mock/stub 替换成真实数据库、真实服务、真实上线配置和真实测试流程。

---

## 二、从登录到上线还需要做什么

### 2.1 登录与账号系统

当前已有登录、注册、refresh、logout 的基础接口，但上线前必须改成生产级账号系统。

需要完成：

- 密码 hash 改为 `bcrypt` 或 `argon2`。
- `refresh_tokens` 写入 PostgreSQL。
- refresh token 支持过期、撤销、登出失效。
- 登录接口增加限流，例如同 IP 每 10 分钟最多 10 次。
- 增加忘记密码 / 重置密码流程。
- 生产环境建议增加邮箱验证。
- 前端确认 401 后自动 refresh。
- refresh 失败后强制回登录页。
- token 存储使用 SecureStore，不裸存在普通 storage。

验收标准：

- 用户可以注册、登录、退出。
- access token 过期后可以自动刷新。
- 登出后旧 refresh token 失效。
- 错误密码、过期 token、无 token 都返回明确错误。
- 前端不会因为登录态异常卡死在空白页。

---

### 2.2 K1 个人中心真实化

个人中心相关数据必须从 PostgreSQL 读取和保存，不再依赖 mock。

涉及表：

- `users`
- `user_profiles`
- `user_target_schools`
- `token_balances`
- `subscriptions`

需要完成：

- 保存和读取用户基本资料。
- 保存目标校、研究科、专攻、考试科目。
- 保存下一次考试日期。
- 返回学习统计。
- 返回 AI quota、Token 余额、Pro 状态。

验收标准：

- 用户修改资料后重新登录仍能恢复。
- 目标校配置真实落库。
- 研究科 / 专攻 / 科目选择可持久化。
- Free / Token / Pro 状态在个人中心、AI、Paywall 中一致。

---

### 2.3 K3 过去问核心流程

K3 是 MVP 的核心。上线前必须优先真实化。

需要完成：

- 题目列表从数据库读取。
- 支持按大学、年份、科目、知识点筛选。
- 题目详情返回正文、原图、解析步骤、参考书、关联题。
- 掌握状态支持 `mastered` / `unclear` / `wrong`。
- 错题本根据掌握状态自动更新。
- 收藏可新增和取消。
- 众包难度投票只允许同一用户投一次。
- 关联题支持 L1 / L2 / L3，Free 用户截断，Pro 用户全量。

涉及表：

- `questions`
- `question_knowledge_points`
- `question_explanation_steps`
- `user_mastery`
- `user_wrong_book`
- `user_bookmarks`
- `question_difficulty_votes`
- `reference_question_matches`
- `related_questions`

验收标准：

- 题目列表筛选稳定。
- 题目详情 11 个核心区块数据完整。
- 标记 wrong 后进入错题本。
- 重复难度投票返回 `409 CONFLICT`。
- Free / Pro 对 L3 关联题展示不同。

---

### 2.4 K2 大学模块

大学模块可以先以真实静态数据为主，不需要一开始就做复杂 AI。

需要完成：

- 14 所大学基础信息入库。
- 研究科列表入库。
- 专攻列表入库。
- 教授基础信息入库。
- 大学评分 / 评论入库。
- 每个大学关联过去问数量。

涉及表：

- `universities`
- `university_grad_schools`
- `university_majors`
- `university_reviews`
- `professors`
- `professor_experiences`

验收标准：

- 大学列表可以搜索和筛选。
- 大学详情包含概览、过去问、评分、教授、论坛入口。
- 教授详情基础信息可展示。
- V1 中教授 AI 摘要可以保持锁定占位，不作为上线阻塞项。

---

### 2.5 K4 论坛与学习圈

论坛上线前的重点是权限、内容安全和防刷。

需要完成：

- 发帖。
- 回帖。
- 点赞。
- 采纳。
- 按大学、题目、类型筛选。
- 学习圈列表。
- 加入学习圈。

上线前建议补充：

- 内容举报。
- 后台隐藏帖子 / 删除帖子能力。
- 基础敏感词或人工审核状态。
- 写操作限流。

涉及表：

- `forum_threads`
- `forum_replies`
- `forum_reply_upvotes`
- `study_groups`
- `group_memberships`
- `group_messages`

验收标准：

- 用户可以发帖、回帖、点赞。
- 只有楼主可以采纳回答。
- 重复点赞返回 `409 CONFLICT`。
- 学习圈 V1 可以保持静态或半静态，不需要实时聊天。

---

### 2.6 AI 功能

当前后端有 SSE 和 quota 骨架，但真实上线前还需要接入真实 AI provider。

需要完成：

- 接入真实 AI provider。
- 建立 prompt 模板和版本管理。
- AI 请求支持 SSE 流式输出。
- 免费次数用 Redis 控制。
- Token 扣费必须具备原子性。
- AI 请求失败时不应重复扣费。
- Pro 用户跳过扣费。
- 写入 `ai_sessions` 和 `ai_messages`。
- 记录 cost type：`free` / `token` / `pro`。
- 处理超时、断线、重试。

涉及表：

- `ai_sessions`
- `ai_messages`
- `token_balances`
- `token_transactions`
- `ai_daily_usage`

验收标准：

- Free 用户每天免费次数正确减少。
- Token 用户提问后余额正确减少。
- Pro 用户不扣 Token。
- SSE 断线不会导致重复扣费。
- AI 失败有明确错误和前端降级提示。

---

### 2.7 IAP / Pro / Token

IAP 是上线审核和收入相关模块，必须谨慎处理。

需要完成：

- App Store Connect 创建订阅商品和 Token 商品。
- iOS 前端接入真实 IAP 流程。
- 后端接入 Apple App Store Server API。
- 后端验证 receipt。
- 接入 Apple Server Notifications V2。
- 使用 `apple_original_transaction_id` 保证幂等。
- 处理订阅续费、过期、取消、退款。
- Token 包购买后写入 token 余额。

涉及表：

- `subscriptions`
- `token_balances`
- `token_transactions`

验收标准：

- sandbox 购买 Pro 后后端返回 `isPro=true`。
- 重复提交同一个 receipt 不重复记账。
- Token 包购买后余额增加。
- 退款 / 取消后权益正确变化。
- Free / Token / Pro 在所有页面表现一致。

---

### 2.8 通知与 Push

需要完成：

- 前端注册 Expo Push Token。
- 后端保存 push token。
- 通知列表持久化。
- 通知已读 / 全部已读。
- 考试提醒。
- 弱点提醒。
- 论坛回复提醒。
- 贡献积分提醒。

涉及表：

- `push_tokens`
- `notifications`

验收标准：

- 真机可以注册 Push Token。
- 用户能看到通知列表。
- 已读状态可以保存。
- 后端可以触发测试推送。
- Push 在真机环境验证，不只依赖模拟器。

---

### 2.9 文件上传 / 图片 / CDN

当前已有 presigned upload/read 基础能力，但上线前还需要接入真实对象存储和 CDN。

需要完成：

- 配置真实 S3 bucket。
- 配置 CDN 域名。
- 限制上传文件类型。
- 限制上传文件大小。
- 图片压缩或缩略图策略。
- 用户上传内容进入审核状态。
- 只有审核通过的内容可以展示。
- CDN cache header 确认。

涉及表：

- `content_contributions`
- 后续可补 `content_assets` 或 `uploads` 表，用于更精确管理对象存储资源。

验收标准：

- 前端可以拿到 presigned upload URL。
- 上传后可以 confirm。
- confirmed 内容可以生成 CDN 或 signed read URL。
- 未审核内容不会直接进入正式题目展示。

---

### 2.10 线下测试 / 内测流程

建议按以下顺序推进：

1. 本地开发测试：Expo dev build + local/staging API。
2. 后端 smoke test：K1-K4 + AI + IAP stub。
3. 真机测试：iPhone SE、普通 iPhone、大屏 iPhone。
4. 网络测试：弱网、断网、切后台、重新打开。
5. 数据边界测试：Free / Token / Pro、无数据、超长文本、重复投票。
6. TestFlight 小范围测试：10-20 人。
7. 修复 crash、埋点、日志、体验问题。
8. 扩大 TestFlight：50-100 人。
9. 准备 App Store 审核。

必须覆盖的场景：

- 注册、登录、登出。
- 目标校设置。
- 题目列表筛选。
- 题目详情浏览。
- 掌握状态标记。
- 错题本。
- AI 提问。
- Free / Token / Pro 权限差异。
- IAP sandbox 购买。
- 论坛发帖、回帖、点赞、采纳。
- 通知列表和 Push。
- 图片上传和读取。

---

### 2.11 上线准备

上线前需要完成：

- 生产 API 域名和 HTTPS。
- 生产 PostgreSQL。
- 生产 Redis。
- 生产 S3/CDN。
- Sentry / 日志 / metrics。
- 隐私政策页面。
- 用户协议页面。
- 版权声明，尤其是过去问内容。
- App Store Connect 商品配置。
- App Store 截图。
- 应用描述。
- 关键词。
- EAS production build。
- TestFlight 审核。
- App Store 正式提交。
- 灰度发布：10% -> 50% -> 100%。

上线前阻塞项：

- 数据库 migration 必须可以从空库完整执行。
- CI 必须通过。
- 核心 smoke test 必须通过。
- IAP sandbox 必须通过。
- 真机测试必须通过。
- 关键页面不能有明显文字溢出或遮挡。
- API 错误码必须和 `API_CONTRACT.md` 一致。

---

## 三、数据库制作需要做什么

### 3.1 数据库技术栈

建议继续使用：

- PostgreSQL 16：主数据库。
- Redis 7：AI quota、限流、短期缓存。
- S3/CDN：题目图片、参考书页面、用户上传材料。
- SQL migration：继续使用 `database/migrations/V{n}__*.sql`。

这个项目的数据模型比较清楚，且未来查询会偏复杂，所以 SQL migration 比轻量 ORM 自动迁移更稳。

---

### 3.2 数据库环境

至少需要三套数据库：

| 环境 | 用途 | 说明 |
|------|------|------|
| local | 本地开发 | 可以随时重置 |
| staging | 线下测试 / TestFlight | 模拟生产，但可清理 |
| production | 正式上线 | 严格备份、权限隔离 |

原则：

- TestFlight 不直接连生产库。
- staging 数据可以脱敏或重建。
- production 不允许随意跑破坏性脚本。
- 所有 schema 变更必须走 migration。

---

### 3.3 Migration 落地

当前已有：

- `database/migrations/V1__initial_schema.sql`
- `database/migrations/V2__phase4_performance_indexes.sql`

下一步需要：

- 确认空 PostgreSQL 可以一次性跑完所有 migration。
- 确认 extension 可用：`uuid-ossp`、`vector`、`pg_bigm`。
- 确认所有外键、唯一约束、索引正常创建。
- 把 migration 接入部署流程或 CI 检查。

验收标准：

- 从空库执行 migration 成功。
- 重复执行不会破坏数据。
- 新增字段只追加 migration，不修改已发布 migration。
- 高风险操作，例如 drop column，需要单独审核。

---

### 3.4 Seed 数据

Seed 分两类。

开发 / 测试 seed：

- demo 用户。
- 14 所大学。
- 研究科。
- 专攻。
- 参考书。
- 10-50 道样例题。
- 论坛样例帖子。
- 学习圈样例。

正式内容 seed：

- 真实大学资料。
- 真实研究科 / 专攻。
- 正式过去问题目。
- 标准解析。
- 知识点标签。
- 参考书章节匹配。
- 关联题关系。

原则：

- 开发 seed 和正式内容不要混。
- 正式内容必须有审核流程。
- 正式题目内容建议通过 import script 导入。

---

### 3.5 表落地顺序

建议按以下顺序从 mock 切换到真实数据库：

1. `users`
2. `user_profiles`
3. `refresh_tokens`
4. `universities`
5. `university_grad_schools`
6. `university_majors`
7. `questions`
8. `question_knowledge_points`
9. `question_explanation_steps`
10. `user_mastery`
11. `user_wrong_book`
12. `user_bookmarks`
13. `question_difficulty_votes`
14. `reference_books`
15. `reference_chapters`
16. `reference_question_matches`
17. `related_questions`
18. `forum_threads`
19. `forum_replies`
20. `subscriptions`
21. `token_balances`
22. `token_transactions`
23. `ai_sessions`
24. `ai_messages`
25. `notifications`
26. `content_contributions`

原因：

- 先用户。
- 再内容。
- 再用户行为。
- 最后支付、AI、通知和运营内容。

---

### 3.6 Repository 层改造

当前后端大量接口仍然从 mock 或内存数据读取。下一步需要增加 repository 层。

建议目录：

```text
backend/src/repositories/
  authRepository.ts
  usersRepository.ts
  questionsRepository.ts
  universitiesRepository.ts
  forumRepository.ts
  billingRepository.ts
  aiRepository.ts
  notificationsRepository.ts
  contentRepository.ts
```

推荐调用结构：

```text
route -> service -> repository -> database
```

示例：

```text
POST /questions/:id/mastery
-> questionsService.updateMastery()
-> questionsRepository.upsertUserMastery()
-> PostgreSQL transaction
```

原则：

- route 层只处理 request / response。
- service 层处理业务规则。
- repository 层处理 SQL。
- 不让 route 直接拼 SQL。

---

### 3.7 必须使用事务的地方

以下操作必须使用 PostgreSQL transaction：

- 注册用户：`users` + `user_profiles` + `token_balances`。
- 修改掌握状态：`user_mastery` + `user_wrong_book` + 用户统计。
- AI 提问：quota 检查 + token 扣费 + session 写入 + message 写入。
- IAP 验证：receipt 幂等检查 + subscription/token 更新 + transaction 记录。
- 上传确认：content contribution + contributor points + notification。
- 采纳回答：reply accepted + thread hasAcceptedAnswer + material_request_status。

重点原则：

- AI 不能重复扣费。
- IAP 不能重复记账。
- 用户行为写入失败时不能留下半完成状态。

---

### 3.8 索引与性能

当前已有基础索引和 Phase 4 性能索引。后续要围绕真实查询继续验证。

重点查询：

- 题目列表：`university_id + year + subject`
- 题目搜索：标题 / 正文中日文搜索
- 错题本：`user_id + next_review_at`
- 掌握状态：`user_id + status`
- 论坛：`type + last_activity_at`
- 大学论坛：`university_id + last_activity_at`
- 通知：`user_id + is_read + created_at`
- 订阅：`user_id + expires_at WHERE status='active'`

上线前需要：

- 用接近真实的数据量跑 `EXPLAIN ANALYZE`。
- 确认 p95 API 响应小于 300ms。
- 对慢查询补索引或调整查询。
- 对大列表强制分页。

---

### 3.9 正式内容数据制作

这个项目真正重的部分是内容制作，不只是建表。

每道过去问至少需要：

- 大学。
- 研究科。
- 年份。
- 科目。
- 题号。
- 题目标题。
- 改写后的题干。
- 原图 URL，可选。
- 知识点标签。
- 难度。
- 标准解析步骤。
- 参考书章节匹配。
- L1 / L2 / L3 关联题。

建议制作导入模板：

```text
questions_import.csv
explanation_steps.csv
knowledge_points.csv
reference_matches.csv
related_questions.csv
```

也可以用 JSON：

```json
{
  "question": {},
  "knowledgePoints": [],
  "explanationSteps": [],
  "referenceMatches": [],
  "relatedQuestions": []
}
```

导入前校验：

- `university_id` 是否存在。
- `subject` 是否合法。
- `year` 是否合理。
- question id 是否重复。
- reference chapter 是否存在。
- related question 是否存在。
- 文本是否为空。
- 图片 URL 是否可访问。

---

### 3.10 数据审核和后台能力

上线前不一定要有完整后台页面，但至少需要安全的 admin scripts。

最低要求：

- 导入题目。
- 修改题目。
- 隐藏题目。
- 审核用户上传内容。
- 审核论坛帖子。
- 手动设置用户 Pro / Token，用于客服和测试。
- 查看 IAP transaction。
- 查看 AI 消耗记录。

后续可以升级为管理后台：

- 内容管理。
- 用户管理。
- 论坛管理。
- 付费记录。
- AI 成本看板。
- 内容贡献审核。

---

## 四、推荐实际执行顺序

建议下一阶段按下面顺序执行：

1. 搭 PostgreSQL 连接层和 repository 基础。
2. 把 Auth 从 mock 切到 DB。
3. 把 Users / Profile / TargetSchools 切到 DB。
4. 把 Universities / Questions 切到 DB。
5. 把 Mastery / WrongBook / Favorite / Vote 切到 DB。
6. 把 Forum 切到 DB。
7. 把 Billing / IAP 切到 DB。
8. 把 AI sessions / messages / token 扣费切到 DB + Redis。
9. 把 Notifications / Push 切到 DB。
10. 建 staging 环境。
11. 做 TestFlight 小范围测试。
12. 做 App Store 上线审核。

---

## 五、Claude / Codex 分工建议

Claude 继续负责：

- 登录、注册、个人中心页面体验。
- K1-K4 页面接真实 API。
- Loading / Empty / Error 状态。
- Free / Token / Pro 展示一致性。
- 真机适配。
- TestFlight 反馈中的 UI 和交互修复。

Codex 继续负责：

- PostgreSQL repository。
- Auth 真实化。
- API 从 mock 切 DB。
- migration / seed / import script。
- AI quota 和 token 扣费。
- IAP receipt 验证。
- Push / notifications 后端。
- CI、smoke test、perf baseline。
- staging / production 后端部署检查。

共同验收：

- 每个页面不直接依赖 mock。
- 每个 API 字段来自 `API_CONTRACT.md`。
- 每个持久化字段来自 `DATA_MODEL.md`。
- 所有关键流程有 smoke test 或手动验收记录。

---

## 六、一句话结论

现在项目已经过了“能不能搭起来”的阶段。下一阶段的核心是：

> mock -> 真实数据库 -> staging 联调 -> TestFlight 真机测试 -> App Store 上线。

数据库是接下来最重要的主线。只有 Auth、题目、用户学习状态、支付、AI 计费都真实落库后，这个产品才算真正进入可测试和可上线阶段。
