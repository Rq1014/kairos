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
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    `code`            VARCHAR(40)     NOT NULL                COMMENT '业务码, 前端 universityId, e.g. todai',
    `name_cn`         VARCHAR(80)     NULL                    COMMENT '中文名, e.g. 东京大学',
    `name_jp`         VARCHAR(80)     NOT NULL                COMMENT '日文名(官方名), e.g. 東京大学',
    `name_en`         VARCHAR(120)    NULL                    COMMENT '英文名, e.g. The University of Tokyo',
    `short_name`      VARCHAR(20)     NOT NULL                COMMENT '简称, 前端列表/标签展示用, e.g. 东大',
    `type`            VARCHAR(16)     NOT NULL                COMMENT '办学性质: national=国立 / public=公立 / private=私立',
    `region`          VARCHAR(40)     NULL                    COMMENT '所在行政区/都道府县, e.g. 东京都',
    `region_group`    VARCHAR(20)     NULL                    COMMENT '前端筛选用大区分组, e.g. 首都圏 / 关西',
    `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '上架状态: 1=ONLINE(展示) / 2=OFFLINE(隐藏)',
    `sort_order`      INT             NOT NULL DEFAULT 0      COMMENT '排序权重, 值越大越靠前(desc)',
    `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    `updated_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`),
    KEY `idx_region_group` (`region_group`, `sort_order`),
    KEY `idx_type_status` (`type`, `status`)
) ENGINE = InnoDB COMMENT = '大学字典';

CREATE TABLE `grad_school` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    `university_id`  BIGINT UNSIGNED NOT NULL                 COMMENT '所属大学, ref university.id',
    `code`           VARCHAR(80)     NOT NULL                 COMMENT '业务码, 校内唯一短码, e.g. info-rikō',
    `name_cn`        VARCHAR(120)    NULL                     COMMENT '中文名, e.g. 情报理工学系研究科',
    `name_jp`        VARCHAR(120)    NOT NULL                 COMMENT '日文名(官方名), e.g. 情報理工学系研究科',
    `name_en`        VARCHAR(255)    NULL                     COMMENT '英文名',
    `category`       VARCHAR(20)     NOT NULL DEFAULT 'daigakuin' COMMENT '层级: daigakuin=大学院(研究科) / gakubu=学部(学院)',
    `sort_order`     INT             NOT NULL DEFAULT 0       COMMENT '校内排序权重, 值越大越靠前(desc)',
    `status`         TINYINT         NOT NULL DEFAULT 1       COMMENT '上架状态: 1=ONLINE(展示) / 2=OFFLINE(隐藏)',
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_uni_code` (`university_id`, `code`),
    KEY `idx_uni_sort` (`university_id`, `sort_order`)
) ENGINE = InnoDB COMMENT = '研究科 / 学院';

CREATE TABLE `major` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    `university_id`  BIGINT UNSIGNED NOT NULL                 COMMENT '所属大学, ref university.id(冗余, 便于直查)',
    `grad_school_id` BIGINT UNSIGNED NOT NULL                 COMMENT '所属研究科, ref grad_school.id',
    `code`           VARCHAR(80)     NOT NULL                 COMMENT '业务码, 前端 majorId, 同一研究科内唯一, e.g. cs',
    `label`          VARCHAR(120)    NOT NULL                 COMMENT '前端展示名 label, e.g. コンピュータ科学',
    `short`          VARCHAR(40)     NULL                     COMMENT '前端简称 short, e.g. CS',
    `description`    VARCHAR(255)    NULL                     COMMENT '前端描述 desc, 专业简介',
    `subjects`       JSON            NULL                     COMMENT '考试科目示例(字符串数组), e.g. ["数学","アルゴリズム"]',
    `sort_order`     INT             NOT NULL DEFAULT 0       COMMENT '研究科内排序权重, 值越大越靠前(desc)',
    `status`         TINYINT         NOT NULL DEFAULT 1       COMMENT '上架状态: 1=ONLINE(展示) / 2=OFFLINE(隐藏)',
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新',
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
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用, 不对外暴露',
    `user_no`        CHAR(20)        NOT NULL                 COMMENT '业务主键, 雪花/ULID, 暴露给前端',
    `status`         TINYINT         NOT NULL DEFAULT 1       COMMENT '账号状态: 1=ACTIVE / 2=FROZEN(冻结) / 3=DELETED(注销)',
    `register_from`  VARCHAR(20)     NOT NULL                 COMMENT '注册来源渠道: PHONE/EMAIL/WECHAT/APPLE/LINE',
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '注册时间',
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新',
    `deleted_at`     DATETIME(3)     NULL                     COMMENT '注销时间, 软删除标记, NULL=未注销',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_no` (`user_no`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`)
) ENGINE = InnoDB COMMENT = '用户主体';

CREATE TABLE `user_identity` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    `user_id`        BIGINT UNSIGNED NOT NULL                 COMMENT '所属用户, ref user.id',
    `identity_type`  VARCHAR(20)     NOT NULL                 COMMENT '身份类型: PHONE/EMAIL/WECHAT/APPLE/LINE',
    `identity_value` VARCHAR(255)    NOT NULL                 COMMENT '身份标识值: 手机号 / 邮箱(小写) / 第三方 openId',
    `verified`       TINYINT         NOT NULL DEFAULT 1       COMMENT '是否已验证: 1=已验证 / 0=未验证',
    `is_primary`     TINYINT         NOT NULL DEFAULT 0       COMMENT '该 type 内是否为主身份: 1=主 / 0=次',
    `bound_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '绑定时间',
    `last_login_at`  DATETIME(3)     NULL                     COMMENT '该身份最近一次登录时间, NULL=从未用它登录',
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_type_value` (`identity_type`, `identity_value`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_user_type` (`user_id`, `identity_type`)
) ENGINE = InnoDB COMMENT = '用户登录身份';

