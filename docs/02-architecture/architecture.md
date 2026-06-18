# Kakomon · 架构边界文档（ARCHITECTURE）

**版本：** v1.0  
**日期：** 2026-05-14  
**用途：** 定义模块边界，防止跨模块能力（billing、AI 配额、权限）散落在 K1-K4 业务代码中

---

## 一、设计原则

1. **权限在服务端** — 所有 isPro / quota 判断必须在后端完成，前端只做展示逻辑
2. **计费原子性** — AI 扣费与 API 调用必须原子完成（Redis Lua 脚本）
3. **内容与 UGC 分离** — 运营内容（题目/解析）和用户内容（帖子/评价）走不同读写路径
4. **V1 单体，V2 拆分** — V1 所有服务在同一进程；模块边界通过函数/类隔离，V2 可平滑拆成微服务

---

## 二、系统全景图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Expo App (iOS)                           │
│   K1 Account  │  K2 University  │  K3 Study  │  K4 Forum       │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST + SSE
                    ┌──────▼──────┐
                    │ API Gateway  │  JWT 验证 / 限流 / 日志
                    └──┬──┬──┬──┬─┘
          ┌────────────┘  │  │  └─────────────┐
          ▼              ▼  ▼                 ▼
    ┌─────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐
    │  Auth   │  │   Billing &  │  │   Content    │  │  Forum   │
    │ Service │  │  Entitlement │  │   Service    │  │ Service  │
    └────┬────┘  └──────┬───────┘  └──────┬───────┘  └────┬─────┘
         │              │                 │                │
         └──────────────┴─────────────────┴────────────────┘
                                   │
              ┌────────────────────┼─────────────────┐
              ▼                    ▼                  ▼
        ┌──────────┐        ┌──────────┐       ┌──────────────┐
        │    AI    │        │  Search  │       │ Notification │
        │ Service  │        │ Service  │       │   Service    │
        └──────────┘        └──────────┘       └──────────────┘
              │
              ▼
        Claude API (外部)

─────────────────────────────────────
  共享基础设施
  PostgreSQL 16  │  Redis 7  │  S3（CDN）│  Expo Push API
```

---

## 三、各服务边界详述

### ① Auth Service（认证）

**职责：** 身份认证、JWT 签发、Token 生命周期

| 能力 | 实现 |
|------|------|
| 登录/注册 | bcrypt 密码哈希，JWT 签发 |
| Access Token | 15 分钟有效，RS256 签名 |
| Refresh Token | 30 天，SHA-256 哈希存 DB |
| 登出 | 将 refresh token 哈希写入 `refresh_tokens.revoked_at` |
| 密码重置 | 邮件验证码，限频 5 次/小时/邮箱 |

**不负责：**
- isPro / 权限判断 → Billing
- 第三方登录 → V2

**对外接口：** `/auth/login` `/auth/register` `/auth/refresh` `/auth/logout` `/auth/forgot-password`

---

### ② Billing & Entitlement Service（计费与权限）

**这是整个系统最重要的 Shared Service，必须与 K1 同期实现。**

**职责：** Pro 订阅、Token 余额、权限判断、Apple IAP 验证

#### isPro 判断逻辑

```sql
SELECT EXISTS (
  SELECT 1 FROM subscriptions
  WHERE user_id = $1
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
)
```

所有需要 Pro 判断的接口必须调用此逻辑，不得在业务层硬编码。

#### Apple IAP 验证流程

```
前端购买完成 → 获得 receipt
    ↓
POST /billing/verify-receipt { platform, productId, receiptData }
    ↓
后端调用 App Store Server API v2 verifyReceipt
    ↓
验证成功 → 写入 subscriptions 表 → 返回 isPro=true
    ↓
Apple Server Notifications V2 Webhook（续订/取消/退款）→ 同步更新 subscriptions.status
```

**关键约束：**
- 必须使用 **App Store Server Notifications V2**（`https://apple.com/notifications/v2`），不用旧版 verifyReceipt
- 推荐选型：RevenueCat 服务端 SDK（自动处理 Webhook，减少维护成本）
- `apple_original_transaction_id` 唯一，防止重复验证同一收据

#### Token 扣款原子性

```lua
-- Redis Lua 脚本（原子执行）
local balance = tonumber(redis.call('GET', KEYS[1])) or 0
if balance < tonumber(ARGV[1]) then
  return -1  -- 余额不足
end
redis.call('DECRBY', KEYS[1], ARGV[1])
return 1  -- 扣款成功
```

扣款成功后再调用 Claude API；API 失败时回滚 Redis 计数。

**对外接口（内部函数，非 HTTP）：**

