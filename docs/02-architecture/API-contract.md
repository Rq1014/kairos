# Kakomon · API 契约规范（API_CONTRACT）

**版本：** v1.0  
**日期：** 2026-05-14  
**用途：** 前后端并行开发的统一规范，补充 TSD.md 中已有的端点示例

> TSD.md 第四章已包含各模块主要端点的 request/response 示例；本文档聚焦于：
> 1. 通用规则（分页 / 排序 / 过滤 / 错误 / 权限截断 / 幂等）
> 2. TSD.md 未完整定义的端点规格
> 3. 前后端开发约定

---

## 一、通用规则

### 1.1 Base URL & 版本

```
生产：  https://api.kairos.app/api/v1
预发布：https://staging.api.kairos.app/api/v1
开发：  https://dev.api.kairos.app/api/v1
```

- 版本在路径中固定（`/api/v1/`），不用 Header 版本
- 破坏性变更发布新版本路径 `/api/v2/`，旧版本至少保留 3 个月

### 1.2 认证

```
Authorization: Bearer <access_token>
```

- 所有接口（除 `/auth/*`）必须携带 JWT
- Access Token 过期返回 `401 UNAUTHORIZED`，前端自动用 refresh token 换新，失败后跳登录页
- 后端在 JWT payload 中包含：`{ userId, email, iat, exp }`

### 1.3 统一响应信封

**成功**
```json
{
  "success": true,
  "data": <T>
}
```

**列表（分页）**
```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 120,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

**错误**
```json
{
  "success": false,
  "code": "QUOTA_EXCEEDED",
  "message": "今日免费次数已用完，请充值 Token 或升级 Pro",
  "details": {}
}
```

### 1.4 分页规范

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | int | 1 | 从 1 开始 |
| `pageSize` | int | 20 | 最大 100 |

- 超过最大值的 pageSize 返回 `400 INVALID_INPUT`
- `total` 返回满足过滤条件的总记录数（不是当前页数量）

### 1.5 排序规范

```
?sort=year_desc        单字段降序
?sort=rating_asc       单字段升序
?sort=hot              预定义排序名（内部转换为具体字段）
```

- 每个端点声明其支持的 sort 值；不支持的值返回 `400 INVALID_INPUT`
- 不支持多字段排序（V1），默认次排序为 `created_at DESC`

### 1.6 多值过滤规范

```
?tags[]=线性代数&tags[]=微积分
?universityIds[]=todai&universityIds[]=titech
?knowledgePoints[]=固有值&knowledgePoints[]=对角化
```

- 同名多值参数使用 `[]` 后缀
- 多值之间为 OR 关系（符合任一即返回）
- 不同参数之间为 AND 关系

### 1.7 权限截断规范

Free 用户访问 Pro-gated 内容时，**不返回 403**，而是在响应体内标记：

```json
// 举一反三 L3（Free 用户）
{
  "level3": [<前2条>],
  "level3Total": 4,
  "isPro": false          // 前端根据此字段显示锁定遮罩
}

