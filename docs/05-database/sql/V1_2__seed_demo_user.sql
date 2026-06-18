-- =============================================================
--  Kairos-kakomon 初始化脚本 V1.2 — 演示用户
--  对应前端 src/mocks/data.ts 中的 DEMO_USER (zhang@example.com)
--  仅用于本地 / 联调环境。生产环境请勿执行本脚本。
--  执行前请先依次执行 V1_0 与 V1_1。
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

-- -------------------------------------------------------------
--  1. user 主体 — 业务编号 demo-u-0000000001
-- -------------------------------------------------------------

INSERT INTO `user` (`user_no`, `status`, `register_from`)
VALUES ('demo-u-0000000001', 1, 'EMAIL');
SET @uid := LAST_INSERT_ID();

-- -------------------------------------------------------------
--  2. user_identity — 主邮箱
-- -------------------------------------------------------------

INSERT INTO `user_identity`
    (`user_id`, `identity_type`, `identity_value`, `verified`, `is_primary`)
VALUES
    (@uid, 'EMAIL', 'zhang@example.com', 1, 1);

-- -------------------------------------------------------------
--  3. user_credential — 占位密码 (Demo123!)，BCrypt cost=10
--  仅供本地登录联调使用，请务必在线上环境替换或删除。
-- -------------------------------------------------------------

INSERT INTO `user_credential`
    (`user_id`, `password_hash`, `password_salt`, `failed_count`)
VALUES
    (@uid,
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'demo-salt-placeholder',
     0);

-- -------------------------------------------------------------
--  4. user_profile — 与 DEMO_USER 字段一一对齐
--     selected_major_code: todai::info-sci::cs
--     major:              东大 · 情报理工学系研究科 · コンピュータ科学
-- -------------------------------------------------------------

INSERT INTO `user_profile` (
    `user_id`, `nickname`, `bio`, `avatar_color`,
    `major`, `selected_major_code`,
    `next_exam_name`, `next_exam_date`, `next_exam_duration`,
    `is_pro`, `free_ai_remaining`, `token_balance`,
    `solved_count`, `unclear_count`, `wrong_count`,
    `favorite_count`, `ai_ask_count`, `contributor_points`,
    `onboarding_completed`
) VALUES (
    @uid, '张同学', NULL, NULL,
    '东大 · 情报理工学系研究科 · コンピュータ科学', 'todai::info-sci::cs',
    '东大 · 情报理工修考 一次', '2026-08-25', 2,
    0, 1, 6,
    42, 11, 8,
    17, 23, 240,
    1
);

-- -------------------------------------------------------------
--  5. user_target_school — 两个目标校
-- -------------------------------------------------------------

INSERT INTO `user_target_school`
    (`user_id`, `university_code`, `school_type`, `grad_school_code`, `major_code`, `subjects`, `priority`)
VALUES
    (@uid, 'todai',  'daigakuin', 'info-sci', 'cs', JSON_ARRAY('数学','情报'), 1),
    (@uid, 'titech', 'daigakuin', 'info-sci', 'is', JSON_ARRAY('数学'),        2);
