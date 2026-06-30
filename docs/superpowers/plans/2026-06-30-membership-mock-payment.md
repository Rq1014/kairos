# 会员体系（模拟支付）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在后端建立 Pro 会员体系（订单 + 订阅双表 + 真实到期），用两步模拟支付（微信/支付宝/Apple 仅伪造参数）驱动开通，并把前端 paywall/billing 接到真实接口。

**Architecture:** 新增后端 `billing` 模块（沿用 `web/service/mapper/model/entity/common` 分层）。`payment_order` 记支付流水，`subscription` 记会员有效期；`isPro` 在读取时按 `expires_at > now` 实时计算（懒降级，无定时任务）。确认支付在单事务内完成「订单置 PAID + 订阅延期」并保证幂等。前端 `src/api/billing.ts` 改为真实接口，`paywall.tsx` 加渠道选择 + 两步购买。

**Tech Stack:** Spring Boot 4 + MyBatis + MySQL 8 + Redis（后端）；Expo + React Native + TypeScript + TanStack Query（前端）。

**Spec:** `docs/superpowers/specs/2026-06-30-membership-mock-payment-design.md`

## Global Constraints

- 金额一律用整数分（`amount_fen`）：MONTHLY=2800（¥28/30天），ANNUAL=19800（¥198/365天）。价格与时长由后端 `PlanType` 枚举权威定义，前端不硬编码。
- 所有接口返回 `Result<T>` 信封（`{code,message,data,traceId}`），`code=0` 成功。业务错误抛 `BizException(ResultCode.XXX)`，由 `GlobalExceptionHandler` 统一映射 HTTP。
- 账单错误码用 `105xx` 段（见 Task 1）。
- 登录态：受保护接口用 `@CurrentUser UserSession s` 取当前用户；公开接口标 `@PublicApi`。
- MyBatis mapper XML 放 `src/main/resources/mapper/billing/`（`application.yml` 已配 `classpath:mapper/**/*.xml` 自动加载）。
- DB 风格：MySQL 8 / utf8mb4 / `utf8mb4_0900_ai_ci`，`BIGINT UNSIGNED` 主键，`DATETIME(3)` 时间列，每列带 `COMMENT`，与 `docs/05-database/sql/V1_0__init_schema.sql` 一致。
- **本项目无单元测试框架**：后端 `./mvnw test` 仅 `contextLoads` 且需真实 DB/Redis。验证手段 = `./mvnw -q compile`（后端编译门槛）、`npm run type-check`（前端门槛）、必要时 curl 冒烟。每个后端任务以 `./mvnw -q compile` 通过为完成标志，不写 JUnit。
- 时间统一用服务端 `LocalDateTime.now()`；响应 ISO 字符串沿用 `UserServiceImpl` 既有写法 `dt.atZone(ZoneId.systemDefault()).toInstant().toString()`。
- `order_no` 生成规则：`"po_" + System.currentTimeMillis() + 4位随机`，≤40 字符（仿现有 `genUserNo()`）。

---

### Task 1: 枚举 + 错误码

**Files:**
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/common/enums/PlanType.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/common/enums/PayChannel.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/common/enums/OrderStatus.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/common/enums/SubscriptionStatus.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/common/ResultCode.java`

**Interfaces:**
- Produces:
  - `PlanType` enum：`MONTHLY`, `ANNUAL`，每项带 `int priceFen`、`int durationDays`；静态方法 `PlanType fromName(String)` 返回匹配项，不匹配抛 `BizException(ResultCode.PLAN_INVALID)`。
  - `PayChannel` enum：`WECHAT`, `ALIPAY`, `APPLE`；静态 `PayChannel fromName(String)`，不匹配抛 `BizException(ResultCode.CHANNEL_INVALID)`。
  - `OrderStatus` enum：`PENDING`, `PAID`, `CANCELLED`。
  - `SubscriptionStatus` enum：`ACTIVE`, `EXPIRED`。
  - `ResultCode` 新增：`ORDER_NOT_FOUND(10501)`, `ORDER_STATUS_INVALID(10502)`, `PLAN_INVALID(10503)`, `CHANNEL_INVALID(10504)`。

- [ ] **Step 1: 创建 `PlanType.java`**

```java
package org.example.kairos.common.enums;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;

/** Pro 套餐类型。价格(分)与时长(天)由后端权威定义,前端不硬编码。 */
public enum PlanType {
    MONTHLY(2800, 30),
    ANNUAL(19800, 365);

    private final int priceFen;
    private final int durationDays;

    PlanType(int priceFen, int durationDays) {
        this.priceFen = priceFen;
        this.durationDays = durationDays;
    }

    public int getPriceFen() { return priceFen; }
    public int getDurationDays() { return durationDays; }

    /** 解析套餐名,非法值抛 PLAN_INVALID。 */
    public static PlanType fromName(String name) {
        if (name != null) {
            for (PlanType p : values()) {
                if (p.name().equalsIgnoreCase(name.trim())) return p;
            }
        }
        throw new BizException(ResultCode.PLAN_INVALID);
    }
}
```

- [ ] **Step 2: 创建 `PayChannel.java`**

```java
package org.example.kairos.common.enums;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;

/** 支付渠道。本期均为后端模拟,不接真实 SDK。 */
public enum PayChannel {
    WECHAT, ALIPAY, APPLE;

    /** 解析渠道名,非法值抛 CHANNEL_INVALID。 */
    public static PayChannel fromName(String name) {
        if (name != null) {
            for (PayChannel c : values()) {
                if (c.name().equalsIgnoreCase(name.trim())) return c;
            }
        }
        throw new BizException(ResultCode.CHANNEL_INVALID);
    }
}
```

- [ ] **Step 3: 创建 `OrderStatus.java` 和 `SubscriptionStatus.java`**

```java
package org.example.kairos.common.enums;

/** 支付订单状态。 */
public enum OrderStatus {
    /** 待支付(已下单未确认) */
    PENDING,
    /** 已支付 */
    PAID,
    /** 已取消(用户放弃支付) */
    CANCELLED
}
```

```java
package org.example.kairos.common.enums;

/** 订阅状态。ACTIVE/EXPIRED 仅作冗余标记,真相以 expires_at 实时比较为准。 */
public enum SubscriptionStatus {
    ACTIVE,
    EXPIRED
}
```

- [ ] **Step 4: 在 `ResultCode.java` 新增账单错误码**

在枚举 `REQUIRE_BIND_PHONE(10402, "需先绑定手机号");` 这一行之后、分号改为逗号，追加账单段。找到：

```java
    /** 三方登录后,业务要求必须先绑定手机号才能继续使用 */
    REQUIRE_BIND_PHONE(10402, "需先绑定手机号");
```

替换为：

```java
    /** 三方登录后,业务要求必须先绑定手机号才能继续使用 */
    REQUIRE_BIND_PHONE(10402, "需先绑定手机号"),

    /** 订单不存在或不属于当前用户 */
    ORDER_NOT_FOUND(10501, "订单不存在"),
    /** 订单状态非法,无法执行该操作(如对非 PENDING 订单确认/取消) */
    ORDER_STATUS_INVALID(10502, "订单状态异常"),
    /** 套餐类型不合法 */
    PLAN_INVALID(10503, "套餐不存在"),
    /** 支付渠道不合法 */
    CHANNEL_INVALID(10504, "支付渠道不支持");