// 教授 AI 摘要（Free 用户）
{
  "aiSummary": null       // null 表示 Pro 锁定
}
```

- 用 `null` 或截断数组表达权限限制，不用 403
- 403 仅用于"完全无权访问"场景（如非本人数据）

### 1.8 幂等性规范

| 操作 | 规则 |
|------|------|
| 收藏 / 取消收藏 | 重复收藏返回 200（非 409），state 为最终状态 |
| 掌握状态标记 | 覆盖写入，无唯一冲突 |
| 难度投票 | 同一用户只能投一次，重复投票返回 `409 CONFLICT` |
| 点赞回复 | 同上 |
| 发帖 / 发回复 | 无幂等键；前端防重提交（按钮 disable）|
| IAP 验证 | `apple_original_transaction_id` 唯一约束，重复提交同一收据返回 200 |

### 1.9 时间格式

- 所有时间字段使用 **ISO 8601 UTC**：`2026-05-14T15:30:00Z`
- 日期字段（无时间）：`2026-08-25`
- 前端展示时转换为本地时区

### 1.10 限流

| 端点类型 | 限制 |
|----------|------|
| `/auth/*` | 10 次/分钟/IP |
| `/ai/ask` `/ai/chat/*` | 100 次/天/用户（Token 用户）|
| 其他写操作 | 60 次/分钟/用户 |
| 读操作 | 300 次/分钟/用户 |

超限返回 `429 RATE_LIMITED`，Header 包含 `Retry-After: <seconds>`

---

## 二、补充端点规格

> 以下端点在 TSD.md 中有路由但无完整 request/response 定义。

### 2.1 POST /forum/threads（发帖）

```json
// Request
{
  "title": "东大2024数学第3问 为什么可以对角化？",
  "type": "question_discussion",
  "questionId": "q-todai-2024-math-3",    // 可选
  "universityId": "todai",                 // 可选
  "tags": ["线性代数", "固有值"],
  "body": "我在第二步卡住了..."
}

// 校验规则
// title: 必填，2–200 字
// type: 必填，枚举值
// body: 必填，10–10000 字
// tags: 最多 5 个，每个最多 20 字

// Response 201
{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "title": "...",
    "type": "question_discussion",
    "createdAt": "2026-05-14T12:00:00Z"
  }
}

// Error 400
{ "success": false, "code": "INVALID_INPUT", "message": "标题不能为空" }
```

### 2.2 POST /forum/threads/:id/replies（发回复）

```json
// Request
{ "body": "关键是实对称矩阵必有实特征值..." }

// 校验：body 必填，2–5000 字

// Response 201
{
  "success": true,
  "data": {
    "id": "...",
    "author": "张同学",
    "badge": "preparing",
    "time": "2026-05-14T12:05:00Z",
    "body": "...",
    "upvotes": 0,
    "isAccepted": false
  }
}
```

### 2.3 POST /forum/threads/:id/replies/:rid/upvote（点赞）

```json
// Request: 无 Body（幂等操作）

// Response 200（首次点赞）
{
  "success": true,
  "data": { "upvotes": 6, "voted": true }
}

// Response 409（已点赞）
{
  "success": false,
  "code": "CONFLICT",
  "message": "已点赞"
}
```

### 2.4 POST /forum/threads/:id/replies/:rid/accept（采纳答案）

```json
// 仅帖子作者可操作，否则 403

// Request: 无 Body

// Response 200
{
  "success": true,
  "data": { "accepted": true, "threadHasAcceptedAnswer": true }
}

// Error 403
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "只有楼主可以采纳答案"
}
```

### 2.5 GET /forum/groups（学习圈列表）

```
// 查询参数
?universityId=todai      // 按学校筛选
&subject=数学             // 按科目筛选
&joined=true             // 仅返回我已加入的
&page=1&pageSize=20
```

```json
// Response 200
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "name": "东大情报 数学組",
        "emoji": "📐",
        "scope": "school+subject",
        "memberCount": 28,
        "dailyActive": 12,
        "avgProgress": 0.62,
        "ownerName": "Study Bot",
        "todayTask": "完成线代第3章练习",
        "accent": "blue",
        "openSlots": 2,
        "verified": true,
        "joined": false
      }
    ],
    "total": 14,
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

### 2.6 GET /users/me/notifications（通知列表）

```
// 查询参数
?unreadOnly=true
&page=1&pageSize=30
```

```json
// Response 200
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "type": "exam",
        "title": "考试倒计时 7 天",
        "body": "东大情报理工修考还有 7 天，加油！",
        "time": "2026-08-18T09:00:00Z",
        "unread": true,
        "icon": "clock",
        "color": "rose",
        "actionLabel": "查看备考计划",
        "questionId": null,
        "threadId": null
      }
    ],
    "total": 5,
    "unreadCount": 3,
    "page": 1,
    "pageSize": 30,
    "hasMore": false
  }
}
```

### 2.7 PATCH /users/me/notifications/:id/read

```json
// Request: 无 Body

// Response 200
{ "success": true, "data": { "id": "...", "isRead": true } }

// 批量已读（全部）
// PATCH /users/me/notifications/read-all
// Response 200
{ "success": true, "data": { "markedCount": 3 } }
```

### 2.8 POST /users/me/push-token（注册推送 Token）

```json
// Request
{
  "token": "ExponentPushToken[xxx]",
  "platform": "ios"
}

// Response 200
{ "success": true, "data": { "registered": true } }
```

### 2.9 GET /questions/recommendations（推荐题目）

```
// 查询参数
?limit=10     // 默认 10，最大 20
```

```json
// Response 200（基于用户 weak_points 推荐）
{
  "success": true,
  "data": {
    "items": [ /* KakomonQuestion[] */ ],
    "basedOn": ["线性代数/固有值", "微积分/偏微分"],  // 推荐依据的弱点
    "total": 8
  }
}
```

### 2.11 GET /papers（试卷列表 · 模考首页）

Query: `universityId`（必填）, `graduateSchool`（必填）

```json
{
  "code": 0, "message": "ok",
  "data": [
    { "id": "p-todai-2024-math", "year": 2024, "subject": "数学",
      "title": "2024年度 大学院入学試験問題 数学",
      "durationMinutes": 150, "selectRule": { "total": 3, "choose": 2 },
      "questionCount": 3 }
  ]
}
```

### 2.12 GET /papers/{code}（单份试卷）

```json
{
  "code": 0, "message": "ok",
  "data": {
    "id": "p-todai-2024-math", "universityId": "todai",
    "graduateSchool": "情报理工学系研究科", "year": 2024, "subject": "数学",
    "durationMinutes": 150, "selectRule": { "total": 3, "choose": 2 },
    "instructions": ["…"],
    "questions": [ { "id": "q-todai-2024-math-1", "questionNo": "第1问", "title": "…", "orderIndex": 1 } ]
  }
}
```

### 2.13 GET /questions（大问筛选 · 分页）

Query: `universityId?`, `graduateSchool?`, `year?`, `subject?`, `knowledgePoint?`, `keyword?`, `page=1`, `pageSize=20`。列表项**不含** `contentBlocks`。

```json
{
  "code": 0, "message": "ok",
  "data": { "items": [ { "id": "q-todai-2024-math-3", "title": "…", "questionNo": "第3问",
                         "knowledgePoints": ["线性代数","固有值"] } ],
            "total": 3, "page": 1, "pageSize": 20, "hasMore": false }
}
```

### 2.14 GET /questions/{code}（大问详情 · 含 contentBlocks）

> **需登录**（`LoginRequiredInterceptor` 强制）。响应含**当前用户**的 `myVote` / `masteryStatus`。

```json
{
  "code": 0, "message": "ok",
  "data": {
    "id": "q-todai-2024-math-3", "paperId": "p-todai-2024-math",
    "universityId": "todai", "graduateSchool": "情报理工学系研究科",
    "year": 2024, "subject": "数学", "questionNo": "第3问", "title": "…",
    "contentBlocks": [ { "type": "text", "content": "…" },
                       { "type": "math", "latex": "A v_1 = 2 v_1" } ],
    "knowledgePoints": ["线性代数","固有值"],
    "crowdDifficultyRate": 0.72, "crowdVotes": { "easy": 12, "medium": 38, "hard": 84 },
    "myVote": "hard", "masteryStatus": "unclear"
  }
}
```

- `crowdDifficultyRate`：众包难度 = `hard 票 / 总票`（0~1），无票时为 `null`。
- `crowdVotes`：三桶票数 `{easy,medium,hard}`。
- `myVote`：当前用户的难度票（`easy|medium|hard`），未投为 `null`。
- `masteryStatus`：当前用户的掌握自评（`mastered|unclear|wrong`），未评为 `null`。

### 2.15 GET /questions/{code}/related（同专题联系）

严格同 **学校 + 研究科 + 专业 + 科目**的其它大问，按共享知识点数降序、年份降序，最多 6 条。公开（`@PublicApi`）。

```json
{
  "code": 0, "message": "ok",
  "data": [ { "id": "q-todai-2023-math-1", "title": "…",
              "universityId": "todai", "universityName": "东京大学",
              "year": 2023, "subject": "数学", "subjectCode": "math",
              "questionNo": "第1问", "knowledgePoints": ["线性代数","固有值"] } ]
}
```

### 2.16 POST /questions/{code}/difficulty-vote（难度投票）

> **需登录**。每用户每题一票，可改投（upsert）。投票后服务端重算并回写 `crowd_difficulty_rate` / `crowd_votes`。

Body：`{ "vote": "easy" | "medium" | "hard" }`

```json
{
  "code": 0, "message": "ok",
  "data": { "questionId": "q-todai-2024-math-3", "vote": "hard",
            "crowdVotes": { "easy": 12, "medium": 38, "hard": 85 },
            "crowdDifficultyRate": 0.638 }
}
```

> 错误码：`vote` 非法（非 easy/medium/hard）→ `10603`；题目不存在 → `10602`。

### 2.17 PUT /questions/{code}/mastery（掌握自评）

> **需登录**。每用户每题一条最新状态（upsert）。前端同时保留本地 attemptStore 记录（双写）。

Body：`{ "masteryStatus": "mastered" | "unclear" | "wrong" }`

```json
{
  "code": 0, "message": "ok",
  "data": { "questionId": "q-todai-2024-math-3", "masteryStatus": "mastered",
            "weakPointsUpdated": false }
}
```

> 错误码：`masteryStatus` 非法 → `10604`；题目不存在 → `10602`。

> 读接口中 `GET /questions`（§2.13）、`GET /questions/{code}/related`（§2.15）公开（`@PublicApi`），付费门禁由前端判定；`GET /questions/{code}`（§2.14）及以上写接口需登录。试卷/题目不存在 → `10601` / `10602`。

### 2.10 POST /ai/chat/:sessionId（追问）

```json
// Request
{ "userText": "那如果矩阵不是实对称的呢？" }

