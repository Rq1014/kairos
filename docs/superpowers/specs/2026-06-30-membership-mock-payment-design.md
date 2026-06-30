# 会员体系（模拟支付）设计文档

日期：2026-06-30
状态：已确认，待写实现计划
范围：后端 + 前端全链路；微信 / 支付宝 / Apple 三渠道**仅后端模拟**，不接真实支付。

---

## 1. 目标与背景

当前状态：

- 前端 `app/paywall.tsx` 售卖「年度 ¥198 / 月度 ¥28」两档，但 `handleSubscribe` 是纯本地假购买（`setTimeout` 后 `setUser({isPro:true})`），不调后端、不持久化。
- 前端 `src/api/billing.ts` 全是 mock；`app/settings.tsx` 有开发用「一键切 Pro」本地开关。
- 后端只有 `user_profile.is_pro` 字段（默认 0，**没有任何入口把它置 1**），无订单 / 订阅表、无 billing 模块。

目标：在后端建立真实的会员体系（订单 + 订阅 + 到期），用两步模拟支付驱动开通，并把前端 paywall / billing 接到真实接口，打通全链路。三方支付渠道仅在后端伪造支付参数与确认动作，方便将来替换为真实微信 / 支付宝 / Apple 接入。

非目标（YAGNI）：

- 不接真实支付 SDK、不验真实 receipt、不接 Apple Server Notifications V2。
- 不做 Token 包（代码里虽有 `token` plan 与 `tokenBalance`，但当前 paywall 不售卖 Token，本期不碰）。
- 不做自动续费 / 退款；订阅 `autoRenew` 固定返回 false。
- 不做定时任务扫描过期（采用读取时懒降级）。

---

## 2. 关键决策（已与用户确认）

1. **模拟支付流程**：两步 —— 下单（创建 PENDING 订单 + 伪支付参数）→ 确认支付（置 PAID + 开通/续费会员）。映射真实支付的「下单 → 支付 → 回调」。
2. **售卖内容**：仅 Pro 订阅，月度 / 年度两档。
3. **改动范围**：后端 + 前端全链路。
4. **到期处理**：订单成功时按套餐时长算 `expires_at` 落库；`isPro` 在读取时按 `expires_at > now` 实时计算，过期自动降级。
5. **数据建模**：方案 A —— `payment_order`（支付流水）+ `subscription`（权益真相）双表分离。

---

## 3. 数据模型

金额一律用**整数分**存储（`amount_fen`，¥198 → 19800），避免浮点误差；前端展示再除以 100。

时间用 `DATETIME`（与现有表一致，`UserTargetSchoolEntity` 用 `LocalDateTime`）。所有「现在」以服务端 `LocalDateTime.now()` 为准。

### 3.1 `payment_order` —— 支付流水（每次购买尝试一行）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | BIGINT PK AUTO | 主键 |
| `order_no` | VARCHAR(40) UNIQUE | 对外订单号，生成规则见 §6 |
| `user_id` | BIGINT | 下单用户，关联 `user.id` |
| `plan` | VARCHAR(16) | `MONTHLY` / `ANNUAL` |
| `channel` | VARCHAR(16) | `WECHAT` / `ALIPAY` / `APPLE` |
| `amount_fen` | INT | 金额（分），后端按 plan 权威写入 |
| `status` | VARCHAR(16) | `PENDING` / `PAID` / `CANCELLED` |
| `mock_pay_params` | VARCHAR(512) | JSON，伪支付参数（伪二维码串 / 伪 prepayId / 伪 transactionId） |
| `paid_at` | DATETIME NULL | 确认支付时间 |
| `created_at` | DATETIME | 默认 now |
| `updated_at` | DATETIME | 更新时间 |

索引：`UNIQUE(order_no)`、`INDEX(user_id, created_at)`。

### 3.2 `subscription` —— 权益真相（会员有效期）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | BIGINT PK AUTO | 主键 |
| `user_id` | BIGINT | 关联 `user.id` |
| `plan` | VARCHAR(16) | 最近一次开通/续费的套餐 |
| `starts_at` | DATETIME | 会员开始时间 |
| `expires_at` | DATETIME | 会员到期时间（真相字段） |
| `status` | VARCHAR(16) | `ACTIVE` / `EXPIRED`（懒更新，仅作冗余标记） |
| `source_order_no` | VARCHAR(40) | 最近一次写入该订阅的订单号 |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

索引：`INDEX(user_id, expires_at)`。

**单行语义**：一个用户最多维护一行「当前订阅」记录（按 `user_id` 查最新一行）。续费时更新这一行的 `expires_at`，不另插新行（保持模型简单；订单流水已在 `payment_order` 留痕）。

### 3.3 `isPro` 的真相来源

不再依赖 `user_profile.is_pro` 静态值。`UserServiceImpl.buildUserResponse` 改为：查该用户 `subscription`，若存在且 `expires_at > now` 则 `isPro=true`，否则 false。

