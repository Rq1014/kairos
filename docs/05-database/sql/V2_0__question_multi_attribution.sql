-- =============================================================
-- Kairos-kakomon 迁移脚本 V2.0 — 题目/试卷多归属(M:N)
-- 对应设计: docs/superpowers/specs/2026-07-09-question-multi-attribution-design.md
-- 破坏性: question/exam_paper 删 5 列, 归属迁入 scope 表
-- 执行环境: MySQL 8.x, utf8mb4
-- =============================================================
USE `kakomon`;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `question_scope`;
DROP TABLE IF EXISTS `exam_paper_scope`;

-- 散题归属(仅 paper_code IS NULL 的题)
CREATE TABLE `question_scope` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `question_code`    VARCHAR(80)  NOT NULL COMMENT '散题 code, 关联 question.code',
    `university_code`  VARCHAR(40)  NOT NULL,
    `grad_school_code` VARCHAR(80)  NOT NULL,
    `major_code`       VARCHAR(80)  NOT NULL,
    `subject_code`     VARCHAR(40)  NOT NULL,
    `year`             SMALLINT     NOT NULL,
    `sort_order`       INT          NOT NULL DEFAULT 0 COMMENT '主归属排序(小在前)',
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_q_scope` (`question_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`),
    KEY `idx_scope_filter` (`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='散题归属(M:N, 五元组)';

-- 试卷归属
CREATE TABLE `exam_paper_scope` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `paper_code`       VARCHAR(80)  NOT NULL COMMENT '试卷 code, 关联 exam_paper.code',
    `university_code`  VARCHAR(40)  NOT NULL,
    `grad_school_code` VARCHAR(80)  NOT NULL,
    `major_code`       VARCHAR(80)  NOT NULL,
    `subject_code`     VARCHAR(40)  NOT NULL,
    `year`             SMALLINT     NOT NULL,
    `sort_order`       INT          NOT NULL DEFAULT 0,
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_p_scope` (`paper_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`),
    KEY `idx_pscope_filter` (`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试卷归属(M:N, 五元组)';

-- 回填: 现有每散题/每卷正好一条归属
INSERT INTO `question_scope`
  (`question_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,`sort_order`)
SELECT `code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,0
FROM `question` WHERE `paper_code` IS NULL;

INSERT INTO `exam_paper_scope`
  (`paper_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,`sort_order`)
SELECT `code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,0
FROM `exam_paper`;

-- 删主表五列 + 旧索引
ALTER TABLE `question`
    DROP KEY `idx_q_filter`,
    DROP COLUMN `university_code`,
    DROP COLUMN `grad_school_code`,
    DROP COLUMN `major_code`,
    DROP COLUMN `year`,
    DROP COLUMN `subject_code`;

ALTER TABLE `exam_paper`
    DROP KEY `uk_paper_scope`,
    DROP KEY `idx_paper_filter`,
    DROP COLUMN `university_code`,
    DROP COLUMN `grad_school_code`,
    DROP COLUMN `major_code`,
    DROP COLUMN `year`,
    DROP COLUMN `subject_code`;