```

同时更新文件顶部错误码段位注释（class javadoc 的 `<ul>` 列表），在 `10400~10499` 行后加一行：

```java
 *   <li>10500~10599 - 订单/支付相关</li>
```

- [ ] **Step 5: 编译验证**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS（无报错）

- [ ] **Step 6: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/common/enums/ Kairos-kakomon-server/src/main/java/org/example/kairos/common/ResultCode.java
git commit -m "feat(billing): add plan/channel/order enums and 105xx result codes"
```

---

### Task 2: 数据库建表脚本

**Files:**
- Create: `docs/05-database/sql/V1_3__billing.sql`
- Modify: `docs/05-database/sql/README.md`

**Interfaces:**
- Produces: `payment_order`、`subscription` 两张表（供 Task 3 的 entity / mapper 对应）。

- [ ] **Step 1: 创建 `V1_3__billing.sql`**

```sql
-- =============================================================
--  Kairos-kakomon 迁移脚本 V1.3 — 会员体系（订单 + 订阅）
--  对应设计文档：docs/superpowers/specs/2026-06-30-membership-mock-payment-design.md
--  执行环境：MySQL 8.x，utf8mb4 / utf8mb4_0900_ai_ci
--  前置：V1_0__init_schema.sql（依赖 user 表）
-- =============================================================

USE `kakomon`;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `payment_order`;
DROP TABLE IF EXISTS `subscription`;

-- -------------------------------------------------------------
--  支付流水：每次购买尝试一行
-- -------------------------------------------------------------
CREATE TABLE `payment_order` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `order_no`         VARCHAR(40)     NOT NULL                COMMENT '对外订单号, 形如 po_<时间戳><随机>',
    `user_id`          BIGINT UNSIGNED NOT NULL                COMMENT '下单用户, 关联 user.id',
    `plan`             VARCHAR(16)     NOT NULL                COMMENT '套餐: MONTHLY / ANNUAL',
    `channel`          VARCHAR(16)     NOT NULL                COMMENT '支付渠道: WECHAT / ALIPAY / APPLE',
    `amount_fen`       INT             NOT NULL                COMMENT '金额(分), 后端按 plan 权威写入',
    `status`           VARCHAR(16)     NOT NULL DEFAULT 'PENDING' COMMENT '订单状态: PENDING / PAID / CANCELLED',
    `mock_pay_params`  VARCHAR(512)    NULL                    COMMENT '伪支付参数(JSON 字符串): 伪二维码 / 伪 transactionId',
    `paid_at`          DATETIME(3)     NULL                    COMMENT '确认支付时间, 未支付为 NULL',
    `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                          COMMENT '创建时间',
    `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_user_created` (`user_id`, `created_at`)
) ENGINE = InnoDB COMMENT = '支付订单流水';

