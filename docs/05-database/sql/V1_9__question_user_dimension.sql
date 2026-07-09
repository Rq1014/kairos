-- =============================================================
-- Kairos-kakomon 迁移脚本 V1.9 — 题目用户维度(难度投票 + 掌握自评)
-- 对应设计: docs/superpowers/specs/2026-07-09-question-detail-crowd-mastery-design.md
-- 执行环境: MySQL 8.x, utf8mb4 / utf8mb4_0900_ai_ci
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `question_difficulty_vote`;
DROP TABLE IF EXISTS `question_user_mastery`;

-- 难度投票: 每用户每题一票, 可改投(upsert)
CREATE TABLE `question_difficulty_vote` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`       BIGINT UNSIGNED NOT NULL                COMMENT '用户 id',
    `question_code` VARCHAR(80)     NOT NULL                COMMENT '题目 code',
    `vote`          VARCHAR(8)      NOT NULL                COMMENT 'easy/medium/hard',
    `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_question` (`user_id`, `question_code`),
    KEY `idx_question` (`question_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目难度投票(每用户每题一票,可改投)';

-- 掌握自评: 每用户每题一条最新状态
CREATE TABLE `question_user_mastery` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`       BIGINT UNSIGNED NOT NULL                COMMENT '用户 id',
    `question_code` VARCHAR(80)     NOT NULL                COMMENT '题目 code',
    `mastery`       VARCHAR(16)     NOT NULL                COMMENT 'mastered/unclear/wrong',
    `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_question` (`user_id`, `question_code`),
    KEY `idx_question` (`question_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户对题目的掌握自评(每用户每题一条最新)';