```typescript
getEntitlement(userId: string): Promise<{ isPro: boolean; tokenBalance: number; expiresAt: string | null }>
verifyAppleReceipt(userId: string, receiptData: string, productId: string): Promise<{ success: boolean; expiresAt: string }>
deductToken(userId: string, amount: number, reason: string): Promise<{ success: boolean; newBalance: number }>
```

**HTTP 端点：** `/billing/plans` `/billing/subscribe` `/billing/verify-receipt` `/billing/status`

---

### ③ Content Service（题目/大学/参考书）

**职责：** 管理运营内容（只读 API）+ UGC 写入（需鉴权）

#### 运营内容（管理员写，用户只读）

```
questions → question_knowledge_points → question_explanation_steps
universities → university_grad_schools → university_majors
professors → professor_experiences
reference_books → reference_chapters → reference_question_matches
related_questions
```

**写入方式：** 管理员通过后台脚本或管理 API 导入，普通用户无写权限。

#### UGC 内容（鉴权写入）

| 操作 | 权限 | 表 |
|------|------|---|
| 掌握状态标记 | 已登录 | user_mastery |
| 收藏/取消收藏 | 已登录 | user_bookmarks |
| 众包难度投票 | 已登录，每题 1 次 | questions.crowd_votes_* |
| 大学评价 | 已登录，每所大学 1 次 | university_reviews |
| 教授经验 | 已登录 | professor_experiences |

#### Pro 权限截断点

| 内容 | 截断逻辑 |
|------|---------|
| 举一反三 L3 | `isPro=false` 时，L3 数组最多返回前 2 条，附 `level3Total` |
| 教授 AI 摘要 | `isPro=false` 时，`aiSummary: null` |
| 题目原图（高清）| `isPro=false` 时，仅返回低清缩略图 URL |

---

### ④ Forum Service（论坛/学习圈）

**职责：** 帖子、回复、学习圈的 CRUD + 内容审核钩子

#### 内容审核策略（V1）

```
用户发帖/回复 → 立即写入 DB（status='active'）→ 立即可见
用户举报 → 写入举报记录 → 运营人工审核 → 可更新 status='hidden'
```

- V1 不做自动审核；V2 接入 Claude Moderation API
- `status='hidden'` 的帖子：对普通用户不可见，对运营可见

#### 注意点

- 发帖频率限制：每用户每分钟最多 2 帖（防刷）
- 回复频率限制：每用户每分钟最多 5 条
- `reply_count` / `last_activity_at` 在回复写入时同步更新（触发器或应用层）

---

### ⑤ AI Service（AI 对话）

**职责：** AI 提问计费、Claude API 调用、SSE 流式输出、会话管理

#### 计费流程（必须原子）

```
1. 检查 Redis ai:quota:{userId}:{date}
   ├─ 有免费次数 → Redis DECR → 调用 Claude → 成功确认 / 失败 INCR 回滚
   ├─ 是 Pro → 直接调用 Claude（cost_type='pro'）
   └─ Token 用户 → Redis Lua 原子扣款 → 调用 Claude → 成功确认 / 失败回滚

2. 写入 ai_sessions + ai_messages
3. 写入 ai_daily_usage（审计）
4. 若为 Token 用户，写入 token_transactions
```

#### 系统提示词模板

```
你是修考备考助手。当前题目：{title}（{university}·{year}·{subject}）
目标学校：{targetSchools}；考生方向：{direction}；知识点：{knowledgePoints}
题目正文：{bodyText}
标准解析（供参考，不必原文引用）：{standardExplanation}
---
请用中文回答，结构化输出：思路 / 关键考点 / 常见误区 / 推荐练习
用户问题：{userText}
```

#### SSE 流式输出

```
POST /ai/ask  Headers: Accept: text/event-stream
→ 后端 stream Claude 响应，事件格式：

data: {"type":"chunk","content":"由于矩阵是实对称的..."}
data: {"type":"chunk","content":"所以一定存在..."}
data: {"type":"done","sessionId":"sess_abc123","costType":"free","tokensConsumed":0}
data: [DONE]
```

- 流超时（30s 无响应）：前端断开，后端检测到 disconnect 后回滚扣款
- 非 SSE 请求（无 Accept: text/event-stream）：后端等待 Claude 完成后一次性返回

---

### ⑥ Search Service（搜索）

**职责：** 全文搜索（题目/大学/论坛）+ 弱点驱动推荐

#### V1 实现（PostgreSQL FTS）

```sql
-- 题目搜索
SELECT * FROM questions
WHERE title % $1 OR body_text LIKE '%' || $1 || '%'
-- 配合 pg_bigm GIN 索引
```