-- -------------------------------------------------------------
--  订阅：会员权益真相, 一个用户维护一行当前订阅
-- -------------------------------------------------------------
CREATE TABLE `subscription` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`          BIGINT UNSIGNED NOT NULL                COMMENT '所属用户, 关联 user.id',
    `plan`             VARCHAR(16)     NOT NULL                COMMENT '最近一次开通/续费的套餐: MONTHLY / ANNUAL',
    `starts_at`        DATETIME(3)     NOT NULL                COMMENT '会员开始时间',
    `expires_at`       DATETIME(3)     NOT NULL                COMMENT '会员到期时间(真相字段), expires_at>now 即有效',
    `status`           VARCHAR(16)     NOT NULL DEFAULT 'ACTIVE' COMMENT '冗余状态: ACTIVE / EXPIRED, 读取时懒更新',
    `source_order_no`  VARCHAR(40)     NULL                    COMMENT '最近一次写入该订阅的订单号',
    `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                          COMMENT '创建时间',
    `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_expires` (`user_id`, `expires_at`)
) ENGINE = InnoDB COMMENT = '用户订阅(会员有效期)';
```

- [ ] **Step 2: 更新 `docs/05-database/sql/README.md` 执行顺序表**

找到现有顺序表（`| 3 | V1_2__seed_demo_user.sql | ... |` 行），在其后追加一行：

```markdown
| 4 | [`V1_3__billing.sql`](./V1_3__billing.sql) | 会员体系：支付订单流水 + 订阅有效期两张表 |
```

并在命令示例代码块追加一行：

```bash
mysql -uroot -p kakomon < V1_3__billing.sql
```

- [ ] **Step 3: 语法自检（无 DB 也可做的静态检查）**

Run: `grep -c "COMMENT" docs/05-database/sql/V1_3__billing.sql`
Expected: 每个字段+表都有注释，数值 ≥ 20。人工确认两个 `CREATE TABLE`、`payment_order` 有 `uk_order_no`、`subscription` 有 `idx_user_expires`。

- [ ] **Step 4: Commit**

```bash
git add docs/05-database/sql/V1_3__billing.sql docs/05-database/sql/README.md
git commit -m "feat(billing): add payment_order + subscription DDL (V1_3)"
```

---

### Task 3: Entity + Mapper（接口 + XML）

**Files:**
- Create: `.../entity/PaymentOrderEntity.java`
- Create: `.../entity/SubscriptionEntity.java`
- Create: `.../mapper/billing/PaymentOrderMapper.java`
- Create: `.../mapper/billing/SubscriptionMapper.java`
- Create: `src/main/resources/mapper/billing/PaymentOrderMapper.xml`
- Create: `src/main/resources/mapper/billing/SubscriptionMapper.xml`

（路径前缀 `Kairos-kakomon-server/src/main/java/org/example/kairos`）

**Interfaces:**
- Consumes: 无（依赖 Task 2 的表结构）。
- Produces:
  - `PaymentOrderEntity`：字段 `Long id; String orderNo; Long userId; String plan; String channel; Integer amountFen; String status; String mockPayParams; LocalDateTime paidAt; LocalDateTime createdAt; LocalDateTime updatedAt;`（含 getter/setter）。
  - `SubscriptionEntity`：字段 `Long id; Long userId; String plan; LocalDateTime startsAt; LocalDateTime expiresAt; String status; String sourceOrderNo; LocalDateTime createdAt; LocalDateTime updatedAt;`（含 getter/setter）。
  - `PaymentOrderMapper`：
    - `int insert(PaymentOrderEntity e)`（useGeneratedKeys）
    - `PaymentOrderEntity findByOrderNo(@Param("orderNo") String orderNo)`
    - `int markPaid(@Param("orderNo") String orderNo, @Param("paidAt") LocalDateTime paidAt)`
    - `int markCancelled(@Param("orderNo") String orderNo)`
  - `SubscriptionMapper`：
    - `SubscriptionEntity findByUserId(@Param("userId") Long userId)`（取最新一行，`ORDER BY id DESC LIMIT 1`）
    - `int insert(SubscriptionEntity e)`（useGeneratedKeys）
    - `int update(SubscriptionEntity e)`（按 id 更新 plan/startsAt/expiresAt/status/sourceOrderNo）
    - `int markExpired(@Param("id") Long id)`

- [ ] **Step 1: 创建 `PaymentOrderEntity.java`**

```java
package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 支付订单流水实体,对应 payment_order 表。每次购买尝试一行。 */
public class PaymentOrderEntity {
    /** 主键 */
    private Long id;
    /** 对外订单号, 形如 po_<时间戳><随机> */
    private String orderNo;
    /** 下单用户 ID */
    private Long userId;
    /** 套餐: MONTHLY / ANNUAL */
    private String plan;
    /** 支付渠道: WECHAT / ALIPAY / APPLE */
    private String channel;
    /** 金额(分) */
    private Integer amountFen;
    /** 订单状态: PENDING / PAID / CANCELLED */
    private String status;
    /** 伪支付参数(JSON 字符串) */
    private String mockPayParams;
    /** 确认支付时间 */
    private LocalDateTime paidAt;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public Integer getAmountFen() { return amountFen; }
    public void setAmountFen(Integer amountFen) { this.amountFen = amountFen; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMockPayParams() { return mockPayParams; }
    public void setMockPayParams(String mockPayParams) { this.mockPayParams = mockPayParams; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 2: 创建 `SubscriptionEntity.java`**

```java
package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 订阅实体,对应 subscription 表。会员权益真相,一个用户维护一行当前订阅。 */
public class SubscriptionEntity {
    /** 主键 */
    private Long id;
    /** 所属用户 ID */
    private Long userId;
    /** 最近一次开通/续费的套餐: MONTHLY / ANNUAL */
    private String plan;
    /** 会员开始时间 */
    private LocalDateTime startsAt;
    /** 会员到期时间(真相字段) */
    private LocalDateTime expiresAt;
    /** 冗余状态: ACTIVE / EXPIRED */
    private String status;
    /** 最近一次写入该订阅的订单号 */
    private String sourceOrderNo;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public LocalDateTime getStartsAt() { return startsAt; }
    public void setStartsAt(LocalDateTime startsAt) { this.startsAt = startsAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSourceOrderNo() { return sourceOrderNo; }
    public void setSourceOrderNo(String sourceOrderNo) { this.sourceOrderNo = sourceOrderNo; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 3: 创建 `PaymentOrderMapper.java`**

```java
package org.example.kairos.mapper.billing;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.PaymentOrderEntity;

import java.time.LocalDateTime;

/** 支付订单 Mapper。 */
@Mapper
public interface PaymentOrderMapper {

    /** 插入新订单(回填自增 id)。 */
    int insert(PaymentOrderEntity e);

    /** 按订单号查询,不存在返回 null。 */
    PaymentOrderEntity findByOrderNo(@Param("orderNo") String orderNo);

    /** 将订单标记为已支付并写 paid_at,返回受影响行数。 */
    int markPaid(@Param("orderNo") String orderNo, @Param("paidAt") LocalDateTime paidAt);

    /** 将订单标记为已取消,返回受影响行数。 */
    int markCancelled(@Param("orderNo") String orderNo);
}
```

- [ ] **Step 4: 创建 `SubscriptionMapper.java`**

```java
package org.example.kairos.mapper.billing;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.SubscriptionEntity;

/** 订阅 Mapper。 */
@Mapper
public interface SubscriptionMapper {

    /** 查用户当前订阅(最新一行),无则返回 null。 */
    SubscriptionEntity findByUserId(@Param("userId") Long userId);

    /** 新建订阅(回填自增 id)。 */
    int insert(SubscriptionEntity e);

    /** 按 id 更新订阅的 plan/starts_at/expires_at/status/source_order_no。 */
    int update(SubscriptionEntity e);

    /** 将订阅标记为 EXPIRED。 */
    int markExpired(@Param("id") Long id);
}
```

- [ ] **Step 5: 创建 `resources/mapper/billing/PaymentOrderMapper.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.billing.PaymentOrderMapper">

    <resultMap id="OrderMap" type="org.example.kairos.entity.PaymentOrderEntity">
        <id column="id" property="id"/>
        <result column="order_no" property="orderNo"/>
        <result column="user_id" property="userId"/>
        <result column="plan" property="plan"/>
        <result column="channel" property="channel"/>
        <result column="amount_fen" property="amountFen"/>
        <result column="status" property="status"/>
        <result column="mock_pay_params" property="mockPayParams"/>
        <result column="paid_at" property="paidAt"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <insert id="insert" parameterType="org.example.kairos.entity.PaymentOrderEntity"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO payment_order (
            order_no, user_id, plan, channel, amount_fen, status, mock_pay_params
        ) VALUES (
            #{orderNo}, #{userId}, #{plan}, #{channel}, #{amountFen}, #{status}, #{mockPayParams}
        )
    </insert>

    <select id="findByOrderNo" resultMap="OrderMap">
        SELECT * FROM payment_order WHERE order_no = #{orderNo}
    </select>

    <update id="markPaid">
        UPDATE payment_order SET status = 'PAID', paid_at = #{paidAt}
        WHERE order_no = #{orderNo}
    </update>

    <update id="markCancelled">
        UPDATE payment_order SET status = 'CANCELLED'
        WHERE order_no = #{orderNo}
    </update>
</mapper>
```

- [ ] **Step 6: 创建 `resources/mapper/billing/SubscriptionMapper.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.billing.SubscriptionMapper">

    <resultMap id="SubMap" type="org.example.kairos.entity.SubscriptionEntity">
        <id column="id" property="id"/>
        <result column="user_id" property="userId"/>
        <result column="plan" property="plan"/>
        <result column="starts_at" property="startsAt"/>
        <result column="expires_at" property="expiresAt"/>
        <result column="status" property="status"/>
        <result column="source_order_no" property="sourceOrderNo"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <select id="findByUserId" resultMap="SubMap">
        SELECT * FROM subscription WHERE user_id = #{userId} ORDER BY id DESC LIMIT 1
    </select>

    <insert id="insert" parameterType="org.example.kairos.entity.SubscriptionEntity"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO subscription (
            user_id, plan, starts_at, expires_at, status, source_order_no
        ) VALUES (
            #{userId}, #{plan}, #{startsAt}, #{expiresAt}, #{status}, #{sourceOrderNo}
        )
    </insert>

    <update id="update" parameterType="org.example.kairos.entity.SubscriptionEntity">
        UPDATE subscription
        SET plan = #{plan},
            starts_at = #{startsAt},
            expires_at = #{expiresAt},
            status = #{status},
            source_order_no = #{sourceOrderNo}
        WHERE id = #{id}
    </update>

    <update id="markExpired">
        UPDATE subscription SET status = 'EXPIRED' WHERE id = #{id}
    </update>
</mapper>
```

- [ ] **Step 7: 编译验证**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 8: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/entity/PaymentOrderEntity.java Kairos-kakomon-server/src/main/java/org/example/kairos/entity/SubscriptionEntity.java Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/billing/ Kairos-kakomon-server/src/main/resources/mapper/billing/
git commit -m "feat(billing): add order/subscription entities and mybatis mappers"
```

---

### Task 4: Request / Response DTO

**Files:**
- Create: `.../model/request/billing/CreateOrderRequest.java`
- Create: `.../model/response/billing/PlanResponse.java`
- Create: `.../model/response/billing/OrderResponse.java`
- Create: `.../model/response/billing/SubscriptionStatusResponse.java`

**Interfaces:**
- Produces:
  - `CreateOrderRequest`：`String plan; String channel;`（均 `@NotBlank`，含 getter/setter）。
  - `PlanResponse`：`String plan; int priceFen; int durationDays; String badge;` + 全参构造。
  - `OrderResponse`：`String orderNo; String status; String plan; String channel; int amountFen; Map<String,Object> payParams;` + getter/setter。
  - `SubscriptionStatusResponse`：`boolean isPro; String plan; String startsAt; String expiresAt; boolean autoRenew;` + getter/setter（`getIsPro()` 命名与 `UserResponse.getIsPro()` 一致，保证 JSON 字段名为 `isPro`）。

- [ ] **Step 1: 创建 `CreateOrderRequest.java`**

```java
package org.example.kairos.model.request.billing;

import jakarta.validation.constraints.NotBlank;

/** 下单请求体。 */
public class CreateOrderRequest {
    /** 套餐: MONTHLY / ANNUAL */
    @NotBlank
    private String plan;
    /** 支付渠道: WECHAT / ALIPAY / APPLE */
    @NotBlank
    private String channel;

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
}
```

- [ ] **Step 2: 创建 `PlanResponse.java`**

```java
package org.example.kairos.model.response.billing;

import com.fasterxml.jackson.annotation.JsonInclude;

/** 商品(套餐)展示信息。价格/时长由后端权威下发。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlanResponse {
    /** 套餐标识: MONTHLY / ANNUAL */
    private String plan;
    /** 价格(分) */
    private int priceFen;
    /** 时长(天) */
    private int durationDays;
    /** 角标文案, 可空 */
    private String badge;

    public PlanResponse() {}

    public PlanResponse(String plan, int priceFen, int durationDays, String badge) {
        this.plan = plan;
        this.priceFen = priceFen;
        this.durationDays = durationDays;
        this.badge = badge;
    }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public int getPriceFen() { return priceFen; }
    public void setPriceFen(int priceFen) { this.priceFen = priceFen; }
    public int getDurationDays() { return durationDays; }
    public void setDurationDays(int durationDays) { this.durationDays = durationDays; }
    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }
}
```

- [ ] **Step 3: 创建 `OrderResponse.java`**

```java
package org.example.kairos.model.response.billing;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/** 下单结果。payParams 为按渠道伪造的支付参数。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderResponse {
    /** 订单号 */
    private String orderNo;
    /** 订单状态: PENDING / PAID / CANCELLED */
    private String status;
    /** 套餐 */
    private String plan;
    /** 支付渠道 */
    private String channel;
    /** 金额(分) */
    private int amountFen;
    /** 伪支付参数, 形如 {type, mockQr} 或 {type, mockTransactionId} */
    private Map<String, Object> payParams;

    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public int getAmountFen() { return amountFen; }
    public void setAmountFen(int amountFen) { this.amountFen = amountFen; }
    public Map<String, Object> getPayParams() { return payParams; }
    public void setPayParams(Map<String, Object> payParams) { this.payParams = payParams; }
}
```

- [ ] **Step 4: 创建 `SubscriptionStatusResponse.java`**

```java
package org.example.kairos.model.response.billing;

import com.fasterxml.jackson.annotation.JsonInclude;

/** 当前订阅状态。无有效订阅时 isPro=false, plan="free", 时间字段为 null。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubscriptionStatusResponse {
    /** 当前是否为 Pro 会员(expires_at>now) */
    private boolean isPro;
    /** 当前套餐: MONTHLY / ANNUAL / free */
    private String plan;
    /** 会员开始时间(ISO 字符串), 免费时为 null */
    private String startsAt;
    /** 会员到期时间(ISO 字符串), 免费时为 null */
    private String expiresAt;
    /** 是否自动续费, 本期固定 false */
    private boolean autoRenew;

    public boolean getIsPro() { return isPro; }
    public void setIsPro(boolean pro) { isPro = pro; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getStartsAt() { return startsAt; }
    public void setStartsAt(String startsAt) { this.startsAt = startsAt; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
    public boolean getAutoRenew() { return autoRenew; }
    public void setAutoRenew(boolean autoRenew) { this.autoRenew = autoRenew; }
}
```

- [ ] **Step 5: 编译验证**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/model/request/billing/ Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/billing/
git commit -m "feat(billing): add request/response DTOs"
```

---

### Task 5: BillingService（业务逻辑核心）

**Files:**
- Create: `.../service/billing/BillingService.java`
- Create: `.../service/billing/impl/BillingServiceImpl.java`

**Interfaces:**
- Consumes: Task 1 枚举、Task 3 mappers（`PaymentOrderMapper`, `SubscriptionMapper`）、Task 4 DTO、现有 `UserProfileMapper`（冗余写 is_pro）、现有 `ObjectMapper`（序列化 payParams）、`BizException` / `ResultCode`。
- Produces（`BillingService` 接口）：
  - `List<PlanResponse> listPlans()`
  - `SubscriptionStatusResponse getStatus(Long userId)`
  - `OrderResponse createOrder(Long userId, String plan, String channel)`
  - `SubscriptionStatusResponse confirmOrder(Long userId, String orderNo)`
  - `void cancelOrder(Long userId, String orderNo)`
  - `boolean isProActive(Long userId)`（供 Task 6 给 `UserServiceImpl` 复用，内部含懒降级）

- [ ] **Step 1: 创建 `BillingService.java` 接口**

```java
package org.example.kairos.service.billing;

import org.example.kairos.model.response.billing.OrderResponse;
import org.example.kairos.model.response.billing.PlanResponse;
import org.example.kairos.model.response.billing.SubscriptionStatusResponse;

import java.util.List;

/** 会员/支付领域服务。 */
public interface BillingService {

    /** 返回所有可售套餐。 */
    List<PlanResponse> listPlans();

    /** 查询用户当前订阅状态(含懒降级)。 */
    SubscriptionStatusResponse getStatus(Long userId);

    /** 下单(第一步):创建 PENDING 订单并生成伪支付参数。 */
    OrderResponse createOrder(Long userId, String plan, String channel);

    /** 确认支付(第二步):订单置 PAID + 开通/续费订阅,幂等。返回最新订阅状态。 */
    SubscriptionStatusResponse confirmOrder(Long userId, String orderNo);

    /** 取消未支付订单(PENDING -> CANCELLED)。 */
    void cancelOrder(Long userId, String orderNo);

    /** 用户当前是否 Pro 会员(expires_at>now),读取时懒降级。供用户聚合接口复用。 */
    boolean isProActive(Long userId);
}
```

- [ ] **Step 2: 创建 `BillingServiceImpl.java`**

```java
package org.example.kairos.service.billing.impl;

import tools.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.enums.OrderStatus;
import org.example.kairos.common.enums.PayChannel;
import org.example.kairos.common.enums.PlanType;
import org.example.kairos.common.enums.SubscriptionStatus;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.PaymentOrderEntity;
import org.example.kairos.entity.SubscriptionEntity;
import org.example.kairos.entity.UserProfileEntity;
import org.example.kairos.mapper.billing.PaymentOrderMapper;
import org.example.kairos.mapper.billing.SubscriptionMapper;
import org.example.kairos.mapper.user.UserProfileMapper;
import org.example.kairos.model.response.billing.OrderResponse;
import org.example.kairos.model.response.billing.PlanResponse;
import org.example.kairos.model.response.billing.SubscriptionStatusResponse;
import org.example.kairos.service.billing.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 会员/支付服务实现。
 * <p>关键流程:
 * <ul>
 *   <li>{@link #createOrder} 校验套餐/渠道 -> 写 PENDING 订单 + 伪支付参数</li>
 *   <li>{@link #confirmOrder} 单事务: 订单置 PAID + 开通/续费订阅, 重复确认幂等</li>
 *   <li>{@link #isProActive} 读取时按 expires_at>now 判断, 过期懒降级</li>
 * </ul>
 */
@Service
public class BillingServiceImpl implements BillingService {

    @Autowired private PaymentOrderMapper paymentOrderMapper;
    @Autowired private SubscriptionMapper subscriptionMapper;
    @Autowired private UserProfileMapper userProfileMapper;
    @Autowired private ObjectMapper objectMapper;

    @Override
    public List<PlanResponse> listPlans() {
        List<PlanResponse> list = new ArrayList<>();
        list.add(new PlanResponse(PlanType.ANNUAL.name(),
                PlanType.ANNUAL.getPriceFen(), PlanType.ANNUAL.getDurationDays(), "最划算"));
        list.add(new PlanResponse(PlanType.MONTHLY.name(),
                PlanType.MONTHLY.getPriceFen(), PlanType.MONTHLY.getDurationDays(), null));
        return list;
    }

    @Override
    public SubscriptionStatusResponse getStatus(Long userId) {
        SubscriptionEntity sub = subscriptionMapper.findByUserId(userId);
        return toStatus(sub);
    }

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, String plan, String channel) {
        PlanType planType = PlanType.fromName(plan);     // 非法 -> PLAN_INVALID
        PayChannel payChannel = PayChannel.fromName(channel); // 非法 -> CHANNEL_INVALID

        String orderNo = genOrderNo();
        Map<String, Object> payParams = buildMockPayParams(payChannel, orderNo);

        PaymentOrderEntity order = new PaymentOrderEntity();
        order.setOrderNo(orderNo);
        order.setUserId(userId);
        order.setPlan(planType.name());
        order.setChannel(payChannel.name());
        order.setAmountFen(planType.getPriceFen());
        order.setStatus(OrderStatus.PENDING.name());
        order.setMockPayParams(writeJson(payParams));
        paymentOrderMapper.insert(order);

        OrderResponse resp = new OrderResponse();
        resp.setOrderNo(orderNo);
        resp.setStatus(OrderStatus.PENDING.name());
        resp.setPlan(planType.name());
        resp.setChannel(payChannel.name());
        resp.setAmountFen(planType.getPriceFen());
        resp.setPayParams(payParams);
        return resp;
    }

    @Override
    @Transactional
    public SubscriptionStatusResponse confirmOrder(Long userId, String orderNo) {
        PaymentOrderEntity order = paymentOrderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) {
            throw new BizException(ResultCode.ORDER_NOT_FOUND);
        }
        // 幂等: 已支付直接返回当前订阅, 不重复延期。
        if (OrderStatus.PAID.name().equals(order.getStatus())) {
            return toStatus(subscriptionMapper.findByUserId(userId));
        }
        if (!OrderStatus.PENDING.name().equals(order.getStatus())) {
            throw new BizException(ResultCode.ORDER_STATUS_INVALID);
        }

        LocalDateTime now = LocalDateTime.now();
        paymentOrderMapper.markPaid(orderNo, now);

        PlanType planType = PlanType.fromName(order.getPlan());
        SubscriptionEntity sub = subscriptionMapper.findByUserId(userId);
        if (sub == null) {
            // 首次开通
            sub = new SubscriptionEntity();
            sub.setUserId(userId);
            sub.setPlan(planType.name());
            sub.setStartsAt(now);
            sub.setExpiresAt(now.plusDays(planType.getDurationDays()));
            sub.setStatus(SubscriptionStatus.ACTIVE.name());
            sub.setSourceOrderNo(orderNo);
            subscriptionMapper.insert(sub);
        } else {
            // 续费: 仍有效从旧到期日叠加, 已过期从 now 起算
            LocalDateTime base = sub.getExpiresAt() != null && sub.getExpiresAt().isAfter(now)
                    ? sub.getExpiresAt() : now;
            if (sub.getStartsAt() == null || !sub.getExpiresAt().isAfter(now)) {
                sub.setStartsAt(now);
            }
            sub.setExpiresAt(base.plusDays(planType.getDurationDays()));
            sub.setPlan(planType.name());
            sub.setStatus(SubscriptionStatus.ACTIVE.name());
            sub.setSourceOrderNo(orderNo);
            subscriptionMapper.update(sub);
        }

        // 冗余同步 user_profile.is_pro = 1
        writeIsPro(userId, 1);
        return toStatus(sub);
    }

    @Override
    @Transactional
    public void cancelOrder(Long userId, String orderNo) {
        PaymentOrderEntity order = paymentOrderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) {
            throw new BizException(ResultCode.ORDER_NOT_FOUND);
        }
        if (!OrderStatus.PENDING.name().equals(order.getStatus())) {
            throw new BizException(ResultCode.ORDER_STATUS_INVALID);
        }
        paymentOrderMapper.markCancelled(orderNo);
    }

    @Override
    public boolean isProActive(Long userId) {
        SubscriptionEntity sub = subscriptionMapper.findByUserId(userId);
        if (sub == null || sub.getExpiresAt() == null) return false;
        boolean active = sub.getExpiresAt().isAfter(LocalDateTime.now());
        if (!active && SubscriptionStatus.ACTIVE.name().equals(sub.getStatus())) {
            // 懒降级: 过期但状态仍 ACTIVE -> 标 EXPIRED + is_pro=0(best-effort)
            try {
                subscriptionMapper.markExpired(sub.getId());
                writeIsPro(userId, 0);
            } catch (Exception ignore) {
                // 降级失败不影响读取结果
            }
        }
        return active;
    }

    /** 订阅实体 -> 状态响应; null/过期返回 free。 */
    private SubscriptionStatusResponse toStatus(SubscriptionEntity sub) {
        SubscriptionStatusResponse r = new SubscriptionStatusResponse();
        r.setAutoRenew(false);
        boolean active = sub != null && sub.getExpiresAt() != null
                && sub.getExpiresAt().isAfter(LocalDateTime.now());
        if (active) {
            r.setIsPro(true);
            r.setPlan(sub.getPlan());
            r.setStartsAt(toIso(sub.getStartsAt()));
            r.setExpiresAt(toIso(sub.getExpiresAt()));
        } else {
            r.setIsPro(false);
            r.setPlan("free");
            r.setStartsAt(null);
            r.setExpiresAt(null);
        }
        return r;
    }

    /** 按渠道生成伪支付参数。 */
    private Map<String, Object> buildMockPayParams(PayChannel channel, String orderNo) {
        Map<String, Object> m = new LinkedHashMap<>();
        switch (channel) {
            case WECHAT -> { m.put("type", "wechat_qr"); m.put("mockQr", "weixin://mock/" + orderNo); }
            case ALIPAY -> { m.put("type", "alipay_qr"); m.put("mockQr", "alipay://mock/" + orderNo); }
            case APPLE  -> { m.put("type", "apple_iap"); m.put("mockTransactionId", "mock_txn_" + orderNo); }
        }
        return m;
    }

    private void writeIsPro(Long userId, int isPro) {
        UserProfileEntity p = new UserProfileEntity();
        p.setUserId(userId);
        p.setIsPro(isPro);
        userProfileMapper.update(p);
    }

    private String writeJson(Map<String, Object> m) {
        try {
            return objectMapper.writeValueAsString(m);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String toIso(LocalDateTime dt) {
        return dt == null ? null
                : dt.atZone(ZoneId.systemDefault()).toInstant().toString();
    }

    /** 生成订单号: "po_" + 13 位时间戳 + 4 位随机, 控制在 40 字符内。 */
    private static String genOrderNo() {
        String s = "po_" + System.currentTimeMillis()
                + ThreadLocalRandom.current().nextInt(1000, 9999);
        return s.length() > 40 ? s.substring(0, 40) : s;
    }
}
```

> 注意：`ObjectMapper` 的 import 用 `tools.jackson.databind.ObjectMapper`（与 `UserServiceImpl` 一致——本项目 Spring Boot 4 用 Jackson 3 的 `tools.jackson` 包，不是 `com.fasterxml.jackson.databind`）。但 DTO 上的 `@JsonInclude` 注解仍用 `com.fasterxml.jackson.annotation.JsonInclude`（与现有 `TargetSchoolResponse` 一致）。

- [ ] **Step 3: 编译验证**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS。若报 `ObjectMapper` 找不到 `writeValueAsString` 或包错误，核对 import 是否为 `tools.jackson.databind.ObjectMapper`（参照 `UserServiceImpl.java` 第 3-4 行）。

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/service/billing/
git commit -m "feat(billing): implement order/subscription service with mock payment"
```

---

### Task 6: BillingController + isPro 接入用户聚合

**Files:**
- Create: `.../web/billing/BillingController.java`
- Modify: `.../service/user/impl/UserServiceImpl.java`（`buildUserResponse` 的 isPro 改为查订阅）

**Interfaces:**
- Consumes: Task 5 `BillingService`、现有 `@CurrentUser UserSession`、`Result`。
- Produces: REST 接口 `/api/billing/*`（供前端 Task 7 调用）。

- [ ] **Step 1: 创建 `BillingController.java`**

```java
package org.example.kairos.web.billing;

import jakarta.validation.Valid;
import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.CurrentUser;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.model.request.billing.CreateOrderRequest;
import org.example.kairos.model.response.billing.OrderResponse;
import org.example.kairos.model.response.billing.PlanResponse;
import org.example.kairos.model.response.billing.SubscriptionStatusResponse;
import org.example.kairos.service.billing.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 会员/支付接口(模拟支付)。
 * 下单 -> 确认支付两步; plans 公开, 其余需登录。
 */
@RestController
@RequestMapping("/api/billing")
public class BillingController {

    @Autowired private BillingService billingService;

    /** 套餐列表(公开)。 */
    @GetMapping("/plans")
    @PublicApi
    public Result<List<PlanResponse>> plans() {
        return Result.ok(billingService.listPlans());
    }

    /** 当前用户订阅状态。 */
    @GetMapping("/status")
    public Result<SubscriptionStatusResponse> status(@CurrentUser UserSession s) {
        return Result.ok(billingService.getStatus(s.getUserId()));
    }

    /** 下单(第一步)。 */
    @PostMapping("/orders")
    public Result<OrderResponse> createOrder(@CurrentUser UserSession s,
                                             @RequestBody @Valid CreateOrderRequest req) {
        return Result.ok(billingService.createOrder(s.getUserId(), req.getPlan(), req.getChannel()));
    }

    /** 确认支付(第二步)。 */
    @PostMapping("/orders/{orderNo}/confirm")
    public Result<SubscriptionStatusResponse> confirm(@CurrentUser UserSession s,
                                                      @PathVariable("orderNo") String orderNo) {
        return Result.ok(billingService.confirmOrder(s.getUserId(), orderNo));
    }

    /** 取消未支付订单。 */
    @PostMapping("/orders/{orderNo}/cancel")
    public Result<Void> cancel(@CurrentUser UserSession s,
                               @PathVariable("orderNo") String orderNo) {
        billingService.cancelOrder(s.getUserId(), orderNo);
        return Result.ok();
    }
}
```

- [ ] **Step 2: 在 `UserServiceImpl` 注入 `BillingService` 并改 isPro 来源**

在 `UserServiceImpl.java` 的字段注入区（`@Autowired private TokenService tokenService;` 附近）追加：

```java
    @Autowired private org.example.kairos.service.billing.BillingService billingService;
```

找到 `buildUserResponse` 中这一行：

```java
            resp.setIsPro(profile.getIsPro() != null && profile.getIsPro() == 1);
```

替换为（isPro 以订阅有效期为准，含懒降级）：

```java
            resp.setIsPro(billingService.isProActive(userId));
```

> 说明：`isProActive` 内部已处理 null/过期并懒降级。`user_profile.is_pro` 仍由 `BillingServiceImpl` 冗余维护，但聚合响应以订阅为准，确保年/月套餐到期后 `getMe` 自动回到 false。

- [ ] **Step 3: 编译验证**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS。（`UserServiceImpl` ↔ `BillingServiceImpl` 间的循环依赖：`BillingServiceImpl` 注入 `UserProfileMapper` 而非 `UserService`，`UserServiceImpl` 注入 `BillingService`，无循环。若 Spring 启动报循环依赖，说明实现偏离本计划，复查注入项。）

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/web/billing/ Kairos-kakomon-server/src/main/java/org/example/kairos/service/user/impl/UserServiceImpl.java
git commit -m "feat(billing): add billing controller and wire isPro to subscription"
```

---

### Task 7: 前端 API 客户端 `src/api/billing.ts`

**Files:**
- Modify: `Kairos-kakomon/src/api/billing.ts`（整体重写为真实接口）

**Interfaces:**
- Consumes: 现有 `apiRequest` from `./client`、Task 6 的 `/api/billing/*` 接口。
- Produces（供 Task 8/9 import）：
  - `type PlanCode = 'MONTHLY' | 'ANNUAL'`
  - `type PayChannelCode = 'WECHAT' | 'ALIPAY' | 'APPLE'`
  - `interface PlanInfo { plan: PlanCode; priceFen: number; durationDays: number; badge: string | null }`
  - `interface OrderInfo { orderNo: string; status: string; plan: PlanCode; channel: PayChannelCode; amountFen: number; payParams: Record<string, unknown> }`
  - `interface SubscriptionStatus { isPro: boolean; plan: string; startsAt: string | null; expiresAt: string | null; autoRenew: boolean }`
  - `getPlans(): Promise<PlanInfo[]>`
  - `getBillingStatus(): Promise<SubscriptionStatus>`
  - `createOrder(plan: PlanCode, channel: PayChannelCode): Promise<OrderInfo>`
  - `confirmOrder(orderNo: string): Promise<SubscriptionStatus>`
  - `cancelOrder(orderNo: string): Promise<void>`

- [ ] **Step 1: 重写 `src/api/billing.ts`**

```typescript
// 会员/支付：对接后端 /api/billing/*（模拟支付）
import { apiRequest } from './client';

export type PlanCode = 'MONTHLY' | 'ANNUAL';
export type PayChannelCode = 'WECHAT' | 'ALIPAY' | 'APPLE';

export interface PlanInfo {
  plan: PlanCode;
  priceFen: number;
  durationDays: number;
  badge: string | null;
}

export interface OrderInfo {
  orderNo: string;
  status: string;
  plan: PlanCode;
  channel: PayChannelCode;
  amountFen: number;
  payParams: Record<string, unknown>;
}

export interface SubscriptionStatus {
  isPro: boolean;
  /** 'MONTHLY' | 'ANNUAL' | 'free' */
  plan: string;
  startsAt: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
}

/** 套餐列表（公开接口）。 */
export async function getPlans(): Promise<PlanInfo[]> {
  return apiRequest<PlanInfo[]>('/api/billing/plans', { skipAuth: true });
}

/** 当前订阅状态。 */
export async function getBillingStatus(): Promise<SubscriptionStatus> {
  return apiRequest<SubscriptionStatus>('/api/billing/status');
}

/** 下单（第一步）。 */
export async function createOrder(plan: PlanCode, channel: PayChannelCode): Promise<OrderInfo> {
  return apiRequest<OrderInfo>('/api/billing/orders', {
    method: 'POST',
    body: { plan, channel },
  });
}

/** 确认支付（第二步）。 */
export async function confirmOrder(orderNo: string): Promise<SubscriptionStatus> {
  return apiRequest<SubscriptionStatus>(`/api/billing/orders/${orderNo}/confirm`, {
    method: 'POST',
  });
}

/** 取消未支付订单。 */
export async function cancelOrder(orderNo: string): Promise<void> {
  await apiRequest<void>(`/api/billing/orders/${orderNo}/cancel`, { method: 'POST' });
}
```

> 旧文件导出的 `BillingStatus` 接口和 mock `getBillingStatus` 被替换。Task 5 探查已确认当前无任何文件 import `@/api/billing`，故无连带破坏；若执行时 `npm run type-check` 报某处引用了旧 `BillingStatus`，把该引用改为新的 `SubscriptionStatus`。

- [ ] **Step 2: 类型检查**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: 通过（exit 0，0 errors）。

- [ ] **Step 3: Commit**

```bash
git add Kairos-kakomon/src/api/billing.ts
git commit -m "feat(billing): wire frontend billing api to backend endpoints"
```

---

### Task 8: 前端 paywall 接真实两步购买 + 渠道选择

**Files:**
- Modify: `Kairos-kakomon/app/paywall.tsx`

**Interfaces:**
- Consumes: Task 7 的 `createOrder` / `confirmOrder` / `PlanCode` / `PayChannelCode`、现有 `getMe` from `@/api/user`、`useAuthStore`。
- Produces: 无（页面终点）。

- [ ] **Step 1: 替换 import 区与类型别名**

把文件顶部现有 import 段之后、`type Plan = 'annual' | 'monthly';` 起的两行类型定义替换。新的 import 追加：

```typescript
import { createOrder, confirmOrder, type PayChannelCode } from '@/api/billing';
import { getMe } from '@/api/user';
import { ApiError } from '@/api/client';
```

类型别名改为对齐后端套餐码（注意大小写）：

```typescript
type Plan = 'ANNUAL' | 'MONTHLY';
type PurchaseState = 'idle' | 'processing' | 'success' | 'error';
```

- [ ] **Step 2: 改 PLAN_INFO 的 key 为后端套餐码，并新增渠道常量**

`PLAN_INFO` 的 key 由 `annual/monthly` 改为 `ANNUAL/MONTHLY`：

```typescript
const PLAN_INFO: Record<Plan, { label: string; price: string; unit: string; note: string; badge: string | null }> = {
  ANNUAL:  { label: '年度 Pro', price: '¥198', unit: '/年', note: '相当于 ¥16.5/月', badge: '最划算' },
  MONTHLY: { label: '月度 Pro', price: '¥28',  unit: '/月', note: '随时取消',         badge: null },
};

const CHANNELS: { code: PayChannelCode; label: string; icon: string }[] = [
  { code: 'WECHAT', label: '微信支付', icon: 'wechat' },
  { code: 'ALIPAY', label: '支付宝',   icon: 'alipay' },
  { code: 'APPLE',  label: 'Apple',    icon: 'apple' },
];
```

> 图标：若 `Icon` 的 `ICON_MAP` 无 `wechat/alipay/apple`，本步改用已存在的中性图标，三个渠道分别用 `'creditCard'`/`'creditCard'`/`'apple'`；执行时若某 name 不存在，回退到 `'crown'`，并在 commit message 注明待补图标。先不为此新增依赖。

- [ ] **Step 3: 改默认选中套餐 + 新增渠道 state**

找到：

```typescript
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle');
```

替换为：

```typescript
  const [selectedPlan, setSelectedPlan] = useState<Plan>('ANNUAL');
  const [selectedChannel, setSelectedChannel] = useState<PayChannelCode>('WECHAT');
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle');
```

- [ ] **Step 4: 替换 `handleSubscribe` 为真实两步购买**

把现有 `handleSubscribe`（`setTimeout` 假购买那段）整体替换为：

```typescript
  async function handleSubscribe() {
    if (purchaseState === 'processing') return;
    setPurchaseState('processing');
    try {
      // 第一步：下单（拿到伪支付参数）
      const order = await createOrder(selectedPlan, selectedChannel);
      // 模拟用户在第三方完成支付：直接确认（真实接入时这里换成等待支付回调）
      await confirmOrder(order.orderNo);
      // 以后端为准刷新用户，更新 isPro
      const me = await getMe();
      setUser(me, authToken, refreshToken);
      setPurchaseState('success');
      setTimeout(() => router.back(), 1800);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '支付失败，请稍后重试';
      console.warn('[paywall] purchase failed:', msg);
      setPurchaseState('error');
    }
  }
```

- [ ] **Step 5: 在 plans 选择区下方插入渠道选择 UI**

在 `<View style={styles.plans}>...</View>` 这个套餐选择块结束之后、`{purchaseState === 'error' && (...)}` 之前，插入渠道选择：

```tsx
      <View style={styles.channels}>
        {CHANNELS.map((ch) => {
          const selected = selectedChannel === ch.code;
          return (
            <Pressable
              key={ch.code}
              style={[styles.channelRow, selected && styles.channelRowSelected]}
              onPress={() => setSelectedChannel(ch.code)}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.channelLabel, selected && styles.channelLabelSel]}>{ch.label}</Text>
            </Pressable>
          );
        })}
      </View>
```

- [ ] **Step 6: 在 `makeStyles` 中补渠道样式**

在 `makeStyles` 的 StyleSheet 对象里（`legal` 之前）追加：

```typescript
  channels:        { paddingHorizontal: Spacing.screenPadding, gap: 8, marginBottom: 14 },
  channelRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: c.surface },
  channelRowSelected: { borderColor: c.amber500, backgroundColor: c.amber500 + '0D' },
  channelLabel:    { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  channelLabelSel: { color: c.textPrimary },
```

> `radio` / `radioSelected` / `radioDot` 已存在于 `makeStyles`（套餐卡复用），渠道行直接复用，不重复定义。

- [ ] **Step 7: 改订阅按钮文案对齐新套餐码**

找到按钮文案处：

```tsx
              {selectedPlan === 'annual' ? '立即订阅年度 Pro' : '立即订阅月度 Pro'}
```

替换为：

```tsx
              {selectedPlan === 'ANNUAL' ? '立即订阅年度 Pro' : '立即订阅月度 Pro'}
```

- [ ] **Step 8: 类型检查**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: 通过（exit 0）。若报 `Icon name` 类型不匹配，按 Step 2 注记回退图标 name。

- [ ] **Step 9: Commit**

```bash
git add Kairos-kakomon/app/paywall.tsx
git commit -m "feat(billing): paywall real two-step purchase with channel picker"
```

---

### Task 9: 前端 billing 页读真实订阅状态

**Files:**
- Modify: `Kairos-kakomon/app/billing.tsx`

**Interfaces:**
- Consumes: Task 7 `getBillingStatus` / `SubscriptionStatus`、`@tanstack/react-query` 的 `useQuery`（项目已用 v5）。
- Produces: 无（页面终点）。

- [ ] **Step 1: 顶部新增 import**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getBillingStatus } from '@/api/billing';
```

- [ ] **Step 2: 在组件内查询订阅状态**

在 `BillingScreen` 组件函数体内、`const router = useRouter();` 之后追加：

```typescript
  const { data: sub } = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: getBillingStatus,
  });
  const isPro = sub?.isPro ?? false;
  const expiresLabel = sub?.expiresAt
    ? new Date(sub.expiresAt).toLocaleDateString('zh-CN')
    : null;
```

- [ ] **Step 3: 当前套餐卡按 isPro 切换展示**

把「当前套餐」卡片块（`<View style={styles.planCard}>...</View>` 整段）替换为按状态切换：

```tsx
          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <View style={styles.planIcon}>
                <Icon name={isPro ? 'crown' : 'sparkles'} size={20} color={isPro ? Colors.amber500 : Colors.teal500} />
              </View>
              <View style={styles.planMeta}>
                <Text style={styles.planName}>{isPro ? 'Pro 会员' : '免费版'}</Text>
                <Text style={styles.planDesc}>
                  {isPro
                    ? (expiresLabel ? `有效期至 ${expiresLabel}` : 'Pro 权益已激活')
                    : '3 个研究科 · 最近 3 年 · 看广告解锁更多'}
                </Text>
              </View>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>{isPro ? 'Pro' : 'Free'}</Text>
              </View>
            </View>
            {!isPro && (
              <View style={styles.quotaRow}>
                <View style={styles.quotaTrack}>
                  <View style={[styles.quotaFill, { width: '67%' }]} />
                </View>
                <Text style={styles.quotaLabel}>今日 AI 已用 2 / 3 次</Text>
              </View>
            )}
          </View>
```

- [ ] **Step 4: 升级 CTA 仅在非 Pro 时显示**

把升级 CTA（`<Pressable style={styles.upgradeCard} ...>...</Pressable>`）用条件包裹：

```tsx
        {!isPro && (
          <Pressable style={styles.upgradeCard} onPress={() => router.push('/paywall' as any)}>
            {/* 原有内容保持不变 */}
          </Pressable>
        )}
```

> 注意：JSX 注释 `{/* ... */}` 不能作为真实代码，执行时保留 `<Pressable>` 内原有的 `upgradeLeft` / icon / 文案子树，只在外层加 `{!isPro && ( ... )}`。

- [ ] **Step 5: 类型检查**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: 通过（exit 0）。

- [ ] **Step 6: Commit**

```bash
git add Kairos-kakomon/app/billing.tsx
git commit -m "feat(billing): billing screen reads real subscription status"
```

---

### Task 10: 联调冒烟 + 文档收尾

**Files:**
- Modify: `docs/superpowers/specs/2026-06-30-membership-mock-payment-design.md`（状态改为「已实现」）
- 无新增代码（验证为主）

**Interfaces:**
- Consumes: 全部前序任务。

- [ ] **Step 1: 后端整体编译**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS。

- [ ] **Step 2: 前端整体校验**

Run: `cd Kairos-kakomon && npm run type-check && npm run lint`
Expected: type-check exit 0；lint 0 error（既有 warning 可保留）。

- [ ] **Step 3:（需本地 MySQL+Redis 时）后端 curl 冒烟**

前置：已执行 `V1_0`~`V1_3` 建表，后端 `./mvnw spring-boot:run` 启动，且有一个登录后的 access token（环境变量 `TOKEN`）。逐条执行：

```bash
# 1) 套餐列表（公开）
curl -s http://127.0.0.1:8080/api/billing/plans

# 2) 下单
curl -s -X POST http://127.0.0.1:8080/api/billing/orders \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"plan":"ANNUAL","channel":"WECHAT"}'
# 记下返回的 data.orderNo 存入 ORDER

# 3) 确认支付
curl -s -X POST "http://127.0.0.1:8080/api/billing/orders/$ORDER/confirm" \
  -H "Authorization: Bearer $TOKEN"
# 期望 data.isPro=true, expiresAt 约为今天+365天

# 4) 重复确认（幂等）
curl -s -X POST "http://127.0.0.1:8080/api/billing/orders/$ORDER/confirm" \
  -H "Authorization: Bearer $TOKEN"
# 期望与上一步相同的 expiresAt（未二次延期）

# 5) 状态
curl -s http://127.0.0.1:8080/api/billing/status -H "Authorization: Bearer $TOKEN"
# 期望 isPro=true

# 6) getMe 的 isPro
curl -s http://127.0.0.1:8080/api/users/me -H "Authorization: Bearer $TOKEN"
# 期望 data.isPro=true
```

逐条核对验收标准（spec §8 第 1-7 条）。无本地 DB 时跳过本步，仅靠 Step 1/2 的编译与类型门槛。

- [ ] **Step 4: 更新 spec 状态行**

把 spec 文件第 4 行 `状态：已确认，待写实现计划` 改为 `状态：已实现`。

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-06-30-membership-mock-payment-design.md
git commit -m "docs(billing): mark membership spec implemented"
```

---

## Self-Review

**1. Spec coverage（逐条对照 spec）：**
- §3.1 payment_order 表 → Task 2 ✅
- §3.2 subscription 表 → Task 2 ✅
- §3.3 isPro 实时算 → Task 5 `isProActive` + Task 6 `buildUserResponse` 改写 ✅
- §4 模块结构 + 105xx 错误码 → Task 1（码）、Task 3-6（各层）✅
- §5 ① plans → Task 5 `listPlans` + Task 6 controller ✅
- §5 ② status → Task 5 `getStatus` + controller ✅
- §5 ③ 下单 + 伪支付参数（三渠道）→ Task 5 `createOrder`/`buildMockPayParams` ✅
- §5 ④ 确认（事务/幂等/续费叠加）→ Task 5 `confirmOrder` ✅
- §5 ⑤ 取消 → Task 5 `cancelOrder` ✅
- §5 懒降级 → Task 5 `isProActive`/`toStatus` ✅
- §6 order_no 生成/时间/JSON/事务/DB 脚本 → Task 2 + Task 5 ✅
- §7 前端 billing.ts / paywall / billing 三处 → Task 7/8/9 ✅
- §7 settings 保留开发开关 → 不改动，已是现状 ✅
- §8 验收 → Task 10 冒烟 ✅
- §9 影响现有代码（buildUserResponse / ResultCode / SQL / 前端三文件）→ Task 6/1/2/7-9 ✅

**2. Placeholder scan:** 无 TBD/TODO；所有代码步骤含完整代码；图标缺失有明确回退策略（非占位）。

**3. Type consistency:**
- 后端套餐码全程大写 `MONTHLY/ANNUAL`（PlanType.name()），前端 `PlanCode` 同为大写，paywall `Plan` 别名也改为大写 → 一致。
- `getStatus`/`confirmOrder` 均返回 `SubscriptionStatusResponse`；前端 `getBillingStatus`/`confirmOrder` 均返回 `SubscriptionStatus` → 字段名 isPro/plan/startsAt/expiresAt/autoRenew 对齐。
- `isProActive(Long userId)` 在 Task 5 定义、Task 6 调用，签名一致。
- `BillingService` 方法名 listPlans/getStatus/createOrder/confirmOrder/cancelOrder/isProActive 在接口、impl、controller 三处一致。
- `getIsPro()` 命名与现有 `UserResponse` 一致，保证 Jackson 序列化字段名为 `isPro`（前端 RawUserResp.isPro 已依赖此名）。

无遗留问题。
