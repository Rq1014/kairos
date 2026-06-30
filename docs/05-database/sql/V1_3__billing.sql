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