`is_pro` 列保留：确认订单时冗余写 1、懒降级时写 0，仅作兼容与快速判断，**读取以订阅为准**。

---

## 4. 后端模块结构

新增 `billing` 模块，沿用现有 `web / service / mapper / model / entity / common` 分层（见 `docs/04-backend/backend-conventions.md`）：

```
web/billing/BillingController.java
service/billing/BillingService.java
service/billing/impl/BillingServiceImpl.java
mapper/billing/PaymentOrderMapper.java          (+ resources/mapper/billing/PaymentOrderMapper.xml)
mapper/billing/SubscriptionMapper.java           (+ resources/mapper/billing/SubscriptionMapper.xml)
entity/PaymentOrderEntity.java
entity/SubscriptionEntity.java
model/request/billing/CreateOrderRequest.java
model/response/billing/PlanResponse.java
model/response/billing/OrderResponse.java
model/response/billing/SubscriptionStatusResponse.java
common/enums/PlanType.java          (MONTHLY, ANNUAL — 各自带 durationDays + priceFen)
common/enums/PayChannel.java        (WECHAT, ALIPAY, APPLE)
common/enums/OrderStatus.java       (PENDING, PAID, CANCELLED)
common/enums/SubscriptionStatus.java(ACTIVE, EXPIRED)
```

`ResultCode` 新增账单段（沿用现有「按域分段」风格，账单用 `105xx`）：

| 码 | 枚举 | 含义 |
|---|---|---|
| 10501 | `ORDER_NOT_FOUND` | 订单不存在或不属于当前用户 |
| 10502 | `ORDER_STATUS_INVALID` | 订单状态非法（非 PENDING 无法确认/取消） |
| 10503 | `PLAN_INVALID` | 套餐不合法 |
| 10504 | `CHANNEL_INVALID` | 支付渠道不合法 |

（`GlobalExceptionHandler` 已统一把 `BizException` 映射到 HTTP；新增码沿用既有映射，业务码与 HTTP 解耦。）

价格 / 时长由 `PlanType` 枚举集中定义，后端权威：

- `MONTHLY`：priceFen=2800，durationDays=30
- `ANNUAL`：priceFen=19800，durationDays=365

---

## 5. 接口契约

统一前缀 `/api/billing`，返回 `Result<T>` 信封。除 `plans` 外均需登录（`@CurrentUser UserSession`）。

### ① `GET /api/billing/plans` — 商品列表（`@PublicApi`）

返回两档套餐，前端不再硬编码价格。

```json
{ "code":0, "data":[
  {"plan":"ANNUAL","priceFen":19800,"durationDays":365,"badge":"最划算"},
  {"plan":"MONTHLY","priceFen":2800,"durationDays":30,"badge":null}
]}
```

### ② `GET /api/billing/status` — 当前订阅状态

查有效订阅（`expires_at > now`）。

```json
{ "code":0, "data":{
  "isPro":true, "plan":"ANNUAL",
  "startsAt":"2026-06-30T12:00:00+09:00",
  "expiresAt":"2027-06-30T12:00:00+09:00",
  "autoRenew":false
}}
```

无有效订阅：`{ "isPro":false, "plan":"free", "startsAt":null, "expiresAt":null, "autoRenew":false }`。

### ③ `POST /api/billing/orders` — 下单（第一步）

入参：`{ "plan":"ANNUAL", "channel":"WECHAT" }`

校验 plan / channel 合法 → 生成 `order_no` → 插入 `payment_order`（status=PENDING，amount 按 plan）→ 按渠道造伪支付参数。**不动会员状态。**

```json
{ "code":0, "data":{
  "orderNo":"po_...","status":"PENDING","plan":"ANNUAL",
  "channel":"WECHAT","amountFen":19800,
  "payParams":{ "type":"wechat_qr","mockQr":"weixin://mock/po_..." }
}}
```

伪支付参数按渠道：
- `WECHAT` → `{type:"wechat_qr", mockQr:"weixin://mock/<orderNo>"}`
- `ALIPAY` → `{type:"alipay_qr", mockQr:"alipay://mock/<orderNo>"}`
- `APPLE` → `{type:"apple_iap", mockTransactionId:"mock_txn_<orderNo>"}`

### ④ `POST /api/billing/orders/{orderNo}/confirm` — 确认支付（第二步，`@Transactional`）

模拟「用户付款成功 / 第三方回调」。单事务内：

1. 查订单；不存在或 `user_id` 非当前用户 → `ORDER_NOT_FOUND`。
2. **幂等**：若已 PAID → 直接返回当前订阅状态（不重复延期、不报错）。
3. 若状态既非 PENDING 也非 PAID（如 CANCELLED）→ `ORDER_STATUS_INVALID`。
4. 订单置 PAID，写 `paid_at=now`。
5. 开通 / 续费：查该用户当前订阅行——
   - 无 / 已过期 → 新开通：`starts_at=now`，`expires_at=now + durationDays`，`status=ACTIVE`。
   - 仍有效（`expires_at > now`）→ **续费叠加**：`expires_at = 旧 expires_at + durationDays`（从原到期日叠加，用户不损失剩余天数），`plan` 更新为本次套餐。
   - 写 `source_order_no`。
