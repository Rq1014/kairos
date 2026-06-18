-- =============================================================
--  Kairos-kakomon 初始化脚本 V1.0 — Schema (DDL)
--  对应 TRD：preparationWork/后TRD设计文档.md (v1.2)
--  执行环境：MySQL 8.x，utf8mb4 / utf8mb4_0900_ai_ci
-- =============================================================

CREATE DATABASE IF NOT EXISTS `kakomon`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `kakomon`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
--  1. 字典域：大学 / 研究科 / 专业
-- -------------------------------------------------------------

DROP TABLE IF EXISTS `major`;
DROP TABLE IF EXISTS `grad_school`;
DROP TABLE IF EXISTS `university`;

CREATE TABLE `university` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code`            VARCHAR(40)     NOT NULL                COMMENT '前端 universityId, e.g. todai',
    `name_cn`         VARCHAR(80)     NULL                    COMMENT '中文名, e.g. 东京大学',
    `name_jp`         VARCHAR(80)     NOT NULL                COMMENT '日文名, e.g. 東京大学',
    `name_en`         VARCHAR(120)    NULL                    COMMENT '英文名',
    `short_name`      VARCHAR(20)     NOT NULL                COMMENT '简称, e.g. 东大',
    `type`            VARCHAR(16)     NOT NULL                COMMENT 'national=国立 / private=私立',
    `region`          VARCHAR(40)     NULL                    COMMENT '行政区, e.g. 关东',
    `region_group`    VARCHAR(20)     NULL                    COMMENT '前端筛选用大区, e.g. 首都圏',
    `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '1=ONLINE / 2=OFFLINE',
    `sort_order`      INT             NOT NULL DEFAULT 0      COMMENT '默认排序权重 desc',
    `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`),
    KEY `idx_region_group` (`region_group`, `sort_order`),
    KEY `idx_type_status` (`type`, `status`)
) ENGINE = InnoDB COMMENT = '大学字典';

CREATE TABLE `grad_school` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `university_id`  BIGINT UNSIGNED NOT NULL,
    `code`           VARCHAR(80)     NOT NULL                 COMMENT '校内唯一短码, e.g. info-rikō',
    `name_cn`        VARCHAR(120)    NULL,
    `name_jp`        VARCHAR(120)    NOT NULL,
    `name_en`        VARCHAR(255)    NULL,
    `category`       VARCHAR(20)     NOT NULL DEFAULT 'daigakuin' COMMENT 'daigakuin=大学院 / gakubu=学部',
    `sort_order`     INT             NOT NULL DEFAULT 0,
    `status`         TINYINT         NOT NULL DEFAULT 1,
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_uni_code` (`university_id`, `code`),
    KEY `idx_uni_sort` (`university_id`, `sort_order`)
) ENGINE = InnoDB COMMENT = '研究科 / 学院';

CREATE TABLE `major` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `university_id`  BIGINT UNSIGNED NOT NULL,
    `grad_school_id` BIGINT UNSIGNED NOT NULL,
    `code`           VARCHAR(80)     NOT NULL                 COMMENT '前端 majorId, 同一研究科内唯一, e.g. cs',
    `label`          VARCHAR(120)    NOT NULL                 COMMENT '前端 label, e.g. コンピュータ科学',
    `short`          VARCHAR(40)     NULL                     COMMENT '前端 short, e.g. CS',
    `description`    VARCHAR(255)    NULL                     COMMENT '前端 desc',
    `subjects`       JSON            NULL                     COMMENT '考试科目示例 ["数学","アルゴリズム"]',
    `sort_order`     INT             NOT NULL DEFAULT 0,
    `status`         TINYINT         NOT NULL DEFAULT 1,
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_grad_code` (`grad_school_id`, `code`),
    KEY `idx_uni_grad` (`university_id`, `grad_school_id`, `sort_order`)
) ENGINE = InnoDB COMMENT = '专业 / 専攻';

-- -------------------------------------------------------------
--  2. 用户域：用户主体 / 身份 / 凭据 / 资料 / 目标学校
-- -------------------------------------------------------------

DROP TABLE IF EXISTS `user_target_school`;
DROP TABLE IF EXISTS `user_profile`;
DROP TABLE IF EXISTS `user_credential`;
DROP TABLE IF EXISTS `user_identity`;
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_no`        CHAR(20)        NOT NULL                 COMMENT '业务主键, 雪花/ULID, 暴露给前端',
    `status`         TINYINT         NOT NULL DEFAULT 1       COMMENT '1=ACTIVE, 2=FROZEN, 3=DELETED',
    `register_from`  VARCHAR(20)     NOT NULL                 COMMENT 'PHONE/EMAIL/WECHAT/APPLE/LINE',
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at`     DATETIME(3)     NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_no` (`user_no`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`)
) ENGINE = InnoDB COMMENT = '用户主体';