#### 相似题推荐（pgvector）

```sql
SELECT q.*, (q.embedding <=> $1) AS distance
FROM questions q
WHERE q.id != $2   -- 排除当前题
ORDER BY distance
LIMIT 10;
```

`questions.embedding` 在题目导入时预计算（调用 Embedding API）。

#### 弱点驱动推荐逻辑

```sql
-- 1. 找用户弱点知识点
SELECT DISTINCT kp.point FROM user_mastery um
JOIN question_knowledge_points kp ON kp.question_id = um.question_id
WHERE um.user_id = $1 AND um.status IN ('wrong', 'unclear');

-- 2. 找包含这些知识点但用户未做过的题目
SELECT DISTINCT q.* FROM questions q
JOIN question_knowledge_points kp ON kp.question_id = q.id
WHERE kp.point = ANY($2)   -- 弱点知识点数组
  AND q.university_id = ANY($3)   -- 目标学校
  AND NOT EXISTS (
    SELECT 1 FROM user_mastery um
    WHERE um.user_id = $1 AND um.question_id = q.id
  )
LIMIT $4;
```

---

### ⑦ Notification Service（通知）

**职责：** 站内通知 + Expo Push 推送

#### 推送触发时机（V1）

| 场景 | 触发方式 | 提前量 |
|------|---------|--------|
| 考试倒计时 | 定时任务（每日 09:00 UTC 扫描 user_profiles）| 30天/7天/1天前 |
| 论坛回复 | 发回复时异步触发 | 即时 |
| 系统公告 | 管理员手动触发广播 | 即时 |

#### Expo Push 批量发送

```typescript
// 最多 100 条/次
const chunks = chunkArray(tokens, 100);
for (const chunk of chunks) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    body: JSON.stringify(chunk.map(token => ({
      to: token,
      title,
      body,
      data: { type, questionId, threadId }
    })))
  });
}
```

---

## 四、跨服务依赖规则

```
Auth          ← PostgreSQL, Redis
Billing       ← Auth (userId 验证), PostgreSQL, Redis, Apple API
Content       ← Auth, Billing (Entitlement), PostgreSQL, S3/CDN
Forum         ← Auth, Billing (发帖权限), PostgreSQL
AI            ← Auth, Billing (配额+扣费), Claude API, PostgreSQL
Search        ← PostgreSQL (GIN索引, pgvector)
Notification  ← Auth, PostgreSQL, Expo Push API
```

**禁止：**
- Forum / Content / AI 之间直接调用（共享数据库表通信）
- 前端直接调用 Claude API（所有 AI 调用走后端 AI Service）
- 业务层硬编码 `isPro` 判断（必须通过 Billing.getEntitlement）

---

## 五、V1 → V2 拆分路径

V1 单体部署，所有服务在同一进程（Node.js 或 Python）中以模块形式运行。  
当以下条件触发时考虑拆分：

| 触发条件 | 建议拆分服务 |
|----------|-------------|
| AI 并发 > 50 QPS | AI Service 独立部署，独立扩容 |
| 论坛 DAU > 10,000 | Forum Service 独立，WebSocket 服务独立 |
| 搜索延迟 > 500ms | Search 迁移至 Elasticsearch 集群 |
| 内容审核需自动化 | Moderation Service 独立，接 Claude Moderation |

**V2 通信方式：** 内部 REST 或 gRPC；异步事件（帖子发布 → 通知触发）改用消息队列（Redis Streams 或 RabbitMQ）

---

## 六、内容导入架构（Content Ingestion）

**这不是研发任务，是运营+工程的联合工作，必须在 Phase 0 启动。**

```
运营人员
  ├─ 手工录入：大学/教授信息 → 管理后台 API
  ├─ 扫描题目原图 → S3（题目图片存储）
  ├─ AI 辅助生成解析 → 人工审核 → 管理后台批量导入
  └─ 标注参考书匹配 → CSV → python import_script.py

研发工具
  ├─ admin API：`POST /admin/questions/batch` 批量题目导入
  ├─ 导入脚本：`scripts/import_questions.py`（CSV → DB）
  ├─ pgvector 预计算：`scripts/compute_embeddings.py`（题目 → embedding）
  └─ 关联计算：`scripts/compute_related.py`（余弦相似度 → related_questions）
```

**版权保护措施：**
- 题目正文：存储改写版摘要，非原文
- 原图：S3 私有 bucket，仅 Pro 用户可通过 Presigned URL 访问（15 分钟有效）
- 参考书内容：仅显示章节标题 + 页码范围，不引用原文（日本著作権法第 36 条）