// Response 200
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "costType": "free",          // 追问消耗与首问相同规则
    "tokensConsumed": 0,
    "freeRemainingAfter": 0,
    "answer": { "sections": [], "chips": [] }
  }
}

// Error 404（sessionId 不存在或不属于当前用户）
{ "success": false, "code": "NOT_FOUND", "message": "会话不存在" }
```

---

## 三、前后端开发约定

### 3.1 Mock 策略

| 阶段 | 策略 |
|------|------|
| Phase 0 – Phase 1 初期 | 前端使用 MSW（Mock Service Worker）+ TypeScript 类型约束本地 Mock |
| Phase 1 中期 | 后端优先实现 K1+K3 核心接口；前端切换为真实 API，MSW 保留用于测试 |
| Phase 2+ | 全接口对接真实后端；MSW 仅用于单测 |

### 3.2 并行开发规则

- 后端先实现接口的**类型签名**（空 stub 返回 mock 数据），前端据此开发
- 接口 Breaking Change 必须提前 1 天通知对方，并在 API_CONTRACT.md 更新
- 所有接口需在 Postman 或 Bruno collection 中维护可运行示例

### 3.3 错误处理约定

前端 axios interceptor 统一处理（见 TSD.md 第十章），组件层不自行处理网络错误：
- 业务错误（`402`, `409`, `403`）在组件层处理（弹 Toast / 引导 Paywall）
- 系统错误（`5xx`, 网络超时）由 interceptor 统一 Toast 提示

### 3.4 Content-Type & 文件上传

- 标准 JSON 请求：`Content-Type: application/json`
- 文件上传（题目原图）：使用 S3 Presigned URL 直传，不经过 API Server
  1. 前端请求 `POST /content/presigned-url`，获取上传 URL
  2. 前端直接 PUT 到 S3 URL
  3. 前端通知 API Server 上传完成：`POST /content/confirm-upload`
