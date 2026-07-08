-- =============================================================
--  Kairos-kakomon 迁移脚本 V1.8 — 科目字典 + 专业-科目关联
--  对应设计文档：docs/superpowers/specs/2026-07-08-subject-major-dimension-design.md
--  执行环境：MySQL 8.x，utf8mb4 / utf8mb4_0900_ai_ci
--  前置：V1_0（university/grad_school/major）、V1_1（字典种子）
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `major_subject`;
DROP TABLE IF EXISTS `subject`;

-- -------------------------------------------------------------
--  科目字典（全局，一个概念全站共用）
-- -------------------------------------------------------------
CREATE TABLE `subject` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `code`       VARCHAR(40)     NOT NULL                COMMENT '全站唯一科目 code, 如 math',
    `name_cn`    VARCHAR(60)     NULL                    COMMENT '中文名, 如 数学',
    `name_jp`    VARCHAR(60)     NOT NULL                COMMENT '日文名, 如 数学',
    `sort_order` INT             NOT NULL DEFAULT 0      COMMENT '全局默认排序权重',
    `status`     TINYINT         NOT NULL DEFAULT 1      COMMENT '1=上线 0=下线',
    `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_subject_code` (`code`)
) ENGINE = InnoDB COMMENT = '科目字典(全局)';

-- -------------------------------------------------------------
--  专业 ↔ 科目关联（绑三码, 因 major.code 仅研究科内唯一）
-- -------------------------------------------------------------
CREATE TABLE `major_subject` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `university_code`  VARCHAR(40)     NOT NULL                COMMENT '大学 code',
    `grad_school_code` VARCHAR(80)     NOT NULL                COMMENT '研究科 code',
    `major_code`       VARCHAR(80)     NOT NULL                COMMENT '专业 code',
    `subject_code`     VARCHAR(40)     NOT NULL                COMMENT '科目 code, 关联 subject.code',
    `sort_order`       INT             NOT NULL DEFAULT 0      COMMENT '该专业内科目展示顺序',
    `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_major_subject` (`university_code`, `grad_school_code`, `major_code`, `subject_code`),
    KEY `idx_ms_subject` (`subject_code`)
) ENGINE = InnoDB COMMENT = '专业-科目关联';

-- -------------------------------------------------------------
--  种子：科目字典
-- -------------------------------------------------------------
INSERT INTO `subject` (`code`, `name_cn`, `name_jp`, `sort_order`) VALUES
  ('math',      '数学',       '数学',           100),
  ('algorithm', '算法',       'アルゴリズム',     90),
  ('info',      '情报',       '情報',           80),
  ('english',   '英语',       '英語',           70);

-- -------------------------------------------------------------
--  种子：专业-科目关联（东大 info-sci / cs → 数学）
-- -------------------------------------------------------------
INSERT INTO `major_subject` (`university_code`, `grad_school_code`, `major_code`, `subject_code`, `sort_order`) VALUES
  ('todai', 'info-sci', 'cs', 'math',      100),
  ('todai', 'info-sci', 'cs', 'algorithm',  90);