6. 冗余写 `user_profile.is_pro=1`。
7. 返回更新后的 `SubscriptionStatusResponse`。

> 事务保证「订单记账 + 订阅延期」原子，对应文档既定原则「IAP 不能重复记账」。

### ⑤ `POST /api/billing/orders/{orderNo}/cancel` — 取消未支付订单

校验归属 + 状态必须 PENDING → 置 CANCELLED。用于演示「支付失败 / 放弃」分支。非 PENDING → `ORDER_STATUS_INVALID`。

### 到期处理（懒降级，无定时任务）

`GET /status` 与 `buildUserResponse` 读取时用 `expires_at > now` 实时判断 `isPro`。读到一行已过期且 `status=ACTIVE` 的订阅时，顺带把该行 `status=EXPIRED`、`user_profile.is_pro=0`（best-effort，失败不阻塞读取）。读时计算 = 永远准确，零调度成本。

---

## 6. 实现要点

- **`order_no` 生成**：`"po_" + System.currentTimeMillis() + 4位随机`，与现有 `genUserNo()` 同风格，控制在 40 字符内。
- **时间**：`LocalDateTime.now()` + `plusDays(durationDays)`。响应里的 ISO 字符串沿用 `UserServiceImpl` 既有的 `atZone(systemDefault()).toInstant().toString()` 风格。
- **MyBatis**：`PaymentOrderMapper` / `SubscriptionMapper` 接口 + XML 成对，放 `resources/mapper/billing/`（`application.yml` 已配 `mapper-locations: classpath:mapper/**/*.xml`，自动加载）。
- **JSON 字段**：`mock_pay_params` 用 `ObjectMapper` 序列化为字符串存 VARCHAR（与 `UserTargetSchool.subjects` 存 JSON 字符串的现有做法一致）。
- **事务**：`confirm` 方法 `@Transactional`，与 `UserServiceImpl` 既有写操作风格一致。
- **DB 脚本**：新增 `docs/05-database/sql/V1_3__billing.sql`（建两表 + 索引），更新该目录 `README.md` 执行顺序表。

---

## 7. 前端改动

- **`src/api/billing.ts`**（改为真实接口）：
  - `getPlans()` → `GET /api/billing/plans`
  - `getBillingStatus()` → `GET /api/billing/status`（替换现有 mock，返回结构对齐 `SubscriptionStatusResponse`）
  - `createOrder(plan, channel)` → `POST /api/billing/orders`
  - `confirmOrder(orderNo)` → `POST /api/billing/orders/{orderNo}/confirm`
  - `cancelOrder(orderNo)` → `POST /api/billing/orders/{orderNo}/cancel`
  - 错误码映射 `105xx` → 友好文案。
- **`app/paywall.tsx`**：
  - 新增**支付渠道选择**（微信 / 支付宝 / Apple 三选一），默认微信。
  - `handleSubscribe` 改为真实两步：`createOrder` → （展示伪支付参数，确认）→ `confirmOrder` → 成功后调 `getMe()` 刷新 `authStore.isPro` → 进入 success 态。保留现有 `idle/processing/success/error` 状态机。
  - 套餐价格改读 `getPlans()`（或维持展示文案、金额以后端为准做校验），避免与后端价格漂移。
- **`app/billing.tsx`**：当前套餐卡 + 到期日改读 `getBillingStatus()`，展示 plan / expiresAt。
- **`app/settings.tsx`**：保留开发用「一键切 Pro」开关（本地调试用），不依赖后端；后续可移除。

---

## 8. 验收标准

1. 下单返回 PENDING 订单 + 对应渠道的伪支付参数。
2. 确认支付后 `GET /status` 与 `getMe` 返回 `isPro=true`，`expires_at` 按套餐正确（月 +30 天 / 年 +365 天）。
3. 对同一已 PAID 订单重复确认，不重复延期、不报错（幂等）。
4. 已有有效会员再次确认新订单 → `expires_at` 在原到期日基础上叠加。
5. 手动将订阅 `expires_at` 改到过去后，`GET /status` 返回 `isPro=false`（懒降级）。
6. 取消 PENDING 订单 → 该订单无法再确认（`ORDER_STATUS_INVALID`）。
7. 前端 paywall 选渠道 → 走真实接口 → 成功后界面 isPro 生效，billing 页显示到期日。
8. `./mvnw compile` 通过；前端 `npm run type-check` 通过。

---

## 9. 影响的现有代码

- `UserServiceImpl.buildUserResponse`：`isPro` 改为按订阅实时计算（注入 `SubscriptionMapper`）。
- `ResultCode`：新增 `105xx` 段。
- `docs/05-database/sql/`：新增迁移脚本 + README 更新。
- 前端 `src/api/billing.ts`、`app/paywall.tsx`、`app/billing.tsx`。