CREATE TABLE `user_identity` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`        BIGINT UNSIGNED NOT NULL,
    `identity_type`  VARCHAR(20)     NOT NULL                 COMMENT 'PHONE/EMAIL/WECHAT/APPLE/LINE',
    `identity_value` VARCHAR(255)    NOT NULL                 COMMENT '手机号 / 邮箱(小写) / openId',
    `verified`       TINYINT         NOT NULL DEFAULT 1,
    `is_primary`     TINYINT         NOT NULL DEFAULT 0       COMMENT '该 type 内是否为主身份',
    `bound_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login_at`  DATETIME(3)     NULL,
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_type_value` (`identity_type`, `identity_value`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_user_type` (`user_id`, `identity_type`)
) ENGINE = InnoDB COMMENT = '用户登录身份';

CREATE TABLE `user_credential` (
    `user_id`        BIGINT UNSIGNED NOT NULL,
    `password_hash`  VARCHAR(100)    NOT NULL                 COMMENT 'BCrypt 60 字符',
    `password_salt`  VARCHAR(64)     NOT NULL,
    `failed_count`   INT             NOT NULL DEFAULT 0,
    `locked_until`   DATETIME(3)     NULL,
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`user_id`)
) ENGINE = InnoDB COMMENT = '用户密码凭据';

CREATE TABLE `user_profile` (
    `user_id`              BIGINT UNSIGNED NOT NULL,
    `nickname`             VARCHAR(30)     NOT NULL DEFAULT '小k',
    `bio`                  VARCHAR(120)    NULL,
    `avatar_url`           VARCHAR(512)    NULL,
    `avatar_color`         VARCHAR(20)     NULL                COMMENT '前端预设色 token',
    `major`                VARCHAR(120)    NULL                COMMENT '前端 selectedMajor.label 整串',
    `selected_major_code`  VARCHAR(255)    NULL                COMMENT '当前选中的专业 code, 形如 todai::info-rikō::cs',
    `next_exam_name`       VARCHAR(60)     NULL,
    `next_exam_date`       DATE            NULL,
    `next_exam_duration`   SMALLINT        NULL,
    `is_pro`               TINYINT         NOT NULL DEFAULT 0,
    `free_ai_remaining`    INT             NOT NULL DEFAULT 1,
    `token_balance`        INT             NOT NULL DEFAULT 0,
    `solved_count`         INT             NOT NULL DEFAULT 0,
    `unclear_count`        INT             NOT NULL DEFAULT 0,
    `wrong_count`          INT             NOT NULL DEFAULT 0,
    `favorite_count`       INT             NOT NULL DEFAULT 0,
    `ai_ask_count`         INT             NOT NULL DEFAULT 0,
    `contributor_points`   INT             NOT NULL DEFAULT 0,
    `onboarding_completed` TINYINT         NOT NULL DEFAULT 0,
    `created_at`           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`user_id`)
) ENGINE = InnoDB COMMENT = '用户资料';

CREATE TABLE `user_target_school` (
    `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`           BIGINT UNSIGNED NOT NULL,
    `university_code`   VARCHAR(40)     NOT NULL              COMMENT 'ref university.code',
    `school_type`       VARCHAR(20)     NOT NULL DEFAULT 'daigakuin' COMMENT 'daigakuin/gakubu',
    `grad_school_code`  VARCHAR(80)     NULL                  COMMENT 'ref grad_school.code',
    `major_code`        VARCHAR(80)     NULL                  COMMENT 'ref major.code',
    `subjects`          JSON            NULL                  COMMENT '科目数组',
    `priority`          INT             NOT NULL DEFAULT 1,
    `created_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    KEY `idx_user_priority` (`user_id`, `priority`),
    KEY `idx_uni_code` (`university_code`),
    KEY `idx_grad_code` (`university_code`, `grad_school_code`)
) ENGINE = InnoDB COMMENT = '用户目标学校';

-- -------------------------------------------------------------
--  3. 审计 / 风控
-- -------------------------------------------------------------

DROP TABLE IF EXISTS `login_audit`;
DROP TABLE IF EXISTS `verify_code_log`;

CREATE TABLE `login_audit` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`        BIGINT UNSIGNED NULL,
    `identity_type`  VARCHAR(20)     NOT NULL,
    `identity_value` VARCHAR(255)    NOT NULL,
    `login_method`   VARCHAR(20)     NOT NULL                 COMMENT 'CODE/PASSWORD/REFRESH/THIRD_PARTY',
    `success`        TINYINT         NOT NULL,
    `fail_reason`    VARCHAR(64)     NULL,
    `client_ip`      VARCHAR(64)     NULL,
    `user_agent`     VARCHAR(255)    NULL,
    `device_id`      VARCHAR(80)     NULL,
    `trace_id`       CHAR(32)        NULL,
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    KEY `idx_user_id_created` (`user_id`, `created_at`),
    KEY `idx_identity` (`identity_type`, `identity_value`)
) ENGINE = InnoDB COMMENT = '登录审计';

CREATE TABLE `verify_code_log` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `identity_type`  VARCHAR(20)     NOT NULL,
    `identity_value` VARCHAR(255)    NOT NULL,
    `scene`          VARCHAR(20)     NOT NULL                 COMMENT 'LOGIN/BIND/UNBIND/RESET_PASSWORD',
    `client_ip`      VARCHAR(64)     NULL,
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    KEY `idx_identity_created` (`identity_type`, `identity_value`, `created_at`)
) ENGINE = InnoDB COMMENT = '验证码发送审计';

SET FOREIGN_KEY_CHECKS = 1;