CREATE TABLE `user_credential` (
    `user_id`        BIGINT UNSIGNED NOT NULL                 COMMENT '所属用户, ref user.id, 同时为主键(一对一)',
    `password_hash`  VARCHAR(100)    NOT NULL                 COMMENT '密码哈希, BCrypt 60 字符',
    `password_salt`  VARCHAR(64)     NOT NULL                 COMMENT '密码盐值',
    `failed_count`   INT             NOT NULL DEFAULT 0       COMMENT '连续登录失败次数, 成功后清零',
    `locked_until`   DATETIME(3)     NULL                     COMMENT '锁定截止时间, NULL=未锁定; 超过阈值失败后置位',
    `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新',
    PRIMARY KEY (`user_id`)
) ENGINE = InnoDB COMMENT = '用户密码凭据';

CREATE TABLE `user_profile` (
    `user_id`              BIGINT UNSIGNED NOT NULL            COMMENT '所属用户, ref user.id, 同时为主键(一对一)',
    `nickname`             VARCHAR(30)     NOT NULL DEFAULT '小k'  COMMENT '昵称, 默认「小k」',
    `bio`                  VARCHAR(120)    NULL                COMMENT '个人简介',
    `avatar_url`           VARCHAR(512)    NULL                COMMENT '自定义头像 URL, NULL=用预设色',
    `avatar_color`         VARCHAR(20)     NULL                COMMENT '前端预设头像色 token, e.g. indigo',
    `major`                VARCHAR(120)    NULL                COMMENT '前端 selectedMajor.label 整串(冗余展示用)',
    `selected_major_code`  VARCHAR(255)    NULL                COMMENT '当前选中的专业复合码, 形如 todai::info-rikō::cs',
    `next_exam_name`       VARCHAR(60)     NULL                COMMENT '下次考试名称, 首页倒计时展示',
    `next_exam_date`       DATE            NULL                COMMENT '下次考试日期',
    `next_exam_duration`   SMALLINT        NULL                COMMENT '距考试倒计时天数(前端 durationDays), 冗余缓存',
    `is_pro`               TINYINT         NOT NULL DEFAULT 0  COMMENT '是否 Pro 会员: 1=是 / 0=否',
    `free_ai_remaining`    INT             NOT NULL DEFAULT 1  COMMENT '剩余免费 AI 提问次数',
    `token_balance`        INT             NOT NULL DEFAULT 0  COMMENT '代币余额(付费/激励货币)',
    `solved_count`         INT             NOT NULL DEFAULT 0  COMMENT '累计已解答题数',
    `unclear_count`        INT             NOT NULL DEFAULT 0  COMMENT '累计标记「未搞懂」题数',
    `wrong_count`          INT             NOT NULL DEFAULT 0  COMMENT '累计错题数',
    `favorite_count`       INT             NOT NULL DEFAULT 0  COMMENT '累计收藏题数',
    `ai_ask_count`         INT             NOT NULL DEFAULT 0  COMMENT '累计 AI 提问次数',
    `contributor_points`   INT             NOT NULL DEFAULT 0  COMMENT '贡献者积分(论坛/纠错等激励)',
    `onboarding_completed` TINYINT         NOT NULL DEFAULT 0  COMMENT '是否完成首次登录后的资料完善引导: 1=是 / 0=否',
    `created_at`           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    `updated_at`           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新',
    PRIMARY KEY (`user_id`)
) ENGINE = InnoDB COMMENT = '用户资料';

CREATE TABLE `user_target_school` (
    `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    `user_id`           BIGINT UNSIGNED NOT NULL              COMMENT '所属用户, ref user.id',
    `university_code`   VARCHAR(40)     NOT NULL              COMMENT '目标大学, ref university.code',
    `school_type`       VARCHAR(20)     NOT NULL DEFAULT 'daigakuin' COMMENT '层级: daigakuin=大学院 / gakubu=学部',
    `grad_school_code`  VARCHAR(80)     NULL                  COMMENT '目标研究科, ref grad_school.code, 学部志愿时可空',
    `major_code`        VARCHAR(80)     NULL                  COMMENT '目标专业, ref major.code, 未细化到专攻时可空',
    `subjects`          JSON            NULL                  COMMENT '关注科目数组, e.g. ["数学","英语"]',
    `priority`          INT             NOT NULL DEFAULT 1    COMMENT '志愿优先级, 升序(1=第一志愿); 免费额度取 priority 前 3',
    `created_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    `updated_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新',
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
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `user_id`        BIGINT UNSIGNED NULL                     COMMENT '命中的用户 id, ref user.id; NULL=身份不存在的失败尝试',
    `identity_type`  VARCHAR(20)     NOT NULL                 COMMENT '尝试登录的身份类型: PHONE/EMAIL/WECHAT/APPLE/LINE',
    `identity_value` VARCHAR(255)    NOT NULL                 COMMENT '尝试登录的身份标识值',
    `login_method`   VARCHAR(20)     NOT NULL                 COMMENT '登录方式: CODE(验证码)/PASSWORD/REFRESH(续签)/THIRD_PARTY',
    `success`        TINYINT         NOT NULL                 COMMENT '是否成功: 1=成功 / 0=失败',
    `fail_reason`    VARCHAR(64)     NULL                     COMMENT '失败原因, success=0 时填, e.g. WRONG_PASSWORD',
    `client_ip`      VARCHAR(64)     NULL                     COMMENT '客户端 IP(兼容 IPv6)',
    `user_agent`     VARCHAR(255)    NULL                     COMMENT '客户端 User-Agent',
    `device_id`      VARCHAR(80)     NULL                     COMMENT '设备标识',
    `trace_id`       CHAR(32)        NULL                     COMMENT '请求链路追踪 id, 关联 Result.traceId',
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '发生时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id_created` (`user_id`, `created_at`),
    KEY `idx_identity` (`identity_type`, `identity_value`)
) ENGINE = InnoDB COMMENT = '登录审计';

CREATE TABLE `verify_code_log` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `identity_type`  VARCHAR(20)     NOT NULL                 COMMENT '接收方身份类型: PHONE/EMAIL',
    `identity_value` VARCHAR(255)    NOT NULL                 COMMENT '接收方身份标识值: 手机号 / 邮箱',
    `scene`          VARCHAR(20)     NOT NULL                 COMMENT '发送场景: LOGIN/BIND(绑定)/UNBIND(解绑)/RESET_PASSWORD(重置密码)',
    `client_ip`      VARCHAR(64)     NULL                     COMMENT '请求方客户端 IP, 用于频控',
    `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '发送时间',
    PRIMARY KEY (`id`),
    KEY `idx_identity_created` (`identity_type`, `identity_value`, `created_at`)
) ENGINE = InnoDB COMMENT = '验证码发送审计';

SET FOREIGN_KEY_CHECKS = 1;
